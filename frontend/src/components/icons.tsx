export function BookLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="white" />
      <path d="M14 30C14 30 12 14 20 10C28 6 28 24 28 24" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M50 30C50 30 52 14 44 10C36 6 36 24 36 24" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 29C16 29 15 18 21 14C27 10 27 24 27 24" fill="#fed7aa" />
      <path d="M48 29C48 29 49 18 43 14C37 10 37 24 37 24" fill="#fed7aa" />
      <circle cx="32" cy="36" r="20" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
      <circle cx="18" cy="40" r="4" fill="#fed7aa" opacity="0.6" />
      <circle cx="46" cy="40" r="4" fill="#fed7aa" opacity="0.6" />
      <circle cx="24" cy="33" r="4" fill="#1c1917" />
      <circle cx="40" cy="33" r="4" fill="#1c1917" />
      <circle cx="26" cy="31" r="1.5" fill="white" />
      <circle cx="42" cy="31" r="1.5" fill="white" />
      <circle cx="23" cy="34" r="0.8" fill="white" />
      <circle cx="39" cy="34" r="0.8" fill="white" />
      <ellipse cx="32" cy="39" rx="2" ry="1.5" fill="#ea580c" />
      <path d="M27 41Q29 44 32 42Q35 44 37 41" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M29.5 42L30.5 42L30 43Z" fill="white" />
      <path d="M33.5 42L34.5 42L34 43Z" fill="white" />
      <line x1="18" y1="37" x2="6" y2="34" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="18" y1="40" x2="5" y2="40" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="18" y1="43" x2="6" y2="46" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="46" y1="37" x2="58" y2="34" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="46" y1="40" x2="59" y2="40" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="46" y1="43" x2="58" y2="46" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="35" cy="44" rx="1.2" ry="1.5" fill="#38bdf8" />
    </svg>
  )
}

export function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
