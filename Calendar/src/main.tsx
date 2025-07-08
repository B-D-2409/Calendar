import React from "react";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './Components/ThemeProvider/ThemeProvider.tsx'
import  AuthProvider  from "./Common/AuthContext.tsx";
createRoot(document.getElementById('root')!).render(
  <AuthProvider>
  <BrowserRouter>
  <ThemeProvider>
  <StrictMode>
    <App />
  </StrictMode>
  </ThemeProvider>
  </BrowserRouter>
  </AuthProvider>
)
