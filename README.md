# YouTube Transcript Fetcher & API

This project provides a sleek web interface to fetch YouTube video transcripts and a simple API to get transcript data programmatically.

It uses the `youtube-transcript-api` Python library for its core functionality.

**Live Demo & API Base URL:** [https://scripz.lol](https://scripz.lol) (The API will be available at `https://scripz.lol/api/`)

## Features

*   **Web Interface (React + Vite):**
    *   Modern, responsive design with a vibrant theme.
    *   Input a YouTube video URL to fetch and display its transcript.
    *   Intelligently formats transcripts with paragraph breaks based on pauses.
    *   Displays video ID and detected language.
    *   Link to API documentation.
*   **Backend API (Python/Flask served as Serverless Function):**
    *   Located in the `/transcript-frontend/api` directory.
    *   Endpoint to get full transcript text as JSON.
    *   Prioritizes English, then other manually created, then auto-generated transcripts.
    *   Formatted text output for readability.

## Project Structure

*   `/transcript-frontend`: Main project directory for Vercel deployment.
    *   `/api`: Contains the Flask (Python) backend API.
        *   `app.py`: The Flask application.
        *   `requirements.txt`: Python dependencies for the API.
        *   `/youtube_transcript_api`: Bundled transcript library.
    *   `/public`: Static assets for the frontend.
    *   `/src`: Frontend React components and logic.
    *   `vercel.json`: Configuration for Vercel to build both frontend and backend API.
*   `README.md`: This file.
*   The original `transcript-backend` directory can now be deleted if all its contents were successfully moved.

## Local Development

### Prerequisites

*   Node.js and npm
*   Python 3.x and pip

### 1. Combined Frontend & API Development

For local development that closely mimics the Vercel setup (frontend serving and API under `/api`):

1.  **Navigate to the `transcript-frontend` directory:**
    ```bash
    cd transcript-frontend
    ```
2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```
3.  **Install backend dependencies (for the API in `transcript-frontend/api`):**
    ```bash
    # Ensure you have a virtual environment tool or manage Python packages globally/per-project as you prefer.
    # Example: create and activate a venv inside transcript-frontend/api
    # cd api
    # python3 -m venv venv
    # source venv/bin/activate 
    # pip install -r requirements.txt
    # cd .. (back to transcript-frontend)
    # For simplicity if you manage python globally or don't want a nested venv now:
    pip install -r api/requirements.txt
    ```
4.  **Run the Vite dev server with Vercel CLI for API proxying:**
    The Vite dev server doesn't run Python. To test the `/api` routes locally, you need a proxy or a tool that can serve both. The Vercel CLI is perfect for this.
    ```bash
    # Install Vercel CLI globally if you haven't already
    # npm install -g vercel

    # Run the development server using Vercel CLI from the transcript-frontend directory
    vercel dev
    ```
    This command will: 
    *   Build and serve your Vite frontend.
    *   Run your Python API functions from the `transcript-frontend/api` directory.
    *   Make your API available at `http://localhost:3000/api/...` (Vercel CLI usually uses port 3000).
    *   Your frontend will be at `http://localhost:3000`.

### Alternative: Separate Local Development (If Vercel CLI is not used)

If you don't use `vercel dev`, you'd run them separately and need CORS handling:

*   **Backend (from `transcript-frontend/api` directory):**
    ```bash
    cd transcript-frontend/api
    # Activate virtual environment if you made one here
    # source venv/bin/activate
    python app.py 
    ```
    This will start the Flask app, typically on `http://localhost:5001`.
*   **Frontend (from `transcript-frontend` directory):**
    ```bash
    cd transcript-frontend
    npm run dev
    ```
    This starts on `http://localhost:5173` (or similar). **Note:** In this separate setup, if `App.jsx` calls `/api/transcript`, it will fail because it tries `http://localhost:5173/api/transcript`. You would temporarily need to revert `App.jsx` to use `http://localhost:5001/api/transcript` for this specific local setup and ensure `CORS(app)` is active in your `api/app.py`.

**Using `vercel dev` is highly recommended for local development that mirrors the deployment.**

## API Usage

The API endpoint is documented on the frontend at `/api-docs`.

**Endpoint:** `/api/get_transcript` (relative to the deployed domain)
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

With the new structure, deployment is simpler:

1.  Ensure all changes are committed to your Git repository.
2.  In Vercel, create a **single new project** and link it to your Git repository.
3.  When configuring the project in Vercel:
    *   Set the **Root Directory** to `transcript-frontend`.
    *   Vercel should automatically detect the `vercel.json` inside `transcript-frontend` and understand how to build both the static frontend and the Python API functions in the `/api` directory.
    *   No special environment variables like `VITE_API_BASE_URL` are needed for the API calls anymore, as they are now relative paths.
4.  Deploy!
5.  Assign your custom domains (`scripz.lol`, `gimmedatscript.com`) to this single Vercel project.

## GitHub Repository Description

"🎤 Extract YouTube video transcripts easily! Sleek web UI + simple JSON API. Built with React, Vite, and Python (Flask). Unified Vercel deployment."

---
*Remember to replace placeholder URLs like `https://scripz.lol` with your actual deployed URL if it differs.*