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

    # New list of proxies with embedded credentials
    raw_proxies = [
        "175.29.65.78:64232:oeermqym:hOf1n6aZ5bX6",
        "175.29.64.223:64091:oeermqym:hOf1n6aZ5bX6",
        "175.29.95.44:49449:oeermqym:hOf1n6aZ5bX6",
        "175.29.76.202:49651:oeermqym:hOf1n6aZ5bX6",
        "175.29.80.86:64194:oeermqym:hOf1n6aZ5bX6",
        "175.29.81.220:64481:oeermqym:hOf1n6aZ5bX6",
        "175.29.84.162:59986:oeermqym:hOf1n6aZ5bX6",
        "175.29.86.100:59888:oeermqym:hOf1n6aZ5bX6",
        "175.29.85.51:57137:oeermqym:hOf1n6aZ5bX6",
        "175.29.90.121:50603:oeermqym:hOf1n6aZ5bX6",
        "175.29.87.126:51968:oeermqym:hOf1n6aZ5bX6",
        "175.29.91.17:55051:oeermqym:hOf1n6aZ5bX6",
        "175.29.65.35:60231:oeermqym:hOf1n6aZ5bX6",
        "175.29.75.90:63029:oeermqym:hOf1n6aZ5bX6",
        "175.29.80.22:49754:oeermqym:hOf1n6aZ5bX6",
        "175.29.78.106:52075:oeermqym:hOf1n6aZ5bX6",
        "175.29.88.109:53175:oeermqym:hOf1n6aZ5bX6",
        "175.29.65.103:64765:oeermqym:hOf1n6aZ5bX6",
        "175.29.71.93:59859:oeermqym:hOf1n6aZ5bX6",
        "175.29.83.187:58276:oeermqym:hOf1n6aZ5bX6",
        "175.29.68.252:49953:oeermqym:hOf1n6aZ5bX6",
        "175.29.95.191:59263:oeermqym:hOf1n6aZ5bX6",
        "175.29.79.9:50882:oeermqym:hOf1n6aZ5bX6",
        "175.29.64.58:49211:oeermqym:hOf1n6aZ5bX6",
        "175.29.76.119:62729:oeermqym:hOf1n6aZ5bX6",
        "175.29.95.80:61187:oeermqym:hOf1n6aZ5bX6",
        "175.29.92.86:57295:oeermqym:hOf1n6aZ5bX6",
        "175.29.95.47:60149:oeermqym:hOf1n6aZ5bX6",
        "175.29.69.66:57669:oeermqym:hOf1n6aZ5bX6",
        "175.29.90.168:58776:oeermqym:hOf1n6aZ5bX6",
        "175.29.77.245:61241:oeermqym:hOf1n6aZ5bX6",
        "175.29.93.35:57726:oeermqym:hOf1n6aZ5bX6",
        "175.29.68.126:58122:oeermqym:hOf1n6aZ5bX6",
        "175.29.86.61:51816:oeermqym:hOf1n6aZ5bX6",
        "175.29.86.59:62698:oeermqym:hOf1n6aZ5bX6",
        "175.29.76.149:49778:oeermqym:hOf1n6aZ5bX6",
        "175.29.89.118:62068:oeermqym:hOf1n6aZ5bX6",
        "175.29.85.248:60123:oeermqym:hOf1n6aZ5bX6",
        "175.29.75.150:65157:oeermqym:hOf1n6aZ5bX6",
        "175.29.64.122:55021:oeermqym:hOf1n6aZ5bX6",
        "175.29.75.33:53083:oeermqym:hOf1n6aZ5bX6",
        "175.29.75.166:53564:oeermqym:hOf1n6aZ5bX6",
        "175.29.68.29:55691:oeermqym:hOf1n6aZ5bX6",
        "175.29.87.60:55796:oeermqym:hOf1n6aZ5bX6",
        "175.29.95.92:62772:oeermqym:hOf1n6aZ5bX6",
        "175.29.66.15:63821:oeermqym:hOf1n6aZ5bX6",
        "175.29.91.113:54642:oeermqym:hOf1n6aZ5bX6",
        "175.29.72.79:60577:oeermqym:hOf1n6aZ5bX6",
        "175.29.79.44:64245:oeermqym:hOf1n6aZ5bX6",
        "175.29.76.234:50656:oeermqym:hOf1n6aZ5bX6"
    ]

    proxies_list = []
    for proxy_string in raw_proxies:
        try:
            parts = proxy_string.split(':')
            ip, port, user, password = parts[0], parts[1], parts[2], parts[3]
            auth_proxy_url = f"http://{user}:{password}@{ip}:{port}"
            proxies_list.append({'http': auth_proxy_url, 'https': auth_proxy_url})
        except IndexError:
            logger.warning(f"Skipping malformed proxy string: {proxy_string}")
            continue
    
    chosen_proxy = None
    if proxies_list:
        chosen_proxy = random.choice(proxies_list)
        logger.info(f"Attempting to use proxy: {chosen_proxy['http'].split('@')[-1]}") 
    else:
        logger.info("No valid proxies configured from the provided list.")

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

    # New list of proxies with embedded credentials
    raw_proxies = [
        "175.29.65.78:64232:oeermqym:hOf1n6aZ5bX6",
        "175.29.64.223:64091:oeermqym:hOf1n6aZ5bX6",
        "175.29.95.44:49449:oeermqym:hOf1n6aZ5bX6",
        "175.29.76.202:49651:oeermqym:hOf1n6aZ5bX6",
        "175.29.80.86:64194:oeermqym:hOf1n6aZ5bX6",
        "175.29.81.220:64481:oeermqym:hOf1n6aZ5bX6",
        "175.29.84.162:59986:oeermqym:hOf1n6aZ5bX6",
        "175.29.86.100:59888:oeermqym:hOf1n6aZ5bX6",
        "175.29.85.51:57137:oeermqym:hOf1n6aZ5bX6",
        "175.29.90.121:50603:oeermqym:hOf1n6aZ5bX6",
        "175.29.87.126:51968:oeermqym:hOf1n6aZ5bX6",
        "175.29.91.17:55051:oeermqym:hOf1n6aZ5bX6",
        "175.29.65.35:60231:oeermqym:hOf1n6aZ5bX6",
        "175.29.75.90:63029:oeermqym:hOf1n6aZ5bX6",
        "175.29.80.22:49754:oeermqym:hOf1n6aZ5bX6",
        "175.29.78.106:52075:oeermqym:hOf1n6aZ5bX6",
        "175.29.88.109:53175:oeermqym:hOf1n6aZ5bX6",
        "175.29.65.103:64765:oeermqym:hOf1n6aZ5bX6",
        "175.29.71.93:59859:oeermqym:hOf1n6aZ5bX6",
        "175.29.83.187:58276:oeermqym:hOf1n6aZ5bX6",
        "175.29.68.252:49953:oeermqym:hOf1n6aZ5bX6",
        "175.29.95.191:59263:oeermqym:hOf1n6aZ5bX6",
        "175.29.79.9:50882:oeermqym:hOf1n6aZ5bX6",
        "175.29.64.58:49211:oeermqym:hOf1n6aZ5bX6",
        "175.29.76.119:62729:oeermqym:hOf1n6aZ5bX6",
        "175.29.95.80:61187:oeermqym:hOf1n6aZ5bX6",
        "175.29.92.86:57295:oeermqym:hOf1n6aZ5bX6",
        "175.29.95.47:60149:oeermqym:hOf1n6aZ5bX6",
        "175.29.69.66:57669:oeermqym:hOf1n6aZ5bX6",
        "175.29.90.168:58776:oeermqym:hOf1n6aZ5bX6",
        "175.29.77.245:61241:oeermqym:hOf1n6aZ5bX6",
        "175.29.93.35:57726:oeermqym:hOf1n6aZ5bX6",
        "175.29.68.126:58122:oeermqym:hOf1n6aZ5bX6",
        "175.29.86.61:51816:oeermqym:hOf1n6aZ5bX6",
        "175.29.86.59:62698:oeermqym:hOf1n6aZ5bX6",
        "175.29.76.149:49778:oeermqym:hOf1n6aZ5bX6",
        "175.29.89.118:62068:oeermqym:hOf1n6aZ5bX6",
        "175.29.85.248:60123:oeermqym:hOf1n6aZ5bX6",
        "175.29.75.150:65157:oeermqym:hOf1n6aZ5bX6",
        "175.29.64.122:55021:oeermqym:hOf1n6aZ5bX6",
        "175.29.75.33:53083:oeermqym:hOf1n6aZ5bX6",
        "175.29.75.166:53564:oeermqym:hOf1n6aZ5bX6",
        "175.29.68.29:55691:oeermqym:hOf1n6aZ5bX6",
        "175.29.87.60:55796:oeermqym:hOf1n6aZ5bX6",
        "175.29.95.92:62772:oeermqym:hOf1n6aZ5bX6",
        "175.29.66.15:63821:oeermqym:hOf1n6aZ5bX6",
        "175.29.91.113:54642:oeermqym:hOf1n6aZ5bX6",
        "175.29.72.79:60577:oeermqym:hOf1n6aZ5bX6",
        "175.29.79.44:64245:oeermqym:hOf1n6aZ5bX6",
        "175.29.76.234:50656:oeermqym:hOf1n6aZ5bX6"
    ]

    proxies_list = []
    for proxy_string in raw_proxies:
        try:
            parts = proxy_string.split(':')
            ip, port, user, password = parts[0], parts[1], parts[2], parts[3]
            auth_proxy_url = f"http://{user}:{password}@{ip}:{port}"
            proxies_list.append({'http': auth_proxy_url, 'https': auth_proxy_url})
        except IndexError:
            logger.warning(f"Skipping malformed proxy string for JSON endpoint: {proxy_string}")
            continue
    
    chosen_proxy = None
    if proxies_list:
        chosen_proxy = random.choice(proxies_list)
        logger.info(f"Attempting to use proxy: {chosen_proxy['http'].split('@')[-1]} for JSON endpoint")
    else:
        logger.info("No valid proxies configured from the provided list for JSON endpoint.")

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
