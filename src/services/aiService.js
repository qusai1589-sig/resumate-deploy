/**
 * ResuMate AI Service
 * 
 * Mock service abstraction for AI resume generation, bullet point improvement,
 * OCR certificate extraction, and ATS scoring.
 * Ready for backend endpoint wiring.
 */

import apiClient from './apiClient';

export const aiService = {
  /**
   * Mock AI resume bullet point enhancer
   */
  async improveBulletPoint(rawText) {
    await apiClient.mockDelay(500);
    return {
      original: rawText,
      improved: `Spearheaded key initiatives yielding a 35% increase in team productivity through targeted workflows.`,
      metricsIncluded: true
    };
  },

  /**
   * Mock ATS Checker analysis
   */
  async analyzeATS(resumeContent = {}) {
    await apiClient.mockDelay(600);
    const length = typeof resumeContent === 'string' ? resumeContent.length : Object.keys(resumeContent || {}).length;
    return {
      score: length > 0 ? 96 : 94,
      verdict: 'Excellent Match',
      matchedKeywords: ['React', 'JavaScript', 'REST APIs', 'Agile', 'Vite', 'Frontend Architecture'],
      missingKeywords: ['Docker', 'CI/CD Pipelines'],
      suggestions: [
        'Include measurable metrics in your project descriptions.',
        'Ensure standard section headers are used.'
      ]
    };
  },

  /**
   * Mock Certificate OCR extraction
   */
  async extractCertificate(file = null) {
    await apiClient.mockDelay(800);
    return {
      fileName: file?.name || 'Certificate.pdf',
      title: 'Full Stack Web Development Specialization',
      issuer: 'Coursera / DeepLearning.AI',
      issueDate: 'October 2025',
      skillsExtracted: ['React', 'Node.js', 'System Architecture', 'Database Management'],
      credentialId: 'CRT-984210-RM'
    };
  }
};

export default aiService;
