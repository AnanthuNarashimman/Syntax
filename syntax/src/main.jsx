import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './config/firebase-config.js';
import App from './App.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
