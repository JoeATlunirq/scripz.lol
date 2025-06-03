document.addEventListener('DOMContentLoaded', () => {
    const messageDiv = document.getElementById('message');
    const transcriptContentDiv = document.getElementById('transcript-content');
    const API_BASE_URL = 'https://www.scripz.lol/api'; // Your deployed API base URL

    function displayMessage(message, isError = false) {
        messageDiv.textContent = message;
        if (isError) {
            messageDiv.classList.add('error');
        } else {
            messageDiv.classList.remove('error');
        }
        transcriptContentDiv.textContent = '';
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
            console.error('Error parsing URL:', e);
            return null;
        }
        return videoId;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const currentTab = tabs[0];
        if (!currentTab || !currentTab.url) {
            displayMessage('Could not get current tab information.', true);
            return;
        }

        const videoUrl = currentTab.url;
        const videoId = extractVideoId(videoUrl);

        if (videoId) {
            displayMessage('Fetching transcript...');
            try {
                const response = await fetch(`${API_BASE_URL}/get_transcript`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ videoUrl: videoUrl }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch transcript. API error.' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                if (data.transcript) {
                    messageDiv.textContent = ''; // Clear loading message
                    transcriptContentDiv.textContent = data.transcript;
                } else {
                    displayMessage('No transcript found or an error occurred.', true);
                }
            } catch (error) {
                console.error('Error fetching transcript:', error);
                displayMessage(`Error: ${error.message}`, true);
            }
        } else {
            displayMessage('Not a YouTube video page. Please navigate to a YouTube video.', false);
        }
    });
}); 