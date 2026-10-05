import '../src/index.css';

export const metadata = {
  title: 'ResuMate — Build a resume. Build your future.',
  description: 'Create editable resumes using your certificates and academic documents.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return <html lang="en"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  </head><body><div id="root">{children}</div></body></html>;
}
