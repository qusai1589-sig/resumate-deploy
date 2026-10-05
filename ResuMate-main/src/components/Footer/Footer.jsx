import { Sparkles, Mail, MapPin, Globe } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <a href="#hero" className="footer-brand">
              <div className="footer-brand-icon">
                <Sparkles size={20} />
              </div>
              <span>ResuMate</span>
            </a>
            <p className="footer-description">
              ResuMate is an AI-driven resume builder empowering students, fresh graduates, 
              and job seekers to create recruiter-approved, ATS-compliant resumes with ease.
            </p>
            <div className="footer-social-row">
              {/* X / Twitter */}
              <span className="social-placeholder-btn" title="Twitter / X" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </span>
              {/* LinkedIn */}
              <span className="social-placeholder-btn" title="LinkedIn" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63c.9 0 1.63-.73 1.63-1.63s-.73-1.63-1.63-1.63z"/>
                </svg>
              </span>
              {/* GitHub */}
              <span className="social-placeholder-btn" title="GitHub" aria-label="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </span>
              {/* Globe */}
              <span className="social-placeholder-btn" title="Community" aria-label="Website">
                <Globe size={18} />
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-link-list">
              <li><a href="#hero" className="footer-link">Home</a></li>
              <li><a href="#features" className="footer-link">Features</a></li>
              <li><a href="#templates" className="footer-link">Templates</a></li>
              <li><a href="#how-it-works" className="footer-link">How It Works</a></li>
              <li><a href="#ai-features" className="footer-link">AI Superpowers</a></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="footer-col-title">Features</h4>
            <ul className="footer-link-list">
              <li><a href="#features" className="footer-link">Resume Builder</a></li>
              <li><a href="#ai-features" className="footer-link">AI Bullet Optimizer</a></li>
              <li><a href="#ai-features" className="footer-link">ATS Checker</a></li>
              <li><a href="#certificate" className="footer-link">Certificate OCR</a></li>
              <li><a href="#templates" className="footer-link">PDF Export</a></li>
            </ul>
          </div>

          {/* Templates */}
          <div>
            <h4 className="footer-col-title">Templates</h4>
            <ul className="footer-link-list">
              <li><a href="#templates" className="footer-link">Modern Template</a></li>
              <li><a href="#templates" className="footer-link">Executive Professional</a></li>
              <li><a href="#templates" className="footer-link">Nordic Minimal</a></li>
              <li><a href="#templates" className="footer-link">Creative Canvas</a></li>
              <li><a href="#templates" className="footer-link">ATS Optimized</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="footer-col-title">Contact</h4>
            <div className="contact-item">
              <Mail size={16} className="contact-icon" />
              <span>support@resumate.ai</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} className="contact-icon" />
              <span>San Francisco, CA & Remote</span>
            </div>
            <div className="contact-item">
              <Globe size={16} className="contact-icon" />
              <span>Available Globally</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div>
            © {new Date().getFullYear()} ResuMate. Build a resume. Build your future. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <a href="#privacy" className="footer-bottom-link" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" className="footer-bottom-link" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a href="#security" className="footer-bottom-link" onClick={(e) => e.preventDefault()}>Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
