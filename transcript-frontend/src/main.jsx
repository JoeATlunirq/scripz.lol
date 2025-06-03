import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css'; // Assuming this contains global styles
// import ApiDocs from './ApiDocs.jsx'; // This will be handled by routing in App.jsx
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
    <BrowserRouter>
      <RouterProvider router={router} />
    </BrowserRouter>
  </React.StrictMode>,
);
