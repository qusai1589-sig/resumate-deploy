export const aiFeaturesData = [
  {
    id: 'ai-generator',
    title: 'AI Resume Generator',
    description: 'Provide your target job role and background. ResuMate auto-generates comprehensive sections tailored to your chosen industry standard.',
    badge: 'Core Feature',
    iconName: 'Bot',
    mockDetails: {
      prompt: 'Target Role: Frontend Developer (React)',
      result: 'Generated tailored professional summary & 4 prioritized project highlights.'
    }
  },
  {
    id: 'improve-content',
    title: 'Improve Resume Content',
    description: 'Transform weak bullet points into quantifiable high-impact accomplishment statements backed by action verbs and metrics.',
    badge: 'Content Booster',
    iconName: 'Sparkles',
    mockDetails: {
      before: 'Helped build the web app for customer accounts.',
      after: 'Engineered customer account portal using React & Redux, cutting page load time by 42% for 50,000+ monthly active users.'
    }
  },
  {
    id: 'cert-extraction',
    title: 'Certificate Information Extraction',
    description: 'Our upcoming OCR vision engine parses PDF and image credentials from Coursera, Udemy, AWS, and universities in seconds.',
    badge: 'Smart OCR',
    iconName: 'FileCheck',
    mockDetails: {
      source: 'AWS Certified Cloud Practitioner.pdf',
      extracted: 'Verified Credential ID: AWS-89214 • Skills: EC2, S3, IAM, Cloud Architecture'
    }
  },
  {
    id: 'ats-checker',
    title: 'ATS Resume Checker',
    description: 'Instant scoring report analyzing keyword density, structural parsing, typography compatibility, and recruiter scan readiness.',
    badge: 'Compliance',
    iconName: 'FileSearch',
    mockDetails: {
      score: '96/100',
      rating: 'Top 5% of Applicant Resumes'
    }
  }
];
