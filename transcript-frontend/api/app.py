from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled, VideoUnavailable
import re
import logging
import random
import os # Added for environment variables

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
logger = logging.getLogger(__name__)

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
        logger.error(f"Invalid YouTube URL or no video ID found: {video_url}")
        return jsonify({"error": "Invalid YouTube URL"}), 400

    # Get proxy credentials from environment variables
    proxy_user = os.environ.get('PROXY_USER')
    proxy_pass = os.environ.get('PROXY_PASS')

    proxies_list = []
    if proxy_user and proxy_pass:
        base_proxy_urls = [
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8001",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8002",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8003",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8004",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8005",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8006",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8007",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8008",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8009",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8010",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8011",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8012",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8013",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8014",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8015",
        ]
        for url in base_proxy_urls:
            proxies_list.append({'http': url, 'https': url})
    else:
        logger.warning("Proxy credentials (PROXY_USER, PROXY_PASS) not set. Attempting without proxies or with unauthenticated proxies if any were previously defined.")
        # Optionally, you could define a fallback to unauthenticated proxies here if you still had some
        # proxies_list = [ {'http': 'http://some_open_proxy.com:port', ...} ]
        pass # Continue without authenticated proxies if credentials are not set

    chosen_proxy = None
    if proxies_list:
        chosen_proxy = random.choice(proxies_list)
        logger.info(f"Attempting to use proxy: {chosen_proxy['http'].split('@')[-1]}") # Log proxy host without credentials
    else:
        logger.info("No proxies configured or credentials missing.")

    try:
        logger.info(f"Fetching transcript for video ID: {video_id} using proxy: {chosen_proxy['http'].split('@')[-1] if chosen_proxy else 'None'}")
        languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh-Hans', 'zh-Hant', 'ar', 'hi']

        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id, proxies=chosen_proxy)
        
        transcript = None
        for lang_code in languages:
            try:
                transcript = transcript_list.find_generated_transcript([lang_code])
                if transcript:
                    logger.info(f"Found transcript in language: {lang_code}")
                    break
            except NoTranscriptFound:
                logger.debug(f"No transcript found for language code: {lang_code}")
                continue
        
        if not transcript:
            try:
                transcript = transcript_list.find_manually_created_transcript(languages)
                if transcript:
                    logger.info(f"Found manually created transcript in one of the languages.")
            except NoTranscriptFound:
                logger.info(f"No manually created transcript found in preferred languages either for {video_id}.")
                if not transcript:
                    try:
                        if list(transcript_list): 
                            first_available = list(transcript_list)[0]
                            transcript = transcript_list.find_generated_transcript([first_available.language_code])
                            logger.info(f"Using first available transcript in language: {first_available.language_code}")
                        else:
                            logger.error(f"Transcript list is empty for {video_id}. Cannot select fallback.")
                    except Exception as e_fallback:
                        logger.error(f"Could not find any transcript for {video_id} after all attempts. Fallback error: {str(e_fallback)}")

        if not transcript:
             logger.error(f"No transcript found for video ID {video_id} in any of the specified or available languages.")
             return jsonify({"error": "No transcript found for this video in any of the specified or available languages."}), 404

        transcript_data = transcript.fetch()
        
        if not transcript_data:
            formatted_transcript = ""
        else:
            segments = []
            current_segment = transcript_data[0]['text']
            paragraph_break_threshold = 0.7 

            for i in range(1, len(transcript_data)):
                prev_snippet = transcript_data[i-1]
                current_snippet = transcript_data[i]
                gap = current_snippet['start'] - (prev_snippet['start'] + prev_snippet['duration'])

                if gap > paragraph_break_threshold:
                    segments.append(current_segment)
                    current_segment = current_snippet['text']
                else:
                    current_segment += " " + current_snippet['text']
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
        logger.error(f"Error fetching transcript for {video_id}: \\n{str(e)}")
        # Check if the error message is from youtube-transcript-api regarding IP blocks
        if "YouTube is blocking requests" in str(e) or "RequestBlocked" in str(e) or "IPBlocked" in str(e):
            return jsonify({"error": "Could not retrieve transcript. This service might be temporarily blocked by YouTube. Please try again later.", "details": str(e)}), 503 # Service Unavailable
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/api/get_transcript', methods=['POST'])
def get_transcript_json(): # This function name is now a bit confusing given the route, consider renaming if routes are consolidated
    data = request.get_json()
    video_url = data.get('video_url')

    if not video_url:
        return jsonify({'error': 'Missing video_url'}), 400

    video_id = extract_video_id(video_url)

    if not video_id:
        return jsonify({'error': 'Invalid YouTube URL or could not extract video ID'}), 400

    # Get proxy credentials from environment variables
    proxy_user = os.environ.get('PROXY_USER')
    proxy_pass = os.environ.get('PROXY_PASS')

    proxies_list = []
    if proxy_user and proxy_pass:
        base_proxy_urls = [
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8001",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8002",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8003",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8004",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8005",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8006",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8007",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8008",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8009",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8010",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8011",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8012",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8013",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8014",
            f"http://{proxy_user}:{proxy_pass}@isp.oxylabs.io:8015",
        ]
        for url in base_proxy_urls:
            proxies_list.append({'http': url, 'https': url})
    else:
        logger.warning("Proxy credentials (PROXY_USER, PROXY_PASS) not set for JSON endpoint. Attempting without proxies.")
        pass
    
    chosen_proxy = None
    if proxies_list:
        chosen_proxy = random.choice(proxies_list)
        logger.info(f"Attempting to use proxy: {chosen_proxy['http'].split('@')[-1]} for JSON endpoint")
    else:
        logger.info("No proxies configured or credentials missing for JSON endpoint.")

    try:
        logger.info(f"Fetching transcript for video ID: {video_id} for JSON endpoint using proxy: {chosen_proxy['http'].split('@')[-1] if chosen_proxy else 'None'}")
        languages = ['en'] 
        
        transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=languages, proxies=chosen_proxy)
        
        full_text = ""
        if transcript_data:
            segments = []
            current_segment = transcript_data[0]['text']
            paragraph_break_threshold = 0.7 

            for i in range(1, len(transcript_data)):
                prev_snippet = transcript_data[i-1]
                current_snippet = transcript_data[i]
                gap = current_snippet['start'] - (prev_snippet['start'] + prev_snippet['duration'])

                if gap > paragraph_break_threshold:
                    segments.append(current_segment)
                    current_segment = current_snippet['text']
                else:
                    current_segment += " " + current_snippet['text']
            segments.append(current_segment)
            full_text = "\n\n".join(segments)
        
        return jsonify({
            'video_id': video_id,
            'language': languages[0],
            'full_text': full_text
        })
    except NoTranscriptFound:
        return jsonify({'error': f'No transcript found for video ID: {video_id}.'}), 404
    except TranscriptsDisabled:
        return jsonify({'error': f'Transcripts are disabled for video ID: {video_id}.'}), 403
    except VideoUnavailable:
        return jsonify({'error': f'Video {video_id} is unavailable.'}), 404
    except Exception as e:
        logger.error(f"Error fetching transcript for {video_id} (JSON endpoint): \\n{str(e)}")
        if "YouTube is blocking requests" in str(e) or "RequestBlocked" in str(e) or "IPBlocked" in str(e):
            return jsonify({"error": "Could not retrieve transcript. This service might be temporarily blocked by YouTube. Please try again later.", "details": str(e)}), 503
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# For Vercel, the app object is imported by the server, so __main__ guard is not strictly needed for Vercel deployment
# but good for local testing if you run `python api/app.py` directly in transcript-frontend
if __name__ == '__main__':
    app.run(debug=True, port=5001)
