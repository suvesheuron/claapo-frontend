import { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'individual' | 'company' | 'vendor';

type RoleContextType = {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  // Hardcoded role value - change this to switch between roles
  const [currentRole, setCurrentRole] = useState<UserRole>('company'); //roles: individual, company, vendor

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}


