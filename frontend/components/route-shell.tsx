// File: frontend/components/route-shell.tsx
'use client';

import { usePathname } from 'next/navigation';
import AppShell from './app-shell';
import ToastViewport from './toast-viewport';

interface RouteShellProps {
  children: React.ReactNode;
}

const isAppRoute = (pathname: string): boolean => {
  return pathname.startsWith('/dashboard') || pathname.startsWith('/settings');
};

export default function RouteShell({ children }: RouteShellProps) {
  const pathname = usePathname();

  return (
    <>
      {isAppRoute(pathname) ? (
        <AppShell>{children}</AppShell>
      ) : (
        <div key={pathname} className="motion-safe:animate-[page-enter_320ms_ease]">
          {children}
        </div>
      )}
      <ToastViewport />
    </>
  );
}
