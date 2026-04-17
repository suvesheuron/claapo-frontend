import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RoleProvider } from './contexts/RoleContext.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
      ThemeProvider (outermost) — applies .dark class on <html> for the theme toggle.
      RoleProvider — keeps existing useRole() hook working everywhere.
      AuthProvider — manages tokens, user identity, and session restore.
      AuthRoleSyncBridge inside App.tsx syncs auth role → RoleContext on login.
    */}
    <ThemeProvider>
      <RoleProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </RoleProvider>
    </ThemeProvider>
  </StrictMode>,
)
