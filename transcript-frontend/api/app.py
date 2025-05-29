from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled, VideoUnavailable
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def extract_video_id(video_url):
    # Regex to find video ID from various YouTube URL formats
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/[^#]*#([^\/]*)\/([^\/]*\/)*([^\?&"]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, video_url)
        if match:
            return match.group(1)
    return None

@app.route('/api/transcript', methods=['POST'])
def get_transcript():
    data = request.get_json()
    video_url = data.get('video_url')

    if not video_url:
        return jsonify({'error': 'Missing video_url'}), 400

    video_id = extract_video_id(video_url)

    if not video_id:
        return jsonify({'error': 'Invalid YouTube URL or could not extract video ID'}), 400

    try:
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.list_transcripts(video_id)
        
        transcript = None
        try:
            transcript = transcript_list.find_manually_created_transcript(['en'])
        except NoTranscriptFound:
            try:
                transcript = transcript_list.find_generated_transcript(['en'])
            except NoTranscriptFound:
                available_manual_transcripts = [t for t in transcript_list if not t.is_generated]
                if available_manual_transcripts:
                    transcript = available_manual_transcripts[0]
                else:
                    available_generated_transcripts = [t for t in transcript_list if t.is_generated]
                    if available_generated_transcripts:
                        transcript = available_generated_transcripts[0]
                    else:
                        transcript = transcript_list.find_transcript([])

        fetched_transcript = transcript.fetch()
        
        if not fetched_transcript:
            formatted_transcript = ""
        else:
            segments = []
            current_segment = fetched_transcript[0].text
            paragraph_break_threshold = 0.7 

            for i in range(1, len(fetched_transcript)):
                prev_snippet = fetched_transcript[i-1]
                current_snippet = fetched_transcript[i]
                gap = current_snippet.start - (prev_snippet.start + prev_snippet.duration)

                if gap > paragraph_break_threshold:
                    segments.append(current_segment)
                    current_segment = current_snippet.text
                else:
                    current_segment += " " + current_snippet.text
            segments.append(current_segment)
            formatted_transcript = "\n\n".join(segments)
        
        return jsonify({'transcript': formatted_transcript, 'video_id': video_id, 'language': transcript.language})
    except NoTranscriptFound:
        return jsonify({'error': f'No transcript found for video ID: {video_id}. The video might not have subtitles or they are disabled.'}), 404
    except TranscriptsDisabled:
        return jsonify({'error': f'Transcripts are disabled for video ID: {video_id}.'}), 403
    except VideoUnavailable:
        return jsonify({'error': f'Video {video_id} is unavailable.'}), 404
    except Exception as e:
        app.logger.error(f"Error fetching transcript for {video_id}: {str(e)}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/get_transcript', methods=['POST'])
def get_transcript_json(): # This function name is now a bit confusing given the route, consider renaming if routes are consolidated
    data = request.get_json()
    video_url = data.get('video_url')

    if not video_url:
        return jsonify({'error': 'Missing video_url'}), 400

    video_id = extract_video_id(video_url)

    if not video_id:
        return jsonify({'error': 'Invalid YouTube URL or could not extract video ID'}), 400

    try:
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.list_transcripts(video_id)
        
        transcript_obj = None # Renamed to avoid conflict with flask.transcript
        try:
            transcript_obj = transcript_list.find_manually_created_transcript(['en'])
        except NoTranscriptFound:
            try:
                transcript_obj = transcript_list.find_generated_transcript(['en'])
            except NoTranscriptFound:
                available_manual_transcripts = [t for t in transcript_list if not t.is_generated]
                if available_manual_transcripts:
                    transcript_obj = available_manual_transcripts[0]
                else:
                    available_generated_transcripts = [t for t in transcript_list if t.is_generated]
                    if available_generated_transcripts:
                        transcript_obj = available_generated_transcripts[0]
                    else:
                        transcript_obj = transcript_list.find_transcript([])

        fetched_transcript_data = transcript_obj.fetch()
        
        full_text = ""
        if fetched_transcript_data:
            segments = []
            current_segment = fetched_transcript_data[0].text
            paragraph_break_threshold = 0.7 

            for i in range(1, len(fetched_transcript_data)):
                prev_snippet = fetched_transcript_data[i-1]
                current_snippet = fetched_transcript_data[i]
                gap = current_snippet.start - (prev_snippet.start + prev_snippet.duration)

                if gap > paragraph_break_threshold:
                    segments.append(current_segment)
                    current_segment = current_snippet.text
                else:
                    current_segment += " " + current_snippet.text
            segments.append(current_segment)
            full_text = "\n\n".join(segments)
        
        return jsonify({
            'video_id': video_id,
            'language': transcript_obj.language,
            'full_text': full_text
        })
    except NoTranscriptFound:
        return jsonify({'error': f'No transcript found for video ID: {video_id}.'}), 404
    except TranscriptsDisabled:
        return jsonify({'error': f'Transcripts are disabled for video ID: {video_id}.'}), 403
    except VideoUnavailable:
        return jsonify({'error': f'Video {video_id} is unavailable.'}), 404
    except Exception as e:
        app.logger.error(f"Error in /api/get_transcript for {video_id}: {str(e)}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

# For Vercel, the app object is imported by the server, so __main__ guard is not strictly needed for Vercel deployment
# but good for local testing if you run `python api/app.py` directly in transcript-frontend
if __name__ == '__main__':
    app.run(debug=True, port=5001)
