import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'; // Assuming you want to use some global styles

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-page-wrapper" style={{ padding: '20px', maxWidth: '800px', margin: '40px auto', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)' }}>
      <style>
        {`
          .privacy-policy-page-wrapper h1, .privacy-policy-page-wrapper h2 {
            color: #e74c3c; /* Accent color from your theme */
            margin-bottom: 15px;
          }
          .privacy-policy-page-wrapper h1 {
            text-align: center;
            font-size: 2.2rem;
            margin-bottom: 25px;
          }
          .privacy-policy-page-wrapper h2 {
            font-size: 1.6rem;
            margin-top: 30px;
          }
          .privacy-policy-page-wrapper p, .privacy-policy-page-wrapper li {
            color: #333; /* Darker text for readability */
            line-height: 1.7;
            font-size: 1rem;
            margin-bottom: 12px;
          }
          .privacy-policy-page-wrapper ul {
            padding-left: 20px;
            margin-bottom: 15px;
          }
          .privacy-policy-page-wrapper a {
            color: #e74c3c; /* Accent color for links */
            text-decoration: underline;
          }
          .privacy-policy-page-wrapper a:hover {
            color: #c0392b; /* Darker accent on hover */
          }
          .back-link-privacy {
            display: block;
            text-align: center;
            margin-top: 30px;
            margin-bottom: 20px;
            font-size: 1rem;
          }
        `}
      </style>
      <h1>Privacy Policy for Scripz</h1>
      <p><strong>Last Updated: 3 Jun 2025</strong></p>

      <p>Welcome to Scripz! This Privacy Policy explains how we collect, use, and disclose information when you use our website (scripz.lol) and our Chrome Extension ("Scripz - YouTube Transcript Viewer").</p>

      <h2>1. Information We Collect</h2>
      <p>When you use the Scripz Chrome Extension, we collect the following information:</p>
      <ul>
        <li><strong>YouTube Video URL:</strong> When you activate the extension on a YouTube video page, we access the URL of that specific video. This is essential to fetch the transcript for that video.</li>
      </ul>
      <p>When you use our website (scripz.lol), we may collect:</p>
      <ul>
        <li><strong>YouTube Video URL:</strong> If you use the transcript generation feature on our website, you provide the YouTube video URL.</li>
        <li><strong>Usage Data:</strong> Like most websites, we may collect standard analytics data such as your IP address, browser type, pages visited, and timestamps. This data is used to improve our service and is generally anonymized or aggregated.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>The information we collect is used for the following purposes:</p>
      <ul>
        <li><strong>To Provide Transcripts:</strong> The primary use of the YouTube video URL is to fetch the corresponding transcript from our backend API and display it to you, both in the Chrome Extension and on our website.</li>
        <li><strong>To Improve Our Services:</strong> Usage data helps us understand how our services are being used, identify areas for improvement, and troubleshoot issues.</li>
        <li><strong>To Communicate With You (If Applicable):</strong> If you contact us directly, we may use your information to respond to your inquiries.</li>
      </ul>

      <h2>3. How We Share Your Information</h2>
      <p>We do not sell your personal information. We may share information under the following limited circumstances:</p>
      <ul>
        <li><strong>With Our API:</strong> The YouTube video URL is sent to our secure API (hosted at www.scripz.lol) to process the transcript request.</li>
        <li><strong>Service Providers:</strong> We may use third-party service providers for website hosting, analytics, or other operational purposes. These providers are contractually obligated to protect your information and use it only for the services they provide to us.</li>
        <li><strong>Legal Requirements:</strong> We may disclose your information if required by law, subpoena, or other legal process, or if we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.</li>
      </ul>

      <h2>4. Data Retention and Security</h2>
      <p>We retain YouTube video URLs only as long as necessary to provide the transcript fetching service. We do not store these URLs in long-term logs tied to your personal identity.</p>
      <p>We implement reasonable security measures to protect the information we handle. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>

      <h2>5. Your Choices</h2>
      <p>For the Chrome Extension, you control when it accesses a YouTube video URL by choosing when to click the extension icon. You can uninstall the extension at any time through your browser settings.</p>
      <p>You can typically control cookies and tracking technologies through your browser settings.</p>

      <h2>6. Children's Privacy</h2>
      <p>Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information.</p>

      <h2>7. Changes to This Privacy Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>

      <h2>8. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at: joseph@lunirq.ai</p>

      <div className="back-link-privacy">
        <Link to="/">Back to Transcript Generator</Link>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 