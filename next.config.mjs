const nextConfig = {
  poweredByHeader: false,
  outputFileTracingExcludes: {
    '/*': ['./legacy/**/*', './ai_resume_builder/**/*'],
  },
};

export default nextConfig;
