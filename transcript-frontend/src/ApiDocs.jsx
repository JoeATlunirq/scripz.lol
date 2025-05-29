import React from 'react';
import './App.css'; // Reuse existing styles

function ApiDocs() {
  const deployedApiUrl = import.meta.env.VITE_API_BASE_URL || 'https://your-backend-name.vercel.app'; // Fallback for local view
  // const localApiUrl = 'http://localhost:5001'; // For testing docs with local backend

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 20px' }}> 
      <h1 className="title">API Documentation</h1>
      <p className="tagline">Free & Simple YouTube Transcript API (Live API at {deployedApiUrl.replace(/https?:\/\//, '').split('/')[0]})</p>

      <div className="info-card" style={{ marginBottom: '25px' }}>
        <h3>Get Transcript (JSON)</h3>
        <p>This endpoint allows you to fetch the full transcript of a YouTube video as a JSON object.</p>
        <p><strong>Endpoint:</strong> <code>{deployedApiUrl}/api/get_transcript</code></p>
        <p><strong>Method:</strong> <code>POST</code></p>
        <p><strong>Request Body:</strong> JSON</p>
        <pre><code style={{ display: 'block', whiteSpace: 'pre', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', color: '#333'}}>
          {JSON.stringify({ video_url: "https://www.youtube.com/watch?v=your_video_id" }, null, 2)}
        </code></pre>
        
        <h4>Successful Response (200 OK):</h4>
        <pre><code style={{ display: 'block', whiteSpace: 'pre', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', color: '#333'}}>
          {JSON.stringify({
            video_id: "your_video_id",
            language: "en", // or other language code
            full_text: "The complete transcript text...\n\nFormatted with paragraph breaks..."
          }, null, 2)}
        </code></pre>

        <h4>Error Responses:</h4>
        <ul>
          <li><strong>400 Bad Request:</strong> Missing <code>video_url</code> or invalid YouTube URL.</li>
          <li><strong>404 Not Found:</strong> No transcript found for the video or video is unavailable.</li>
          <li><strong>403 Forbidden:</strong> Transcripts are disabled for the video.</li>
          <li><strong>500 Internal Server Error:</strong> Unexpected error on the server.</li>
        </ul>
        <p>Example error response:</p>
         <pre><code style={{ display: 'block', whiteSpace: 'pre', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', color: '#333'}}>
          {JSON.stringify({ error: "Error message detailing the issue." }, null, 2)}
        </code></pre>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <a href="/" className="button">Back to Transcript Generator</a>
      </div>
    </div>
  );
}

export default ApiDocs; 