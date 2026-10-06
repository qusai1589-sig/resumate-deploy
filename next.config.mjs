const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['pdf-to-img', 'pdfjs-dist', '@napi-rs/canvas'],
  outputFileTracingIncludes: {
    '/api/*': ['./node_modules/pdfjs-dist/legacy/build/*.mjs', './node_modules/pdfjs-dist/cmaps/**/*', './node_modules/pdfjs-dist/standard_fonts/**/*', './node_modules/pdfjs-dist/wasm/**/*', './node_modules/@napi-rs/canvas*/**/*'],
  },
  outputFileTracingExcludes: {
    '/*': ['./legacy/**/*', './ai_resume_builder/**/*'],
  },
};

export default nextConfig;
