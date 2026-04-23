import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FAFCFE',
            color: '#112035',
            border: '1px solid #C4D0DC',
            borderRadius: '12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            boxShadow: '0 8px 32px rgba(17,32,53,0.12)',
          },
          success: {
            iconTheme: { primary: '#1A7A45', secondary: '#FAFCFE' },
          },
          error: {
            iconTheme: { primary: '#E05A2B', secondary: '#FAFCFE' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
