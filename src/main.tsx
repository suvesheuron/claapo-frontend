import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RoleProvider } from './contexts/RoleContext.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
      RoleProvider (outer) — keeps existing useRole() hook working everywhere.
      AuthProvider (inner) — manages tokens, user identity, and session restore.
      AuthRoleSyncBridge inside App.tsx syncs auth role → RoleContext on login.
    */}
    <RoleProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </RoleProvider>
  </StrictMode>,
)
 