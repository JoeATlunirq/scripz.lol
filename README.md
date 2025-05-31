# YouTube Transcript Fetcher & API

This project provides a sleek web interface to fetch YouTube video transcripts and a simple API to get transcript data programmatically.

It uses the `youtube-captions-scraper` Node.js library for its core transcript fetching functionality.

**Live Demo & API Base URL:** [https://scripz.lol](https://scripz.lol) (Replace with your actual Vercel frontend URL if different)

## Features

*   **Web Interface:**
    *   Modern, responsive design with a vibrant theme.
    *   Input a YouTube video URL to fetch and display its transcript.
    *   Intelligently formats transcripts with paragraph breaks based on pauses.
    *   Displays video ID and assumed language (English by default).
    *   Link to API documentation.
*   **Backend API (Node.js/Express):**
    *   Endpoint to get full transcript text as JSON using `youtube-captions-scraper`.
    *   Requests English transcripts by default.
    *   Formatted text output for readability.

## Project Structure

*   `/transcript-frontend`: React + Vite frontend application.
    *   `/api`: Contains the Node.js/Express backend API.
        *   `index.js`: The main API server file.
        *   `package.json`: Node.js dependencies for the API.
*   `/youtube_transcript_api`: The original Python library for fetching YouTube transcripts (cloned alongside this application, **no longer directly used by the deployed API**).

## Local Development

### Prerequisites

*   Node.js and npm (for frontend and backend API)

### 1. Backend API Setup & Run (Node.js)

```bash
# Navigate to the API directory within the frontend project
cd transcript-frontend/api

# Install API dependencies (if not already done)
npm install

# Run the Node.js Express app
npm start 
# or directly: node index.js
```

The backend API will typically start on `http://localhost:5002` (or the port defined in `api/index.js`).

### 2. Frontend Setup & Run

```bash
# Navigate to the frontend directory (from the project root)
cd transcript-frontend

# Install frontend dependencies (if not already done)
npm install

# Run the Vite dev server
npm run dev
```

The frontend will typically start on `http://localhost:5173`. 
**Important:** For local development, ensure your frontend (`App.jsx`) is configured to call the correct local API URL (e.g., `http://localhost:5002`). The `VITE_API_BASE_URL` environment variable or its fallback in `App.jsx` should point to this.

## API Usage

The primary API endpoint is documented on the frontend at `/api-docs`.

**Endpoint:** `/api/get_transcript` (for JSON data)
**Method:** `POST`
**Request Body (JSON):**
```json
{
  "video_url": "https://www.youtube.com/watch?v=your_video_id"
}
```
**Successful Response (JSON):**
```json
{
  "video_id": "your_video_id",
  "language": "en", // Assumed, as per current implementation
  "full_text": "The complete transcript text...\n\nFormatted with paragraph breaks...",
  "method": "youtube-captions-scraper"
}
```

## Deployment to Vercel

This project is structured for easy deployment to Vercel.

*   Push your project to a Git repository (e.g., GitHub, GitLab, Bitbucket).
*   In Vercel, create a new project and link it to your Git repository.
*   When configuring the project in Vercel:
    *   Set the **Root Directory** to `transcript-frontend`.
    *   Vercel should automatically detect it as a Vite project for the frontend and use the `vercel.json` within `transcript-frontend` to correctly build and route the Node.js API in the `/api` subdirectory.
    *   **Environment Variables:**
        *   Set `VITE_API_BASE_URL` to `/` for your Vercel deployment. This ensures API calls from the frontend (e.g., `scripz.lol/api/transcript`) are correctly routed to the Node.js serverless functions.
    *   Deploy!

### Pointing Your Custom Domain(s)

Once deployed on Vercel, you can assign your custom domains (`scripz.lol`, `gimmedatscript.com`) to this Vercel project through the Vercel dashboard.

## GitHub Repository Description

"🎤 Extract YouTube video transcripts easily! Sleek web UI + simple JSON API. Built with React, Vite, Node.js (Express), and youtube-captions-scraper. Ready for Vercel deployment."

--- 

*Remember to replace placeholder URLs like `https://scripz.lol` with your actual deployed URLs if needed in documentation, though using relative paths and `VITE_API_BASE_URL=/` is recommended for the app itself.*
