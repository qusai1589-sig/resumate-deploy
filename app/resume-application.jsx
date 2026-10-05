'use client';

import dynamic from 'next/dynamic';

// The existing editor uses browser storage and browser history. Load it after
// hydration while keeping all its layouts and template renderers unchanged.
const ResumeApplication = dynamic(() => import('../src/App.jsx'), {
  ssr: false,
  loading: () => <main style={{ padding: '2rem' }} aria-live="polite">Loading ResuMate…</main>,
});

export default ResumeApplication;
