import type { ReactNode } from 'react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';

type AppLayoutProps = {
  children: ReactNode;
  headerVariant?: 'landing' | 'back';
  backTo?: string;
  backLabel?: string;
  showFooter?: boolean;
};

export default function AppLayout({
  children,
  headerVariant = 'landing',
  backTo,
  backLabel,
  showFooter = true,
}: 
AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
      <AppHeader variant={headerVariant} backTo={backTo} backLabel={backLabel} />
      <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden flex flex-col">{children}</main>
      {showFooter && <AppFooter />}
    </div>
  );
}
