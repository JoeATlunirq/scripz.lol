import React from 'react';
import './App.css'; // Reuse existing styles

const DiscordIcon = () => <span style={{ marginRight: '8px' }}>👾</span>;

function ApiDocs() {
  let apiBaseForDisplay = import.meta.env.VITE_API_BASE_URL;
  const primaryDomain = 'https://www.scripz.lol'; // Your primary domain

  // Check if apiBaseForDisplay is a full URL (starts with http/https) 
  // AND is not pointing to localhost or a common local IP.
  const isLocalUrl = (url) => {
    if (!url) return false;
    return url.includes('localhost') || url.includes('127.0.0.1');
  };

  const isFullExternalUrl = apiBaseForDisplay && 
                            apiBaseForDisplay.startsWith('http') && 
                            !isLocalUrl(apiBaseForDisplay);

  if (isFullExternalUrl) {
    // VITE_API_BASE_URL is set to a specific external backend (e.g., staging), so use it.
  } else {
    // Default to primaryDomain if VITE_API_BASE_URL is relative ('/'), empty, or a local URL.
    apiBaseForDisplay = primaryDomain;
  }
 
  const displayedApiUrlGetTranscript = `${apiBaseForDisplay}/api/get_transcript`;
  const displayedApiUrlBulkTranscripts = `${apiBaseForDisplay}/api/bulk-transcripts`;
  const displayedApiDomain = apiBaseForDisplay.replace(/https?:\/\//, '').split('/')[0];

  return (
    <div className="api-docs-page-wrapper"> 
      <h1 className="title">API Documentation</h1>
      <p className="tagline">Access YouTube video transcripts programmatically via our simple API. (Live API at {displayedApiDomain})</p>

      {/* API Key Information Card */}
      <div className="info-card api-docs-card api-key-info-card">
        <h3 className="api-endpoint-title">API Key Required</h3>
        <p>To use the Scripz API, you need an API key. This helps us monitor usage and ensure fair access for everyone.</p>
        <p>Your API key must be included in the <code>X-API-Key</code> header of your requests.</p>
        <p style={{ marginTop: '15px', fontWeight: 'bold' }}>How to get an API Key & Information on Pricing:</p>
        <p>Please reach out to us directly to get your API key and discuss any applicable pricing tiers for higher volume usage. We're happy to help you get started!</p>
        <a 
          href="https://discord.com/users/1292234446308900927"
          target="_blank" 
          rel="noopener noreferrer"
          className="button discord-button-docs" 
          style={{ marginTop: '15px', marginBottom: '10px'}} // Added margin bottom
        >
          <DiscordIcon />
          Contact for API Key & Pricing (DM on Discord)
        </a>
      </div>

      {/* Card for /api/get_transcript */}
      <div className="info-card api-docs-card">
        <h3 className="api-endpoint-title">Get Transcript Data</h3>
        <p>This endpoint allows you to retrieve the full transcript of any public YouTube video. The transcript is returned in a structured JSON format, containing the video's unique ID, the language of the transcript, and the complete text, thoughtfully formatted with paragraph breaks for readability.</p>
        <p><strong>Endpoint:</strong> <code>{displayedApiUrlGetTranscript}</code></p>
        <p><strong>Method:</strong> <code>POST</code></p>
        <p><strong>Headers:</strong></p>
        <pre className="code-block-docs">
          <code>
            {JSON.stringify({ "X-API-Key": "YOUR_API_KEY_HERE" }, null, 2)}
          </code>
        </pre>
        <p><strong>Request Body:</strong> You'll need to send a JSON object containing the URL of the YouTube video.</p>
        <pre className="code-block-docs">
          <code>
            {JSON.stringify({ video_url: "https://www.youtube.com/watch?v=your_video_id" }, null, 2)}
          </code>
        </pre>
        
        <h4 className="api-response-title">Successful Response (200 OK):</h4>
        <p>On success, the API will return a JSON object with the video ID, detected language, and the full transcript text.</p>
        <pre className="code-block-docs">
          <code>
            {JSON.stringify({
              video_id: "your_video_id",
              language: "en", // Example language code
              full_text: "The complete transcript text...\n\nFormatted with paragraph breaks for a story-like feel..."
              // 'method' field removed as it's an internal detail
            }, null, 2)}
          </code>
        </pre>

        <h4 className="api-response-title">Common Error Responses:</h4>
        <ul>
          <li><strong>401 Unauthorized:</strong> API key missing or not provided in the <code>X-API-Key</code> header.</li>
          <li><strong>403 Forbidden:</strong> Invalid API key or the key is inactive.</li>
          <li><strong>429 Too Many Requests:</strong> API rate limit exceeded for your key. Please try again later or contact us if you need higher limits.</li>
          <li><strong>400 Bad Request:</strong> This usually means the <code>video_url</code> was missing from your request, or the URL provided was not a valid YouTube video link. Please check the URL and try again.</li>
          <li><strong>404 Not Found:</strong> This error indicates that a transcript could not be found for the requested video. This might happen if the video is private, has been deleted, or simply does not have captions available in any language.</li>
          <li><strong>500 Internal Server Error:</strong> If you see this, something unexpected went wrong on our end. We monitor for these, but if it persists, feel free to let us know.</li>
        </ul>
        <p><em>Example error response format:</em></p>
         <pre className="code-block-docs">
          <code>
            {JSON.stringify({ error: "A descriptive message about what went wrong." }, null, 2)}
          </code>
        </pre>
      </div>

      {/* New Card for /api/bulk-transcripts */}
      <div className="info-card api-docs-card">
        <h3 className="api-endpoint-title">Bulk Get Transcripts (Text File)</h3>
        <p>This endpoint allows you to retrieve transcripts for multiple YouTube videos at once. It returns a single plain text file (<code>transcripts.txt</code>) containing all successfully fetched transcripts, each separated by two newlines (<code>\n\n</code>). If any URLs fail, a summary of these failures will be included at the top of the file. If all URLs fail, a <code>transcript_errors.txt</code> file with only the error summary is returned.</p>
        <p><strong>Endpoint:</strong> <code>{displayedApiUrlBulkTranscripts}</code></p>
        <p><strong>Method:</strong> <code>POST</code></p>
        <p><strong>Headers:</strong></p>
        <pre className="code-block-docs">
          <code>
            {JSON.stringify({ 
              "Content-Type": "application/json",
              "X-API-Key": "YOUR_API_KEY_HERE" 
            }, null, 2)}
          </code>
        </pre>
        <p><strong>Request Body:</strong> Send a JSON object containing an array of YouTube video URLs.</p>
        <pre className="code-block-docs">
          <code>
            {JSON.stringify({ 
              video_urls: [
                "https://www.youtube.com/watch?v=video_id_1",
                "https://www.youtube.com/watch?v=video_id_2",
                "https://youtu.be/video_id_3"
              ] 
            }, null, 2)}
          </code>
        </pre>
        
        <h4 className="api-response-title">Successful Response (200 OK):</h4>
        <p>On success, the API will return a <code>text/plain</code> response. The browser will typically trigger a download for a file named <code>transcripts.txt</code> (or <code>transcript_errors.txt</code> if all fail).</p>
        <p><em>Example content of <code>transcripts.txt</code> (with one failure and two successes):</em></p>
        <pre className="code-block-docs">
          <code>
            {`Bulk Transcript Fetch Summary:
Successfully fetched: 2 transcript(s).
Failed to fetch: 1 transcript(s).

Details for failures:
-------------------------------------
URL: https://www.youtube.com/watch?v=failed_video_id
Video ID: failed_video_id
Error: Failed to fetch transcript for video ID: failed_video_id using all available methods. Last error (Kome.ai): Kome.ai method failed.. Previous failure (rapidapi): RapidAPI method failed.. Previous failure (scraper): youtube-captions-scraper found no captions (received: ). Previous failure (ytTranscript): youtube-transcript found no captions (received: ).
-------------------------------------

Transcript for video_id_1...

Paragraphs are separated by double newlines...


Transcript for video_id_2...

More text here...`}
          </code>
        </pre>

        <h4 className="api-response-title">Common Error Responses (HTTP Status Codes):</h4>
        <ul>
          <li><strong>400 Bad Request:</strong> Missing <code>video_urls</code> array, empty array, or other issues with the request format. The response body (if plain text) may contain more details (like an error summary if all URLs are invalid before processing).</li>
          <li><strong>401 Unauthorized:</strong> API key missing.</li>
          <li><strong>403 Forbidden:</strong> Invalid or inactive API key.</li>
          <li><strong>429 Too Many Requests:</strong> API rate limit exceeded.</li>
          <li><strong>500 Internal Server Error:</strong> Server-side issue.</li>
        </ul>
        <p><em>Note: Even with a 200 OK, the downloaded text file may contain error messages for individual URLs if they could not be processed. A 400 status might be returned if ALL URLs fail processing within the API logic, and the body will be the error report.</em></p>
      </div>

      {/* Card for /api/transcript (REMOVED) */}
      {/* ... content removed ... */}

      <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '20px' }}>
        <a href="/" className="button">Back to Transcript Generator</a>
      </div>
    </div>
  );
}

export default ApiDocs; 