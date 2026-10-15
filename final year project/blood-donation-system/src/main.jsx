import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router';
import './index.css'
import App from './App.jsx'
import DemoDataErrorBoundary from './components/DemoDataErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
   <StrictMode>
    <DemoDataErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DemoDataErrorBoundary>
  </StrictMode>,
)
