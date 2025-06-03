import { useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import { FaCopy, FaDownload, FaCheck } from 'react-icons/fa'

// This component now represents the content for the main page hosted at "/"
function App() {
  const [videoUrl, setVideoUrl] = useState('')
  const [transcript, setTranscript] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoInfo, setVideoInfo] = useState({ id: '', lang: '' })
  const [showCopiedIndicator, setShowCopiedIndicator] = useState(false)

  const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  // If VITE_API_BASE_URL is explicitly defined (e.g., set to "" or "/" in Vercel), use it.
  // Otherwise (if it's undefined, like when not set in Vercel or during local dev without .env), fallback to localhost.
  const API_BASE_URL = typeof envApiBaseUrl !== 'undefined' ? envApiBaseUrl : 'http://localhost:5002';

  const fetchTranscript = async () => {
    if (!videoUrl) {
      setError('Please enter a YouTube video URL.')
      setTranscript('')
      setVideoInfo({ id: '', lang: '' })
      return
    }
    setIsLoading(true)
    setError('')
    setTranscript('')
    setVideoInfo({ id: '', lang: '' })
    setShowCopiedIndicator(false)

    try {
      // Construct the API URL. If API_BASE_URL is "/", this becomes "/api/transcript".
      // If API_BASE_URL is "", this also becomes "/api/transcript".
      // If API_BASE_URL is "http://localhost:5002", this becomes "http://localhost:5002/api/transcript".
      const apiUrl = `${API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL}/api/transcript`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_url: videoUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      setTranscript(data.transcript)
      setVideoInfo({ id: data.video_id, lang: data.language })
    } catch (err) {
      console.error("Fetch error:", err)
      setError(err.message || 'Failed to fetch transcript. Make sure the backend is running and the URL is correct.')
    }
    setIsLoading(false)
  }

  const handleCopyTranscript = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript)
        .then(() => {
          setShowCopiedIndicator(true)
          setTimeout(() => setShowCopiedIndicator(false), 1500) // Show indicator for 1.5 seconds
        })
        .catch(err => {
          console.error('Failed to copy: ', err)
          // Optionally, provide visual feedback for error too
        })
    }
  }

  const handleDownloadTranscript = () => {
    if (transcript && videoInfo.id) {
      const filename = `transcript_${videoInfo.id}.txt`
      const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' })
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
      <p className="tagline">Paste a YouTube link. Get the full text in seconds. Clean & simple.</p>
      
      <div className="input-area">
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Enter YouTube Video URL"
        />
        <button className="button" onClick={fetchTranscript} disabled={isLoading}>
          {isLoading ? 'Fetching...' : 'Get Transcript'}
        </button>
      </div>

      {transcript && videoInfo.id && !error && (
        <div className="video-info">
          Displaying transcript for Video ID: {videoInfo.id} (Language: {videoInfo.lang})
        </div>
      )}

      <div 
        className={`transcript-display ${
          isLoading ? 'loading' : ''
        } ${
          error ? 'error' : ''
        } ${
          !isLoading && !transcript && !error ? 'placeholder' : '' 
        }`}
      >
        {transcript && !error && (
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
              title="Download Transcript (.txt)"
            >
              <FaDownload />
            </button>
          </div>
        )}

        {isLoading 
          ? 'Loading transcript...' 
          : error 
            ? `Error: ${error}`
            : transcript 
              ? transcript 
              : 'Transcript will appear here...'}
      </div>

      <div className="info-sections-wrapper">
        <div className="info-card">
          <h3>How It Works</h3>
          <ol>
            <li>Paste your YouTube video URL.</li>
            <li>Click "Get Transcript".</li>
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
