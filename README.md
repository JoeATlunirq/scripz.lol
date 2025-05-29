# YouTube Transcript Fetcher & API

This project provides a sleek web interface to fetch YouTube video transcripts and a simple API to get transcript data programmatically.

It uses the `youtube-transcript-api` Python library (the one this project is based on) for its core functionality.

**Live Demo & API Base URL:** [https://scripz.lol](https://scripz.lol) (Replace with your actual Vercel frontend URL)

## Features

*   **Web Interface:**
    *   Modern, responsive design with a vibrant theme.
    *   Input a YouTube video URL to fetch and display its transcript.
    *   Intelligently formats transcripts with paragraph breaks based on pauses.
    *   Displays video ID and detected language.
    *   Link to API documentation.
*   **Backend API:**
    *   Endpoint to get full transcript text as JSON.
    *   Prioritizes English, then other manually created, then auto-generated transcripts.
    *   Formatted text output for readability.

## Project Structure

*   `/transcript-frontend`: React + Vite frontend application.
*   `/transcript-backend`: Flask (Python) backend API.
    *   Contains a copy of the `youtube_transcript_api` library for deployment.
*   `/youtube_transcript_api`: The original Python library for fetching YouTube transcripts (cloned alongside this application).

## Local Development

### Prerequisites

*   Node.js and npm (for frontend)
*   Python 3.x and pip (for backend)

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd transcript-backend

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Crucial for local development if not copying the library in yet)
# Ensure the main youtube_transcript_api library is in your PYTHONPATH
# or copy it into the transcript-backend directory as recommended for Vercel.
# If you've already copied it in for Vercel, this step is covered.

# Run the Flask app
python app.py
```

The backend will typically start on `http://localhost:5001`.

### 2. Frontend Setup

```bash
# Navigate to the frontend directory (from the project root)
cd transcript-frontend

# Install dependencies
npm install

# Run the Vite dev server
npm run dev
```

The frontend will typically start on `http://localhost:5173` and open in your browser.

## API Usage

The primary API endpoint is documented on the frontend at `/api-docs` (e.g., `http://localhost:5173/api-docs` locally, or `https://scripz.lol/api-docs` once deployed).

**Endpoint:** `/api/get_transcript`
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
  "language": "en",
  "full_text": "The complete transcript text...\n\nFormatted with paragraph breaks..."
}
```

## Deployment to Vercel

This project is structured for easy deployment to Vercel.

### 1. Backend (`transcript-backend`)

*   **IMPORTANT:** Ensure the `youtube_transcript_api` library folder is copied *inside* the `transcript-backend` directory.
*   The `transcript-backend` directory contains a `vercel.json` file configured for Python deployments.
*   Push your project to a Git repository (e.g., GitHub, GitLab, Bitbucket).
*   In Vercel, create a new project and link it to your Git repository.
*   When configuring the project in Vercel:
    *   Set the **Root Directory** to `transcript-backend`.
    *   Vercel should automatically detect it as a Python project using `app.py` and the `vercel.json`.
    *   Deploy!
    *   Your backend API will be available at the Vercel-provided domain (e.g., `your-backend-name.vercel.app`). You'll use this as the base URL for your API (e.g., in your frontend's API calls if you don't proxy, or update `apiUrl` in `ApiDocs.jsx` and fetch calls in `App.jsx` if you want them to point to the deployed backend).

### 2. Frontend (`transcript-frontend`)

*   In Vercel, create another new project and link it to the same Git repository.
*   When configuring this project in Vercel:
    *   Set the **Root Directory** to `transcript-frontend`.
    *   Vercel should automatically detect it as a Vite project.
    *   **Environment Variables (Optional but Recommended):**
        *   If you want your frontend to call your deployed backend, you might set an environment variable like `VITE_API_BASE_URL` to your Vercel backend URL (e.g., `https://your-backend-name.vercel.app`). Then in your `App.jsx` fetch calls, you would use `import.meta.env.VITE_API_BASE_URL`.
        *   Alternatively, for `scripz.lol` or `gimmedatscript.com`, you can set up Vercel rewrites/proxies if you want the API to be served under the same domain as the frontend (e.g., `scripz.lol/api/...` actually points to your backend deployment). This is a more advanced setup.
    *   Deploy!
    *   This will be your main user-facing site (e.g., `https://scripz.lol`).

### Pointing Your Custom Domain(s)

Once both frontend and backend are deployed on Vercel, you can assign your custom domains (`scripz.lol`, `gimmedatscript.com`) to your **frontend deployment** through the Vercel dashboard.

If you are *not* using Vercel rewrites to serve the API under the same domain, ensure your frontend code is configured to call the correct deployed backend URL.

## GitHub Repository Description

"🎤 Extract YouTube video transcripts easily! Sleek web UI + simple JSON API. Built with React, Vite, Python (Flask), and youtube-transcript-api. Ready for Vercel deployment."

--- 

*Remember to replace placeholder URLs like `https://scripz.lol` with your actual deployed URLs.*
