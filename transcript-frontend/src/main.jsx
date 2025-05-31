import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ApiDocs from './ApiDocs.jsx';
// import PasswordProtect from './components/PasswordProtect.jsx'; // No longer needed for ApiDocs
import PasswordProtectAdmin from './components/PasswordProtectAdmin.jsx'; // For Admin Panel
import AdminPanel from './components/AdminPanel.jsx'; // The Admin Panel UI
import './index.css'; // Assuming you might have global styles here
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/api-docs",
    // element: <PasswordProtect><ApiDocs /></PasswordProtect>, // Removed PasswordProtect
    element: <ApiDocs />, // Directly render ApiDocs
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
  </React.StrictMode>,
);
