import React, { useState } from 'react';
import '../App.css'; // Use App.css for base styling, can add specific admin styles too

// Use environment variable for admin password
const ENV_PASSWORD_ADMIN = import.meta.env.VITE_ADMIN_PASSWORD;
const DEFAULT_ADMIN_PASSWORD = 'supersecretadmin'; // Fallback for local dev if .env is missing
const ADMIN_PASSWORD = ENV_PASSWORD_ADMIN || DEFAULT_ADMIN_PASSWORD;

// Log the password source for debugging
if (!ENV_PASSWORD_ADMIN) {
  console.warn('[PasswordProtectAdmin] Using default admin page password because VITE_ADMIN_PASSWORD is not set.');
}

const PasswordProtectAdmin = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      if (!ENV_PASSWORD_ADMIN) {
        // This console.warn can stay as it's a setup warning, not a password log
        console.warn('Admin Panel Password is using the default fallback. Set VITE_ADMIN_PASSWORD in your .env file for production.');
      }
    } else {
      setError('Incorrect admin password.');
      setPasswordInput('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="password-page-wrapper"> 
      <div className="password-protect-card admin-password-card"> 
        <h2 className="password-card-title">Admin Panel Access</h2>
        <p className="password-card-text">
          Please enter the admin password to manage API keys.
        </p>
        <form onSubmit={handleSubmit} className="password-card-form">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Admin Password"
            className="password-card-input"
          />
          <button 
            type="submit"
            className="button password-card-button"
          >
            Login
          </button>
        </form>
        {error && <p className="password-card-error">{error}</p>}
      </div>
    </div>
  );
};

export default PasswordProtectAdmin; 