// File: frontend/app/auth/page.tsx
import { Suspense } from 'react';
import AuthShell from '@/components/auth-shell';

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="w-full max-w-xl rounded-4xl border border-white/10 bg-(--surface) p-8 text-center text-sm text-(--muted) shadow-(--shadow) backdrop-blur-xl">
            Preparing secure access...
          </div>
        </main>
      }
    >
      <AuthShell />
    </Suspense>
  );
}
