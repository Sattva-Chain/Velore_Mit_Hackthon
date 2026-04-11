import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from "react-router-dom"
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/Auth.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 1. HashRouter must be first so it provides the 'Navigation Context' */}
    <HashRouter> 
      {/* 2. AuthProvider can now safely use useNavigate() */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)