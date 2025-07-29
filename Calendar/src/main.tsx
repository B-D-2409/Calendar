/**
 * @file index.tsx
 * @description Entry point of the React application.
 * Sets up React root rendering and wraps the <App /> component with
 * routing, authentication context, and theme provider.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './Components/ThemeProvider/ThemeProvider'
import  AuthProvider  from "./Common/AuthContext";
/**
 * Initializes the React application and renders it into the root DOM element.
 * The app is wrapped with:
 * - BrowserRouter for client-side routing
 * - AuthProvider for authentication context
 * - ThemeProvider for theme management
 * 
 * Uncomment <StrictMode> if React strict mode is desired during development.
 */
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
  <AuthProvider>
  <ThemeProvider>
  {/* <StrictMode> */}
    <App />
  {/* </StrictMode> */}
  </ThemeProvider>
  </AuthProvider>
  </BrowserRouter>
  
)
