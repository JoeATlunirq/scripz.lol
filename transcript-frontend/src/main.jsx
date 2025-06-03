import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Assuming this contains global styles
import ApiDocs from './ApiDocs.jsx'; // UNCOMMENTED/ADDED: ApiDocs must be imported here
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'; // ADDED: Import PrivacyPolicy
import PasswordProtectAdmin from './components/PasswordProtectAdmin.jsx'; // For Admin Panel
import AdminPanel from './components/AdminPanel.jsx'; // The Admin Panel UI
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/api-docs",
    element: <ApiDocs />, // ApiDocs is used here
  },
  {
    path: "/privacy-policy", // ADDED: Route for Privacy Policy
    element: <PrivacyPolicy />,
  },
  {
    path: "/admin", // New Admin Route
    element: (
      <PasswordProtectAdmin>
        <AdminPanel />
      </PasswordProtectAdmin>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
