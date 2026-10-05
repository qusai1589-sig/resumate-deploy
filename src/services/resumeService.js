/**
 * ResuMate Resume Service
 * 
 * Manages resume template retrieval, drafting, and export operations.
 * Designed to seamlessly bind with the backend REST endpoints in future sprints.
 */

import apiClient from './apiClient';

export const resumeService = {
  /**
   * Fetches all available resume templates
   */
  async getTemplates() {
    await apiClient.mockDelay(300);
    return [
      { id: 'modern', name: 'Modern', tag: 'Popular', category: 'General' },
      { id: 'professional', name: 'Professional', tag: 'Executive', category: 'Corporate' },
      { id: 'minimal', name: 'Minimal', tag: 'ATS-Optimized', category: 'Clean' },
      { id: 'creative', name: 'Creative', tag: 'Portfolio', category: 'Design & Tech' }
    ];
  },

  /**
   * Fetches details of a specific template
   */
  async getTemplateById(templateId) {
    await apiClient.mockDelay(200);
    return { id: templateId, name: templateId.charAt(0).toUpperCase() + templateId.slice(1) };
  },

  /**
   * Mock saving a resume draft
   */
  async saveResume(resumeData) {
    await apiClient.mockDelay();
    return { success: true, data: resumeData, message: 'Mock resume save; persistence is not connected.' };
  },

  /**
   * Mock export
   */
  async exportPDF(resumeId) {
    await apiClient.mockDelay(600);
    return { success: true, downloadUrl: `#mock-download-${resumeId}.pdf` };
  }
};

export default resumeService;
