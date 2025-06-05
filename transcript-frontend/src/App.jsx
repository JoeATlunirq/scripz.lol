import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import { FaCopy, FaDownload, FaCheck } from 'react-icons/fa'

// This component now represents the content for the main page hosted at "/"
function App() {
  const [videoUrlInput, setVideoUrlInput] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [displayText, setDisplayText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCopiedIndicator, setShowCopiedIndicator] = useState(false)
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [currentVideoIdForDownload, setCurrentVideoIdForDownload] = useState('')

  const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  // If VITE_API_BASE_URL is explicitly defined (e.g., set to "" or "/" in Vercel), use it.
  // Otherwise (if it's undefined, like when not set in Vercel or during local dev without .env), fallback to localhost.
  const API_BASE_URL = typeof envApiBaseUrl !== 'undefined' ? envApiBaseUrl : 'http://localhost:5002';

  // Effect to determine mode based on input
  useEffect(() => {
    const urls = videoUrlInput.split('\n').map(url => url.trim()).filter(url => url);
    setIsBulkMode(urls.length > 1);
    if (urls.length <=1 && currentVideoIdForDownload && urls[0] === '') {
        // Clear video id if user clears the single URL input after a successful fetch
        setCurrentVideoIdForDownload('');
    }
  }, [videoUrlInput, currentVideoIdForDownload]);

  const handleSubmit = async () => {
    const urls = videoUrlInput.split('\n').map(url => url.trim()).filter(url => url);

    if (urls.length === 0) {
      setError('Please enter at least one YouTube video URL.');
      setDisplayText('');
      return;
    }

    setIsLoading(true);
    setError('');
    setDisplayText('');
    setShowCopiedIndicator(false);
    // setCurrentVideoIdForDownload(''); // Reset video ID for download on new submit

    if (isBulkMode) {
      if (!apiKey) {
        setError('API key is required for bulk transcript fetching.');
        setIsLoading(false);
        return;
      }
      try {
        const apiUrl = `${API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL}/api/bulk-transcripts`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
          body: JSON.stringify({ video_urls: urls }),
        });
        const responseBodyText = await response.text();
        if (!response.ok) throw new Error(responseBodyText || `HTTP error! status: ${response.status}`);
        setDisplayText(responseBodyText);
        setCurrentVideoIdForDownload(''); // Clear any single video ID
      } catch (err) {
        console.error("Bulk fetch error:", err);
        setError(err.message || 'Failed to fetch bulk transcripts.');
        setDisplayText('');
      }
    } else { // Single URL mode
      try {
        const apiUrl = `${API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL}/api/transcript`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_url: urls[0] }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);
        // setDisplayText(`Video ID: ${data.video_id}\nLanguage: ${data.language}\n\n${data.transcript}`);
        setDisplayText(data.transcript);
        setCurrentVideoIdForDownload(data.video_id || 'transcript');
      } catch (err) {
        console.error("Single fetch error:", err);
        setError(err.message || 'Failed to fetch transcript.');
        setDisplayText('');
        setCurrentVideoIdForDownload('');
      }
    }
    setIsLoading(false);
  };

  const handleCopyTranscript = () => {
    if (displayText) {
      navigator.clipboard.writeText(displayText)
        .then(() => {
          setShowCopiedIndicator(true)
          setTimeout(() => setShowCopiedIndicator(false), 1500)
        })
        .catch(err => {
          console.error('Failed to copy: ', err)
        })
    }
  }

  const handleDownloadTranscript = () => {
    if (displayText) {
      const filename = isBulkMode ? "transcripts.txt" : `transcript_${currentVideoIdForDownload || 'video'}.txt`;
      const blob = new Blob([displayText], { type: 'text/plain;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    }
  }

  return (
    <>
      <h1 className="title">Scripz - Quick YT Transcripts</h1>
      <p className="tagline">Paste YouTube links (one per line). Get text. Clean & simple.</p>
      
      <div className="input-area">
        <textarea
          value={videoUrlInput}
          onChange={(e) => setVideoUrlInput(e.target.value)}
          placeholder="Enter YouTube Video URL(s) (one per line)"
          rows={isBulkMode ? 5 : 3}
        />
        <div className="input-row">
          {isBulkMode && (
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API Key for Bulk Mode"
            />
          )}
          <button className="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Fetching...' : (isBulkMode ? 'Get Bulk Transcripts' : 'Get Transcript')}
          </button>
        </div>
      </div>

      <div 
        className={`transcript-display ${
          isLoading ? 'loading' : ''
        } ${
          error ? 'error' : ''
        } ${
          !isLoading && !displayText && !error ? 'placeholder' : ''
        }`}
      >
        {displayText && !error && (
          <div className="transcript-actions">
            <button 
              className="button icon-button" 
              onClick={handleCopyTranscript}
              title={showCopiedIndicator ? "Copied!" : "Copy Transcript"}
            >
              {showCopiedIndicator ? <FaCheck /> : <FaCopy />}
            </button>
            <button 
              className="button icon-button" 
              onClick={handleDownloadTranscript}
              title={isBulkMode ? "Download Transcripts (.txt)" : "Download Transcript (.txt)"}
            >
              <FaDownload />
            </button>
          </div>
        )}

        {isLoading 
          ? 'Loading...' 
          : error 
            ? `Error: ${error}`
            : displayText 
              ? displayText 
              : 'Transcript(s) will appear here... (For bulk, failures will be listed first if any occur)'}
      </div>

      <div className="info-sections-wrapper">
        <div className="info-card">
          <h3>How It Works</h3>
          <ol>
            <li>Paste your YouTube video URLs.</li>
            <li>Click "Get Bulk Transcripts".</li>
            <li>Read, copy, or download your text.</li>
          </ol>
        </div>
        
        <div className="info-card">
          <h3>Features</h3>
          <ul>
            <li><strong>Fast:</strong> Transcripts generated in moments.</li>
            <li><strong>Simple:</strong> Easy to use, no fuss.</li>
            <li><strong>Direct:</strong> Get the core text of videos.</li>
            <li><strong>Copy & Download:</strong> Easily save your transcripts.</li>
          </ul>
        </div>
      </div>

      <div className="footer-links">
        <Link to="/api-docs" className="footer-link">View API Documentation</Link>
        <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
      </div>
    </>
  )
}

export default App
