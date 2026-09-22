import type { ReactNode } from 'react'

/** Every screen renders inside the same phone-sized app frame, on mobile and desktop alike. */
export function AppShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className="app-viewport">
    <div className={`app-shell flex flex-col ${className}`}>{children}</div>
  </div>
}
