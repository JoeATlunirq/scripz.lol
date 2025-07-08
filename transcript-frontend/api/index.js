import 'dotenv/config'; // Load .env file contents into process.env
import express from 'express';
import cors from 'cors';
import { getSubtitles as getSubtitlesFromScraper } from 'youtube-captions-scraper';
import { YoutubeTranscript } from 'youtube-transcript';
import axios from 'axios'; // Used for RapidAPI now
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js'; // Added Supabase client

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase URL or Service Role Key is missing. Please check your .env file in the api/ directory.");
    // process.exit(1); // Optionally exit if Supabase isn't configured, or handle gracefully
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

const ADMIN_API_PASSWORD = process.env.ADMIN_PASSWORD_FOR_KEY_MANAGEMENT;
if (!ADMIN_API_PASSWORD && process.env.NODE_ENV !== 'development') {
    console.warn('CRITICAL: ADMIN_PASSWORD_FOR_KEY_MANAGEMENT is not set in .env. Admin API endpoints will be vulnerable if exposed.');
    // In a production scenario, you might want to prevent the app from starting or disable admin routes.
}

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Middleware for API Key Authentication and Rate Limiting
async function authenticateApiKey(req, res, next) {
    if (!supabase) {
        console.error("Supabase client not initialized. API key authentication skipped.");
        // Depending on your security policy, you might want to deny access here
        // return res.status(503).json({ error: "API service temporarily unavailable." });
        return next(); // Or allow through if Supabase is optional for some endpoints or dev
    }

    const apiKey = req.headers['x-api-key'];
    const requestPath = req.path;
    const clientIp = req.ip;
    const videoUrl = req.body.video_url; // Assuming video_url is in the body for logging
    const videoId = extractVideoId(videoUrl);

    if (!apiKey) {
        return res.status(401).json({ error: 'API key is missing. Please include it in the X-API-Key header.' });
    }

    try {
        const { data: apiKeyData, error: apiKeyError } = await supabase
            .from('api_keys')
            // Updated column name for monthly limit, removed per_minute
            .select('id, client_name, is_active, rate_limit_requests_per_month, last_used_at')
            .eq('api_key', apiKey)
            .single();

        if (apiKeyError || !apiKeyData) {
            console.warn(`Invalid API key received: ${apiKey}. Error: ${apiKeyError?.message}`);
            // Log failed attempt (optional, could be noisy)
            // await supabase.from('api_usage_logs').insert({ api_key_id: null, path: requestPath, status_code: 403, ip_address: clientIp, video_id_requested: videoId, notes: 'Invalid API Key' });
            return res.status(403).json({ error: 'Invalid API key.' });
        }

        if (!apiKeyData.is_active) {
            console.warn(`Inactive API key used: ${apiKeyData.client_name} (${apiKey})`);
            await supabase.from('api_usage_logs').insert({ api_key_id: apiKeyData.id, path: requestPath, status_code: 403, ip_address: clientIp, video_id_requested: videoId, notes: 'Inactive API Key' });
            return res.status(403).json({ error: 'API key is inactive.' });
        }

        // Monthly Rate Limiting Logic
        if (apiKeyData.rate_limit_requests_per_month !== -1) { // -1 means infinite
            const today = new Date();
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            // const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString(); // Alternative: end of current month

            const { data: usageLogs, error: usageLogError, count: usageCount } = await supabase
                .from('api_usage_logs')
                .select('id', { count: 'exact', head: true }) // Just get the count
                .eq('api_key_id', apiKeyData.id)
                .gte('requested_at', firstDayOfMonth);
            
            if (usageLogError) {
                console.error('Error fetching usage logs for rate limiting:', usageLogError);
                // Decide if you want to fail open or closed. For now, fail open (log and continue).
            } else if (usageCount !== null && apiKeyData.rate_limit_requests_per_month !== null && usageCount >= apiKeyData.rate_limit_requests_per_month) {
                console.warn(`Monthly rate limit exceeded for key: ${apiKeyData.client_name} (${apiKey})`);
                // Log this specific attempt that got rate limited, before returning the error
                await supabase.from('api_usage_logs').insert({ api_key_id: apiKeyData.id, path: req.path, status_code: 429, ip_address: req.ip, video_id_requested: extractVideoId(req.body.video_url), notes: 'Rate Limit Exceeded (Month)' });
                return res.status(429).json({ error: 'API rate limit exceeded for the month. Please try again later.' });
            }
        }
        
        req.apiKeyData = apiKeyData;
        next();
    } catch (error) {
        console.error('Error during API key authentication:', error);
        return res.status(500).json({ error: 'Internal server error during API key authentication.' });
    }
}

// Function to log API usage (can be called from routes after processing)
async function logApiUsage(apiKeyData, path, statusCode, videoIdRequested, details = null) {
    if (!supabase || !apiKeyData || !apiKeyData.id) {
        console.warn('Skipping API usage log: Supabase client not initialized or missing API key data.');
        return;
    }
    try {
        const logEntry = {
            api_key_id: apiKeyData.id,
            path: path,
            status_code: statusCode,
            ip_address: null,
            video_id_requested: videoIdRequested,
        };
        if (details) {
            logEntry.details = details;
        }

        const { error } = await supabase.from('api_usage_logs').insert(logEntry);

        if (error) {
            // Check if the error is due to the 'details' column not existing
            if (error.code === '42703' || (error.message && error.message.includes('column "details" of relation "api_usage_logs" does not exist'))) {
                console.warn("Could not log 'details' column, it may not exist in 'api_usage_logs'. Attempting to log without it.");
                delete logEntry.details; // Remove the details field and try again
                const retryError = (await supabase.from('api_usage_logs').insert(logEntry)).error;
                if (retryError) {
                    console.error('Error logging API usage on retry (without details):', retryError);
                }
            } else {
                console.error('Error logging API usage:', error);
            }
        }
        // Update last_used_at for the API key
        await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKeyData.id);

    } catch (logError) {
        console.error('Exception during API usage logging:', logError);
    }
}

function decodeHTMLEntities(text) {
    if (typeof text !== 'string') return '';
    // Numeric entities (decimal and hex)
    text = text.replace(/&amp;#(\d+);/g, (match, dec) => String.fromCharCode(dec));
    text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
    text = text.replace(/&amp;#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
    text = text.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

    // Named entities
    const entities = {
        '&amp;': '&',
        '&quot;': '"',
        '&apos;': "'", // XML/XHTML apostrophe
        '&#39;': "'",  // HTML apostrophe (decimal)
        '&#039;': "'", // HTML apostrophe (decimal with leading zero)
        '&lt;': '<',
        '&gt;': '>',
        // Add more common entities if needed
        '&nbsp;': ' ',
        '&iexcl;': '¡',
        '&cent;': '¢',
        '&pound;': '£',
        '&yen;': '¥',
        '&euro;': '€',
        '&copy;': '©',
        '&reg;': '®'
    };
    for (const entity in entities) {
        text = text.replace(new RegExp(entity, 'g'), entities[entity]);
    }
    return text;
}

function extractVideoId(url) {
    if (!url) return null;
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/,
        /(?:youtube\.com\/(?:[^\/]+\/(?:v|e(?:mbed)?)|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// This function formats transcript segments into paragraphs based on timing
function formatTranscriptTextWithParagraphs(captions) {
    if (!captions || captions.length === 0) {
        return "";
    }

    const getCleanText = (snippet) => {
        if (snippet && typeof snippet.text === 'string') {
            // First, decode HTML entities, then remove musical notes, then trim.
            let text = decodeHTMLEntities(snippet.text);
            text = text.replace(/\s*♪\s*/g, '').trim();
            return text;
        }
        // console.warn('Invalid snippet or snippet.text is not a string:', snippet);
        return '';
    };

    let segments = [];
    let currentSegment = getCleanText(captions[0]);
    const paragraph_break_threshold = 0.7; // seconds

    for (let i = 1; i < captions.length; i++) {
        const prevSnippet = captions[i-1];
        const currentSnippet = captions[i];
        
        if (!prevSnippet || typeof prevSnippet.start === 'undefined' || typeof prevSnippet.dur === 'undefined' || !currentSnippet || typeof currentSnippet.start === 'undefined') {
            // console.warn('Skipping segment due to malformed snippet data:', { prevSnippet, currentSnippet });
            continue;
        }

        const prevSnippetStart = parseFloat(prevSnippet.start);
        const prevSnippetDur = parseFloat(prevSnippet.dur);
        const currentSnippetStart = parseFloat(currentSnippet.start);

        if (isNaN(prevSnippetStart) || isNaN(prevSnippetDur) || isNaN(currentSnippetStart)) {
            // console.warn('Skipping segment due to invalid timing data:', { prevSnippet, currentSnippet });
            continue; 
        }

        const gap = currentSnippetStart - (prevSnippetStart + prevSnippetDur);
        const cleanText = getCleanText(currentSnippet);

        if (cleanText === '' && currentSegment === '') continue;

        if (gap > paragraph_break_threshold) {
            if (currentSegment) segments.push(currentSegment);
            currentSegment = cleanText;
        } else {
            currentSegment += (currentSegment && cleanText ? " " : "") + cleanText;
        }
    }
    if (currentSegment) segments.push(currentSegment);
    
    return segments.join('\n\n').replace(/\s+\n\n/g, '\n\n').trim();
}

async function fetchTranscriptWithRapidAPI(videoId) {
    const rapidApiKey = process.env.RAPIDAPI_TOKEN;
    if (!rapidApiKey) {
        console.error('[RapidAPI] API token not found. Skipping RapidAPI.');
        return { error: 'RapidAPI token not configured on server.', captions: null, source: 'rapidapi' };
    }

    const options = {
        method: 'GET',
        url: 'https://youtube-transcriptor.p.rapidapi.com/transcript',
        params: {
            video_id: videoId,
            lang: 'en' // Requesting English explicitly
        },
        headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': 'youtube-transcriptor.p.rapidapi.com'
        },
        timeout: 30000 // 30 second timeout
    };

    try {
        console.log(`Attempt 1: Fetching with RapidAPI (youtube-transcriptor) for video ID: ${videoId}`);
        const response = await axios.request(options);

        // The new API returns an array with one object
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const videoData = response.data[0];
            
            // Check if we have transcription data
            if (videoData.transcription && Array.isArray(videoData.transcription) && videoData.transcription.length > 0) {
                console.log('[RapidAPI] Successfully fetched transcript data.');
                console.log('[RapidAPI] First transcript item from API:', JSON.stringify(videoData.transcription[0]));

                const adaptedCaptions = videoData.transcription.map(item => {
                    const startNum = parseFloat(item.start);
                    const durationNum = parseFloat(item.dur);

                    if (isNaN(startNum) || isNaN(durationNum)) {
                        console.warn(`[RapidAPI] Invalid numeric value for start/duration in item: Start=${item.start}, Duration=${item.dur}`);
                        return { text: item.subtitle, start: '0.000', dur: '0.000', invalid: true };
                    }

                    return {
                        text: item.subtitle,
                        start: startNum.toFixed(3),
                        dur: durationNum.toFixed(3)
                    };
                }).filter(item => !item.invalid);
                
                return { captions: adaptedCaptions, error: null, source: 'rapidapi' };
            } else {
                console.warn('[RapidAPI] No transcription data in response:', response.data);
                return { error: 'RapidAPI did not return transcription data.', captions: null, source: 'rapidapi' };
            }
        } else {
            console.warn('[RapidAPI] No data in response or unexpected format:', response.data);
            return { error: 'RapidAPI returned empty or invalid response.', captions: null, source: 'rapidapi' };
        }
    } catch (err) {
        console.error('[RapidAPI] Error during API call:', err.response ? err.response.data : err.message);
        const errorMessage = err.response && err.response.data && err.response.data.error 
                           ? err.response.data.error 
                           : (err.message || 'Unknown error during RapidAPI call.');
        return { error: errorMessage, captions: null, source: 'rapidapi', errorObject: err };
    }
}

async function fetchTranscriptLogic(videoUrl, apiKeyData) {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
        return { error: 'Invalid YouTube URL or could not extract video ID', status: 400 };
    }

    let captionsForFormatting = null;
    let methodUsed = '';
    let language = 'en';
    let errors = {};
    let statusCode = 200;
    let logNotes = "";

    // --- Concurrent Fetching ---
    console.log(`Starting concurrent fetch for video ID: ${videoId}`);
    const rapidApiPromise = fetchTranscriptWithRapidAPI(videoId);
    const scraperPromise = getSubtitlesFromScraper({ videoID: videoId, lang: 'en' })
        .catch(err => {
            console.error('[youtube-captions-scraper] Promise rejection:', err);
            return { error: err.message || 'Scraper promise failed', fromScraperError: true };
        });

    const [rapidApiResult, scraperResult] = await Promise.all([
        rapidApiPromise,
        scraperPromise
    ]);

    // --- Result Processing ---
    // 1. Prioritize RapidAPI
    if (rapidApiResult && rapidApiResult.captions && rapidApiResult.captions.length > 0) {
        captionsForFormatting = rapidApiResult.captions;
        methodUsed = 'RapidAPI';
        language = rapidApiResult.language || 'en';
        logNotes = 'Success via RapidAPI.';
    } 
    // 2. Fallback to youtube-captions-scraper
    else if (scraperResult && Array.isArray(scraperResult) && scraperResult.length > 0) {
        errors.rapidapi = (rapidApiResult && rapidApiResult.error) ? rapidApiResult.error : 'RapidAPI returned no captions.';
        console.log(`[Fallback] RapidAPI failed (${errors.rapidapi}). Using youtube-captions-scraper result.`);
        captionsForFormatting = scraperResult;
        methodUsed = 'youtube-captions-scraper (fallback)';
        logNotes = `RapidAPI Failed. Success via scraper fallback.`;
    } 
    // 3. If both concurrent fetches fail, try youtube-transcript as a last resort
    else {
        errors.rapidapi = (rapidApiResult && rapidApiResult.error) ? rapidApiResult.error : 'RapidAPI returned no captions.';
        errors.scraper = (scraperResult && scraperResult.error) ? scraperResult.error : 'Scraper returned no captions or was invalid.';
        logNotes = `RapidAPI Failed: ${errors.rapidapi}. Scraper Failed: ${errors.scraper}. `;
        
        console.log(`Final fallback: Trying youtube-transcript for ${videoId}.`);
        try {
            const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
            if (transcriptItems && transcriptItems.length > 0) {
                captionsForFormatting = transcriptItems.map(item => ({
                    text: item.text,
                    start: (item.offset / 1000).toFixed(3),
                    dur: (item.duration / 1000).toFixed(3)
                }));
                methodUsed = 'youtube-transcript (fallback 2)';
                logNotes += 'Success via youtube-transcript fallback.';
            } else {
                errors.ytTranscript = 'youtube-transcript found no captions.';
                logNotes += 'youtube-transcript also failed.';
            }
        } catch (err) {
            console.error(`[youtube-transcript] Error for video ${videoId}:`, err);
            errors.ytTranscript = err.message || 'Unknown error from youtube-transcript';
            logNotes += `youtube-transcript also failed: ${errors.ytTranscript}.`;
        }
    }

    // --- Formatting and Response ---
    let finalTranscriptOutput = null;
    if (captionsForFormatting) {
        finalTranscriptOutput = formatTranscriptTextWithParagraphs(captionsForFormatting);
    }

    if (!finalTranscriptOutput) {
        statusCode = 502;
        const finalError = errors.ytTranscript || errors.scraper || errors.rapidapi || 'All transcript sources failed.';
        const logMessage = `Failed: ${logNotes}`;
        if (apiKeyData) {
            await logApiUsage(apiKeyData, '/api/transcript', statusCode, videoId, logMessage);
        }
        return { error: finalError, status: statusCode, details: errors };
    }

    if (apiKeyData) {
        await logApiUsage(apiKeyData, '/api/transcript', statusCode, videoId, `Success via ${methodUsed}`);
    }

    return {
        transcript: finalTranscriptOutput,
        videoId: videoId,
        language: language,
        method: methodUsed,
        status: statusCode
    };
}

// --- ADMIN AUTHENTICATION MIDDLEWARE ---
function authenticateAdmin(req, res, next) {
    const providedPassword = req.headers['x-admin-password'];

    if (!ADMIN_API_PASSWORD) {
        console.error('Admin password not configured on server. Denying access to admin route.');
        return res.status(500).json({ error: 'Admin functionality not configured.' });
    }

    if (!providedPassword) {
        return res.status(401).json({ error: 'Admin password missing. Provide it in X-Admin-Password header.' });
    }

    if (providedPassword === ADMIN_API_PASSWORD) {
        next(); // Password is correct
    } else {
        return res.status(403).json({ error: 'Invalid admin password.' });
    }
}

// UI-facing endpoint (no API key needed for now)
app.post('/api/transcript', async (req, res) => {
    const { video_url } = req.body;
    console.log(`UI request for /api/transcript: ${video_url}`);
    
    const videoId = extractVideoId(video_url);
    if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // We call fetchTranscriptLogic but don't pass apiKeyData, so it won't log to api_usage_logs table
    // Or, if we wanted, we could have a "internal_ui" key with specific logging, but not for this iteration.
    const result = await fetchTranscriptLogic(video_url, null); 

    if (result.error) {
        return res.status(result.status || 500).json({ error: result.error, details: result.details });
    }

    res.json({
        transcript: result.transcript,
        video_id: result.videoId,
        language: result.language
        // method is not exposed to UI
    });
});

// Public API endpoint (requires API key)
app.post('/api/get_transcript', authenticateApiKey, async (req, res) => {
    const { video_url } = req.body;
    console.log(`API request for /api/get_transcript: ${video_url}`);

    const videoId = extractVideoId(video_url);
    if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // req.apiKeyData is populated by the authenticateApiKey middleware
    const result = await fetchTranscriptLogic(video_url, req.apiKeyData);

    if (result.error) {
        return res.status(result.status || 500).json({ error: result.error, details: result.details });
    }

    res.json({
        video_id: result.videoId,
        language: result.language,
        full_text: result.transcript,
        method: result.method
    });
});

// New Bulk Transcripts Endpoint (requires API key)
app.post('/api/bulk-transcripts', authenticateApiKey, async (req, res) => {
    // Spreading out requests to avoid hitting the per-second rate limit.
    // A 550ms delay results in ~1.8 requests/sec, safely under the 2 req/sec limit.
    const { video_urls, delay = 550 } = req.body;

    if (!Array.isArray(video_urls) || video_urls.length === 0) {
        return res.status(400).json({ error: 'Please provide a non-empty array of video_urls.' });
    }

    console.log(`API request for /api/bulk-transcripts: ${video_urls.length} URLs. Delay between starting each request: ${delay}ms`);

    const validUrls = video_urls.filter(url => typeof url === 'string' && url.trim());
    const promises = [];

    for (const url of validUrls) {
        // Start the fetch logic, but don't wait for it to complete here.
        // Add the promise to an array to be awaited later.
        const promise = fetchTranscriptLogic(url, req.apiKeyData)
            .then(result => ({ url, ...result }))
            .catch(error => ({ url, error: error.message || 'An unknown error occurred', transcript: null }));
        
        promises.push(promise);
        
        // Wait for the specified delay before starting the next request.
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Now, wait for all the in-flight promises to complete.
    const results = await Promise.all(promises);

    let allTranscriptsText = '';
    const failedUrls = [];
    let successfulCount = 0;

    results.forEach(result => {
        if (result.transcript) {
            if (allTranscriptsText.length > 0) {
                allTranscriptsText += '\\n\\n';
            }
            allTranscriptsText += result.transcript;
            successfulCount++;
        } else {
            console.warn(`Failed to fetch transcript for ${result.url} in bulk mode. Error: ${result.error}`);
            failedUrls.push({
                url: result.url,
                error: result.error,
                details: result.details,
                videoId: extractVideoId(result.url)
            });
        }
    });

    let responseText = '';
    if (failedUrls.length > 0) {
        responseText += `Bulk Transcript Fetch Summary:\n`;
        responseText += `Successfully fetched: ${successfulCount} transcript(s).\n`;
        responseText += `Failed to fetch: ${failedUrls.length} transcript(s).\n\n`;
        responseText += `Details for failures:\n`;
        failedUrls.forEach(failure => {
            responseText += `-------------------------------------\n`;
            responseText += `URL: ${failure.url}\n`;
            if (failure.videoId) responseText += `Video ID: ${failure.videoId}\n`;
            responseText += `Error: ${failure.error}\n`;
            if (failure.details && typeof failure.details === 'object') {
                 responseText += `Details: ${JSON.stringify(failure.details)}\n`;
            } else if (failure.details) {
                responseText += `Details: ${failure.details}\n`;
            }
        });
        responseText += `-------------------------------------\n\n`;
    }

    if (successfulCount > 0) {
        responseText += allTranscriptsText;
    } else if (failedUrls.length > 0 && successfulCount === 0) {
        // All failed, just send the error report as text
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename="transcript_errors.txt"');
        return res.status(400).send(responseText); // Use 400 or another appropriate error for partial/total failure
    } else { // No URLs provided effectively or all were invalid before processing
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename="transcripts.txt"');
        return res.status(200).send("No valid video URLs processed or no transcripts found.");
    }
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="transcripts.txt"');
    res.status(200).send(responseText.trim());
});

// --- ADMIN API KEY MANAGEMENT ENDPOINTS ---
const adminRouter = express.Router();
adminRouter.use(authenticateAdmin); // Protect all routes in adminRouter

// GET /admin/api/keys - List all API keys
adminRouter.get('/keys', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase client not initialized.' });
    try {
        const { data, error } = await supabase
            .from('api_keys')
            // Updated column name, removed per_minute
            .select('id, client_name, api_key, is_active, rate_limit_requests_per_month, created_at, last_used_at, notes')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error listing API keys:', error);
        res.status(500).json({ error: 'Failed to list API keys', details: error.message });
    }
});

// POST /admin/api/keys - Create a new API key
adminRouter.post('/keys', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase client not initialized.' });
    const { 
        client_name,
        rate_limit_requests_per_month, // Changed from per_day
        notes,
        is_active
    } = req.body;

    if (!client_name) {
        return res.status(400).json({ error: 'client_name is required.' });
    }

    const apiKeyData = {
        client_name,
        notes,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        // Default to -1 (infinite) if not provided or invalid, or use the provided value
        rate_limit_requests_per_month: (rate_limit_requests_per_month !== undefined && !isNaN(parseInt(rate_limit_requests_per_month))) 
                                            ? parseInt(rate_limit_requests_per_month) 
                                            : -1, 
    };

    try {
        const { data, error } = await supabase
            .from('api_keys')
            .insert(apiKeyData)
            // Updated column name in select
            .select('id, client_name, api_key, is_active, rate_limit_requests_per_month, created_at, notes')
            .single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating API key:', error);
        res.status(500).json({ error: 'Failed to create API key', details: error.message });
    }
});

// PUT /admin/api/keys/:key_id - Update an API key
adminRouter.put('/keys/:key_id', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase client not initialized.' });
    const { key_id } = req.params;
    const updates = req.body;

    delete updates.api_key;
    delete updates.id;
    delete updates.created_at;

    if (updates.is_active !== undefined) updates.is_active = Boolean(updates.is_active);
    
    // Handle rate_limit_requests_per_month update
    if (updates.rate_limit_requests_per_month !== undefined) {
        const limit = parseInt(updates.rate_limit_requests_per_month);
        if (!isNaN(limit)) {
            updates.rate_limit_requests_per_month = limit; // Accepts numbers, including -1
        } else {
            // If it's not a valid number, perhaps remove it or set to default (-1)
            // For now, let's remove it to avoid storing bad data. Or error out.
            return res.status(400).json({ error: 'rate_limit_requests_per_month must be a valid number (or -1 for infinite).'});
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No update fields provided.' });
    }

    try {
        const { data, error } = await supabase
            .from('api_keys')
            .update(updates)
            .eq('id', key_id)
            // Updated column name
            .select('id, client_name, api_key, is_active, rate_limit_requests_per_month, created_at, last_used_at, notes')
            .single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'API key not found or no changes made.' });
        res.json(data);
    } catch (error) {
        console.error(`Error updating API key ${key_id}:`, error);
        res.status(500).json({ error: 'Failed to update API key', details: error.message });
    }
});

// DELETE /admin/api/keys/:key_id - Delete an API key
adminRouter.delete('/keys/:key_id', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase client not initialized.' });
    const { key_id } = req.params;

    try {
        const { error, count } = await supabase
            .from('api_keys')
            .delete({ count: 'exact' })
            .eq('id', key_id);

        if (error) throw error;
        if (count === 0) {
            return res.status(404).json({ error: 'API key not found.' });
        }
        res.status(200).json({ message: 'API key deleted successfully.', id: key_id });
    } catch (error) {
        console.error(`Error deleting API key ${key_id}:`, error);
        res.status(500).json({ error: 'Failed to delete API key', details: error.message });
    }
});

// Mount the admin router
app.use('/admin/api', adminRouter);

// Root endpoint for testing or Vercel checks
app.get('/', (req, res) => {
    res.status(200).send('YouTube Transcript API is running! Access transcripts via POST /api/get_transcript or POST /api/transcript. Environment: ' + (process.env.NODE_ENV || 'development'));
});

// Optional: A simple health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler (optional, for unhandled errors)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

app.listen(PORT, () => {
    console.log(`YouTube Transcript Backend API server running on port ${PORT}. NODE_ENV=${process.env.NODE_ENV || 'development'}`);
    if (!supabase) {
        console.warn("Supabase client is not initialized. API key features will be affected.");
    }
});

export default app; 