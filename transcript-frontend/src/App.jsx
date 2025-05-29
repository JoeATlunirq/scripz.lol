import { useState } from 'react'
import './App.css'

function App() {
  const [videoUrl, setVideoUrl] = useState('')
  const [transcript, setTranscript] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoInfo, setVideoInfo] = useState({ id: '', lang: '' })

  // Construct the correct API URL based on environment
  const envApiBase = import.meta.env.VITE_API_BASE_URL
  let fetchUrlPrefix

  if (envApiBase === '/') {
    // In Vercel/production, if VITE_API_BASE_URL is '/', we want root-relative paths like '/api/transcript'
    fetchUrlPrefix = '' // The path will start with /api/...
  } else if (envApiBase) {
    // If VITE_API_BASE_URL is a full URL (e.g. for a different staging backend)
    fetchUrlPrefix = envApiBase
  } else {
    // Fallback for local development (VITE_API_BASE_URL is likely undefined)
    fetchUrlPrefix = 'http://localhost:5001'
  }

  const fetchTranscript = async () => {
    if (!videoUrl) {
      setError('Please enter a YouTube video URL.')
      return
    }
    setIsLoading(true)
    setError('')
    setTranscript('')
    setVideoInfo({ id: '', lang: '' })

    // Use the correctly constructed prefix
    const fullFetchUrl = `${fetchUrlPrefix}/api/transcript`

    try {
      const response = await fetch(fullFetchUrl, {
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

  return (
    <>
      <h1 className="title">Quick YT Transcripts</h1>
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

      {error && <div className="transcript-display error">Error: {error}</div>}
      
      {transcript && videoInfo.id && (
        <div className="video-info">
          Displaying transcript for Video ID: {videoInfo.id} (Language: {videoInfo.lang})
        </div>
      )}

      <div 
        className={`transcript-display ${
          isLoading ? 'loading' : ''
        } ${
          !isLoading && !transcript && !error ? 'placeholder' : '' 
        }`}
      >
        {isLoading 
          ? 'Loading transcript...' 
          : transcript 
            ? transcript 
            : error 
              ? '' // Error is displayed above
              : 'Transcript will appear here...'}
      </div>

      <div className="info-sections-wrapper">
        <div className="info-card">
          <h3>How It Works</h3>
          <ol>
            <li>Paste your YouTube video URL.</li>
            <li>Click "Get Transcript".</li>
            <li>Read or copy your text.</li>
          </ol>
        </div>
        
        <div className="info-card">
          <h3>Features</h3>
          <ul>
            <li><strong>Fast:</strong> Transcripts generated in moments.</li>
            <li><strong>Simple:</strong> Easy to use, no fuss.</li>
            <li><strong>Direct:</strong> Get the core text of videos.</li>
          </ul>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '10px' }}>
        <a href="/api-docs" style={{ color: '#e74c3c', textDecoration: 'underline', fontWeight: '500' }}>View API Documentation</a>
      </div>
    </>
  )
}

export default App
