import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ApiDocs from './ApiDocs.jsx';
import './index.css'; // Assuming you might have global styles here
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/api-docs",
    element: <ApiDocs />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
