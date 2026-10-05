const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['pdf-to-img', 'pdfjs-dist', '@napi-rs/canvas'],
  outputFileTracingIncludes: {
    '/api/*': ['./node_modules/pdfjs-dist/**/*', './node_modules/@napi-rs/canvas*/**/*'],
  },
  outputFileTracingExcludes: {
    '/*': ['./legacy/**/*', './ai_resume_builder/**/*'],
  },
};

export default nextConfig;
