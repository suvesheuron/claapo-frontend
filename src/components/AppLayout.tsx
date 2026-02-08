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
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <AppHeader variant={headerVariant} backTo={backTo} backLabel={backLabel} />
      <main className="flex-1">{children}</main>
      {showFooter && <AppFooter />}
    </div>
  );
}
