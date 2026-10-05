
import {
  FileText,
  Award,
  Sparkles,
  Plus,
  ArrowRight,
  Upload,
  LayoutTemplate,
  CheckCircle2,
  Gauge,
} from 'lucide-react';

import './Dashboard.css';

export default function Dashboard({
  onCreateResume,
  onOpenVault,
  onOpenATS,
  accountMenu,
}) {
  return (
    <div className="dashboard-page">

      {/* =====================================================
          NAVBAR
      ===================================================== */}
      <nav className="dashboard-navbar">
        <div className="dashboard-logo">
          <span>ResuMate</span>
        </div>

        <div className="dashboard-user">
          {accountMenu}
        </div>
      </nav>

      {/* =====================================================
          MAIN
      ===================================================== */}
      <main className="dashboard-main">
        <div className="dashboard-container">

          {/* =================================================
              WELCOME
          ================================================= */}
          <section className="dashboard-welcome">
            <div>
              <p className="dashboard-eyebrow">
                Welcome back 👋
              </p>

              <h1>
                Build Your Resume,
                <span> Build Your Future.</span>
              </h1>

              <p>
                Create a professional resume, manage your
                certificates and improve your profile with AI.
              </p>
            </div>
          </section>

          {/* =================================================
              STATS
          ================================================= */}
          <section className="dashboard-stats">

            {/* My Resumes */}
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                <FileText size={22} />
              </div>

              <div>
                <span>My Resumes</span>
                <strong>0</strong>
              </div>
            </div>

            {/* Certificates */}
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                <Award size={22} />
              </div>

              <div>
                <span>Certificates</span>
                <strong>0</strong>
              </div>
            </div>

            {/* Resume Score */}
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                <Sparkles size={22} />
              </div>

              <div>
                <span>Resume Score</span>
                <strong>--</strong>
              </div>
            </div>

          </section>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}
          <section className="dashboard-section">

            <div className="dashboard-section-heading">
              <div>
                <h2>Quick Actions</h2>

                <p>
                  Everything you need to build and improve
                  your resume.
                </p>
              </div>
            </div>

            <div className="dashboard-actions">

              {/* =============================================
                  CREATE RESUME
              ============================================= */}
              <div className="dashboard-action-card">

                <div className="dashboard-action-icon">
                  <Plus size={23} />
                </div>

                <div className="dashboard-action-content">

                  <h3>Create Resume</h3>

                  <p>
                    Start building a professional resume
                    using our templates and easy editor.
                  </p>

                  <button
                    type="button"
                    onClick={onCreateResume}
                  >
                    Create Resume
                    <ArrowRight size={16} />
                  </button>

                </div>
              </div>

              {/* =============================================
                  MY CERTIFICATES
              ============================================= */}
              <div className="dashboard-action-card">

                <div className="dashboard-action-icon">
                  <Award size={23} />
                </div>

                <div className="dashboard-action-content">

                  <h3>My Certificates</h3>

                  <p>
                    Upload, manage and extract information
                    from your certificates.
                  </p>

                  <button
                    type="button"
                    onClick={onOpenVault}
                  >
                    Open Certificate Vault
                    <ArrowRight size={16} />
                  </button>

                </div>
              </div>

              {/* =============================================
                  AI RESUME ASSISTANT
              ============================================= */}
              <div className="dashboard-action-card">

                <div className="dashboard-action-icon">
                  <Sparkles size={23} />
                </div>

                <div className="dashboard-action-content">

                  <h3>AI Resume Assistant</h3>

                  <p>
                    Improve your resume content and get
                    intelligent suggestions with AI.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        'AI Resume Assistant will be available soon.'
                      )
                    }
                  >
                    Try AI Assistant
                    <ArrowRight size={16} />
                  </button>

                </div>
              </div>

              {/* =============================================
                  ATS SCORE CHECKER
              ============================================= */}
              <div className="dashboard-action-card">

                <div className="dashboard-action-icon">
                  <Gauge size={23} />
                </div>

                <div className="dashboard-action-content">

                  <h3>ATS Score Checker</h3>

                  <p>
                    Check how well your resume matches ATS
                    requirements and identify areas to improve.
                  </p>

                  <button
                    type="button"
                    onClick={onOpenATS}
                  >
                    Check ATS Score
                    <ArrowRight size={16} />
                  </button>

                </div>
              </div>

            </div>
          </section>

          {/* =================================================
              GETTING STARTED
          ================================================= */}
          <section className="dashboard-section">

            <div className="dashboard-section-heading">
              <div>
                <h2>Getting Started</h2>

                <p>
                  Follow these simple steps to build your
                  resume.
                </p>
              </div>
            </div>

            <div className="dashboard-getting-started">

              {/* Step 1 */}
              <div className="dashboard-start-item">

                <div className="dashboard-start-number">
                  1
                </div>

                <div>
                  <h3>
                    Create your resume
                  </h3>

                  <p>
                    Choose a template and enter your
                    education, skills, projects and
                    experience.
                  </p>
                </div>

                <LayoutTemplate size={22} />

              </div>

              {/* Step 2 */}
              <div className="dashboard-start-item">

                <div className="dashboard-start-number">
                  2
                </div>

                <div>
                  <h3>
                    Upload certificates
                  </h3>

                  <p>
                    Store your certificates and extract
                    useful achievement information.
                  </p>
                </div>

                <Upload size={22} />

              </div>

              {/* Step 3 */}
              <div className="dashboard-start-item">

                <div className="dashboard-start-number">
                  3
                </div>

                <div>
                  <h3>
                    Improve with AI
                  </h3>

                  <p>
                    Check your resume and discover areas
                    that can be improved.
                  </p>
                </div>

                <CheckCircle2 size={22} />

              </div>

            </div>
          </section>

          {/* =================================================
              EMPTY WORKSPACE
          ================================================= */}
          <section className="dashboard-empty">

            <div className="dashboard-empty-icon">
              <FileText size={30} />
            </div>

            <h2>
              Your Resume Workspace
            </h2>

            <p>
              You haven't created a resume yet.
              Start your first resume and it will appear here.
            </p>

            <button
              type="button"
              className="dashboard-empty-btn"
              onClick={onCreateResume}
            >
              <Plus size={17} />
              Create Your First Resume
            </button>

          </section>

        </div>
      </main>
    </div>
  );
}
