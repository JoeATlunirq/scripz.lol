document.addEventListener('DOMContentLoaded', () => {
    console.log('[Scripz Extension] Popup DOMContentLoaded');
    const messageDiv = document.getElementById('message');
    const transcriptContentDiv = document.getElementById('transcript-content');
    const transcriptActionsDiv = document.getElementById('transcript-actions');
    const copyButton = document.getElementById('copyButton');
    const downloadButton = document.getElementById('downloadButton');
    const API_BASE_URL = 'https://www.scripz.lol/api'; // Your deployed API base URL

    let currentTranscriptText = ''; // To store the fetched transcript
    let currentVideoId = ''; // To store the video ID for download filename

    function displayMessage(message, isError = false) {
        console.log(`[Scripz Extension] Displaying message: ${message}, isError: ${isError}`);
        messageDiv.textContent = message;
        if (isError) {
            messageDiv.classList.add('error');
        } else {
            messageDiv.classList.remove('error');
        }
        transcriptContentDiv.textContent = '';
        transcriptActionsDiv.style.display = 'none'; // Hide actions when message is shown
        currentTranscriptText = '';
        currentVideoId = '';
    }

    function extractVideoId(url) {
        if (!url) return null;
        let videoId = null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
                // Check for Shorts URL first: youtube.com/shorts/VIDEO_ID
                const shortsMatch = urlObj.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
                if (shortsMatch && shortsMatch[1]) {
                    videoId = shortsMatch[1];
                } else {
                    // Fallback to regular video URL: youtube.com/watch?v=VIDEO_ID
                    videoId = urlObj.searchParams.get('v');
                }
            } else if (urlObj.hostname === 'youtu.be') {
                // For youtu.be/VIDEO_ID URLs
                videoId = urlObj.pathname.substring(1);
            }
        } catch (e) {
            console.error('[Scripz Extension] Error parsing URL in extractVideoId:', e, 'URL was:', url);
            return null;
        }
        console.log(`[Scripz Extension] Extracted videoId: ${videoId} from URL: ${url}`);
        return videoId;
    }

    // Event Listeners for Copy and Download
    copyButton.addEventListener('click', () => {
        if (currentTranscriptText) {
            navigator.clipboard.writeText(currentTranscriptText)
                .then(() => {
                    // copyButton.textContent = '✅'; // Checkmark - Removed for SVG
                    const originalTitle = copyButton.title;
                    copyButton.title = 'Copied!';
                    // Optional: Add a class for visual feedback
                    // copyButton.classList.add('copied'); 
                    setTimeout(() => {
                        // copyButton.textContent = '📄'; // Revert to original icon - Removed for SVG
                        copyButton.title = originalTitle;
                        // copyButton.classList.remove('copied');
                    }, 1500);
                })
                .catch(err => {
                    console.error('[Scripz Extension] Failed to copy transcript:', err);
                    const originalTitle = copyButton.title;
                    copyButton.title = 'Failed to copy!';
                    // copyButton.textContent = '❌'; // Removed for SVG
                    setTimeout(() => { 
                        // copyButton.textContent = '📄'; // Removed for SVG
                        copyButton.title = originalTitle;
                    }, 2000);
                });
        }
    });

    downloadButton.addEventListener('click', () => {
        if (currentTranscriptText && currentVideoId) {
            const filename = `transcript_${currentVideoId}.txt`;
            const blob = new Blob([currentTranscriptText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link); // Required for Firefox
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else if (currentTranscriptText) {
            // Fallback if videoId wasn't captured for some reason
            const filename = `transcript_download.txt`;
            const blob = new Blob([currentTranscriptText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.warn('[Scripz Extension] Downloading without videoId in filename.');
        }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        console.log('[Scripz Extension] chrome.tabs.query callback invoked.');
        const currentTab = tabs[0];
        if (!currentTab || !currentTab.url) {
            console.error('[Scripz Extension] Could not get current tab information or URL.', currentTab);
            displayMessage('Could not get current tab information.', true);
            return;
        }

        const videoUrl = currentTab.url;
        console.log(`[Scripz Extension] Current tab URL: ${videoUrl}`);
        
        const tabVideoId = extractVideoId(videoUrl); // Use a local var for videoId from tab

        if (tabVideoId) {
            currentVideoId = tabVideoId; // Store it for download button
            displayMessage('Fetching transcript...');
            console.log(`[Scripz Extension] Attempting to fetch transcript for videoId: ${currentVideoId}, URL: ${videoUrl}`);
            try {
                const apiUrl = `${API_BASE_URL}/get_transcript`;
                console.log(`[Scripz Extension] Fetching from API URL: ${apiUrl}`);
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ video_url: videoUrl }),
                });

                console.log('[Scripz Extension] Raw fetch response:', response);
                console.log(`[Scripz Extension] Response status: ${response.status}, ok: ${response.ok}`);

                if (!response.ok) {
                    let errorData = { message: `HTTP error! status: ${response.status}` };
                    try {
                        errorData = await response.json();
                        console.error('[Scripz Extension] API error response data:', errorData);
                    } catch (jsonError) {
                        console.error('[Scripz Extension] Failed to parse error response as JSON:', jsonError);
                    }
                    throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('[Scripz Extension] Parsed JSON data from API:', data);

                if (data && data.full_text) {
                    console.log('[Scripz Extension] Transcript found in API response.');
                    currentTranscriptText = data.full_text;
                    currentVideoId = data.video_id || tabVideoId; // Prefer video_id from API if available, else use the one from URL
                    messageDiv.textContent = ''; 
                    transcriptContentDiv.textContent = currentTranscriptText;
                    transcriptActionsDiv.style.display = 'flex'; // Show actions
                } else {
                    console.warn('[Scripz Extension] No transcript found in API response or data.full_text is missing.', data);
                    displayMessage('No transcript found or an error occurred.', true);
                }
            } catch (error) {
                console.error('[Scripz Extension] Error fetching transcript:', error);
                displayMessage(`Error: ${error.message}`, true);
            }
        } else {
            console.log('[Scripz Extension] Not a recognized YouTube video page.');
            displayMessage('Not a YouTube video page. Please navigate to a YouTube video.', false);
        }
    });
}); 