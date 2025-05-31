import React, { useState } from 'react';
import '../App.css'; // Import App.css for card styles

// Use environment variable for password, with a fallback for development
const ENV_PASSWORD = import.meta.env.VITE_API_DOCS_PASS;
const DEFAULT_PASSWORD = 'scripzdocs';
const PASSWORD = ENV_PASSWORD || DEFAULT_PASSWORD;

// Simple Discord Icon (Unicode or a placeholder)
const DiscordIcon = () => <span style={{ marginRight: '8px' }}>👾</span>; // Example: Alien Monster icon as placeholder

const PasswordProtect = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      if (!ENV_PASSWORD) {
        console.warn('API Docs Password is using the default fallback. Set VITE_API_DOCS_PASS in your .env file for production.');
      }
    } else {
      setError('Incorrect password. Please try again.');
      setPasswordInput('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="password-page-wrapper"> {/* Centering wrapper */}
      <div className="password-protect-card"> {/* Card styling similar to api-docs-card */}
        <h2 className="password-card-title">Password Protected Area</h2>
        <p className="password-card-text">
          Please enter the password to access the API documentation.
        </p>
        <form onSubmit={handleSubmit} className="password-card-form">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Password"
            className="password-card-input"
          />
          <button 
            type="submit"
            className="button password-card-button" // Re-use .button and add specific class
          >
            Access
          </button>
        </form>
        {error && <p className="password-card-error">{error}</p>}
        
        <a 
          href="https://discord.com/users/1292234446308900927"
          target="_blank" 
          rel="noopener noreferrer"
          className="button discord-button-password-page" // Re-use .button and add specific class
        >
          <DiscordIcon />
          Want API access for a project? DM me on Discord.
        </a>
      </div>
    </div>
  );
};

export default PasswordProtect; 