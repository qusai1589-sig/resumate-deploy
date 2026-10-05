import { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Target,
  Wand2,
  RefreshCw,
  Briefcase,
  Check,
} from 'lucide-react';

import './ATSChecker.css';

const mockAnalysis = {
  score: 84,
  matchLabel: 'Good Match',

  keywordMatch: 82,
  skillsMatch: 90,
  experienceMatch: 76,
  formatting: 95,

  matchedKeywords: [
    'React',
    'JavaScript',
    'SQL',
    'Git',
    'Problem Solving',
  ],

  missingKeywords: [
    'REST API',
    'Docker',
    'TypeScript',
    'CI/CD',
  ],

  strengths: [
    'Clear and readable resume structure',
    'Strong technical skills section',
    'Good use of project-based experience',
    'Consistent formatting',
  ],

  issues: [
    'Some important job-specific keywords are missing',
    'Experience descriptions could use more measurable results',
    'Professional summary can be more targeted',
  ],

  suggestions: [
    {
      id: 1,
      section: 'Professional Summary',
      title: 'Make your summary more ATS-friendly',
      current:
        'Computer Engineering student interested in software development and AI.',
      suggested:
        'Computer Engineering student with experience in React, JavaScript, SQL and AI-powered application development.',
    },

    {
      id: 2,
      section: 'Skills',
      title: 'Add missing technical keywords',
      current:
        'React, JavaScript, SQL, Git, Problem Solving',
      suggested:
        'React, JavaScript, TypeScript, SQL, REST APIs, Git, Docker, CI/CD, Problem Solving',
    },

    {
      id: 3,
      section: 'Experience',
      title: 'Add measurable impact',
      current:
        'Worked on frontend development and built responsive interfaces.',
      suggested:
        'Developed responsive React interfaces and improved user experience through reusable frontend components.',
    },
  ],
};

export default function ATSChecker({
  onBackToDashboard,
  onOpenResumeBuilder,
}) {
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] =
    useState('');

  const [analysisProgress, setAnalysisProgress] =
    useState(0);

  const [analysisStep, setAnalysisStep] =
    useState(0);

  const [analysis, setAnalysis] =
    useState(null);

  const [appliedSuggestions, setAppliedSuggestions] =
    useState([]);

  /* =====================================================
     FILE UPLOAD
  ===================================================== */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setMode('ready');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /* =====================================================
     USE EXISTING RESUME
  ===================================================== */

  const handleUseExistingResume = () => {
    setSelectedFile({
      name: 'My_Resume.pdf',
      type: 'application/pdf',
      size: 245000,
    });

    setMode('ready');
  };

  /* =====================================================
     ANALYZE
  ===================================================== */

  const handleAnalyze = () => {
    setMode('analyzing');
    setAnalysisProgress(0);
    setAnalysisStep(0);

    const steps = [
      'Reading resume',
      'Analyzing keywords',
      'Checking skills',
      'Checking formatting',
      'Generating ATS insights',
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep += 1;

      setAnalysisStep(currentStep);

      setAnalysisProgress(
        Math.min(
          currentStep * 20,
          100
        )
      );

      if (currentStep >= steps.length) {
        clearInterval(interval);

        setTimeout(() => {
          setAnalysis(mockAnalysis);
          setMode('results');
        }, 500);
      }
    }, 700);
  };

  /* =====================================================
     APPLY SUGGESTION
  ===================================================== */

  const handleApplySuggestion = (id) => {
    setAppliedSuggestions((current) => {
      if (current.includes(id)) {
        return current;
      }

      return [...current, id];
    });
  };

  /* =====================================================
     RESET
  ===================================================== */

  const handleCheckAnother = () => {
    setMode('upload');
    setSelectedFile(null);
    setJobDescription('');
    setAnalysis(null);
    setAnalysisProgress(0);
    setAnalysisStep(0);
    setAppliedSuggestions([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /* =====================================================
     UPLOAD SCREEN
  ===================================================== */

  if (mode === 'upload' || mode === 'ready') {
    return (
      <div className="ats-page">

        {/* NAVBAR */}
        <nav className="ats-navbar">
          <button
            type="button"
            className="ats-back-btn"
            onClick={onBackToDashboard}
          >
            <ArrowLeft size={17} />
            Dashboard
          </button>

          <div className="ats-logo">
            <Sparkles size={18} />
            <span>ResuMate</span>
          </div>
        </nav>

        {/* MAIN */}
        <main className="ats-main">

          <div className="ats-page-header">
            <div className="ats-page-icon">
              <Target size={25} />
            </div>

            <p className="ats-eyebrow">
              RESUME ANALYSIS
            </p>

            <h1>
              Check Your
              <span> ATS Score</span>
            </h1>

            <p>
              See how well your resume matches applicant
              tracking system requirements and discover
              what you can improve.
            </p>
          </div>

          <div className="ats-upload-layout">

            {/* RESUME UPLOAD */}
            <section className="ats-card">

              <div className="ats-card-heading">
                <div>
                  <h2>Upload Your Resume</h2>

                  <p>
                    Upload your PDF or DOCX resume.
                  </p>
                </div>

                <FileText size={22} />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                hidden
              />

              {!selectedFile ? (
                <button
                  type="button"
                  className="ats-dropzone"
                  onClick={handleUploadClick}
                >
                  <div className="ats-upload-icon">
                    <Upload size={26} />
                  </div>

                  <strong>
                    Click to upload your resume
                  </strong>

                  <span>
                    PDF, DOC or DOCX
                  </span>
                </button>
              ) : (
                <div className="ats-file-selected">

                  <div className="ats-file-icon">
                    <FileText size={24} />
                  </div>

                  <div className="ats-file-info">
                    <strong>
                      {selectedFile.name}
                    </strong>

                    <span>
                      Resume ready for analysis
                    </span>
                  </div>

                  <CheckCircle2
                    size={22}
                    className="ats-file-check"
                  />
                </div>
              )}

              <button
                type="button"
                className="ats-secondary-btn"
                onClick={handleUseExistingResume}
              >
                <FileText size={16} />
                Use Existing Resume
              </button>

            </section>

            {/* JOB DESCRIPTION */}
            <section className="ats-card">

              <div className="ats-card-heading">
                <div>
                  <h2>Job Description</h2>

                  <p>
                    Optional — improves keyword matching.
                  </p>
                </div>

                <Briefcase size={22} />
              </div>

              <textarea
                className="ats-job-textarea"
                value={jobDescription}
                onChange={(event) =>
                  setJobDescription(
                    event.target.value
                  )
                }
                placeholder="Paste the job description here..."
              />

              <div className="ats-job-hint">
                <Sparkles size={14} />
                Adding a job description helps identify
                missing keywords.
              </div>

            </section>

          </div>

          {/* ANALYZE BUTTON */}
          <div className="ats-analyze-wrapper">

            <button
              type="button"
              className="ats-primary-btn"
              disabled={!selectedFile}
              onClick={handleAnalyze}
            >
              <Search size={18} />
              Analyze Resume
              <ArrowRight size={17} />
            </button>

            {!selectedFile && (
              <p>
                Upload your resume first to begin analysis.
              </p>
            )}

          </div>

        </main>
      </div>
    );
  }

  /* =====================================================
     ANALYZING SCREEN
  ===================================================== */

  if (mode === 'analyzing') {
    const steps = [
      'Reading resume',
      'Analyzing keywords',
      'Checking skills',
      'Checking formatting',
      'Generating ATS insights',
    ];

    return (
      <div className="ats-page">

        <nav className="ats-navbar">
          <div className="ats-logo">
            <Sparkles size={18} />
            <span>ResuMate</span>
          </div>
        </nav>

        <main className="ats-main ats-analysis-main">

          <div className="ats-analysis-card">

            <div className="ats-analysis-icon">
              <Sparkles size={30} />
            </div>

            <p className="ats-eyebrow">
              ANALYZING RESUME
            </p>

            <h1>
              Checking your resume...
            </h1>

            <p>
              We're reviewing your resume for ATS
              compatibility, skills and keywords.
            </p>

            <div className="ats-progress-track">
              <div
                className="ats-progress-fill"
                style={{
                  width: `${analysisProgress}%`,
                }}
              />
            </div>

            <span className="ats-progress-value">
              {analysisProgress}%
            </span>

            <div className="ats-analysis-steps">

              {steps.map((step, index) => {
                const completed =
                  analysisStep > index;

                const active =
                  analysisStep === index;

                return (
                  <div
                    key={step}
                    className={`ats-analysis-step ${
                      completed
                        ? 'completed'
                        : ''
                    } ${
                      active
                        ? 'active'
                        : ''
                    }`}
                  >
                    <div className="ats-step-icon">

                      {completed ? (
                        <Check size={15} />
                      ) : active ? (
                        <RefreshCw
                          size={15}
                          className="ats-spin"
                        />
                      ) : (
                        <span>
                          {index + 1}
                        </span>
                      )}

                    </div>

                    <span>{step}</span>
                  </div>
                );
              })}

            </div>

          </div>

        </main>
      </div>
    );
  }

  /* =====================================================
     RESULTS SCREEN
  ===================================================== */

  return (
    <div className="ats-page">

      {/* NAVBAR */}
      <nav className="ats-navbar">

        <button
          type="button"
          className="ats-back-btn"
          onClick={onBackToDashboard}
        >
          <ArrowLeft size={17} />
          Dashboard
        </button>

        <div className="ats-logo">
          <Sparkles size={18} />
          <span>ResuMate</span>
        </div>

      </nav>

      <main className="ats-results-main">

        {/* HEADER */}
        <section className="ats-results-header">

          <div>
            <p className="ats-eyebrow">
              ATS ANALYSIS COMPLETE
            </p>

            <h1>
              Your Resume
              <span> Analysis</span>
            </h1>

            <p>
              Here's how your resume performs against
              ATS-friendly resume standards.
            </p>
          </div>

          <button
            type="button"
            className="ats-secondary-btn"
            onClick={handleCheckAnother}
          >
            <RefreshCw size={16} />
            Check Another Resume
          </button>

        </section>

        {/* SCORE */}
        <section className="ats-score-card">

          <div className="ats-score-circle">

            <div className="ats-score-inner">

              <strong>
                {analysis?.score}
              </strong>

              <span>
                /100
              </span>

            </div>

          </div>

          <div className="ats-score-details">

            <p className="ats-score-label">
              ATS SCORE
            </p>

            <h2>
              {analysis?.matchLabel}
            </h2>

            <p>
              Your resume is well structured and
              compatible with many ATS systems, but
              there are some areas that can be improved.
            </p>

            <div className="ats-score-file">
              <FileText size={15} />
              {selectedFile?.name}
            </div>

          </div>

        </section>

        {/* METRICS */}
        <section className="ats-metrics-grid">

          <div className="ats-metric-card">
            <div className="ats-metric-icon">
              <Search size={19} />
            </div>

            <div>
              <span>
                Keyword Match
              </span>

              <strong>
                {analysis?.keywordMatch}%
              </strong>
            </div>
          </div>

          <div className="ats-metric-card">
            <div className="ats-metric-icon">
              <Sparkles size={19} />
            </div>

            <div>
              <span>
                Skills Match
              </span>

              <strong>
                {analysis?.skillsMatch}%
              </strong>
            </div>
          </div>

          <div className="ats-metric-card">
            <div className="ats-metric-icon">
              <Briefcase size={19} />
            </div>

            <div>
              <span>
                Experience Match
              </span>

              <strong>
                {analysis?.experienceMatch}%
              </strong>
            </div>
          </div>

          <div className="ats-metric-card">
            <div className="ats-metric-icon">
              <CheckCircle2 size={19} />
            </div>

            <div>
              <span>
                Formatting
              </span>

              <strong>
                {analysis?.formatting}%
              </strong>
            </div>
          </div>

        </section>

        {/* KEYWORDS */}
        <section className="ats-results-two-column">

          {/* MATCHED */}
          <div className="ats-result-card">

            <div className="ats-result-heading">
              <div className="ats-result-title success">
                <CheckCircle2 size={18} />
                <h2>Matched Keywords</h2>
              </div>

              <span>
                {analysis?.matchedKeywords.length}
              </span>
            </div>

            <div className="ats-keyword-list">

              {analysis?.matchedKeywords.map(
                (keyword) => (
                  <span
                    className="ats-keyword matched"
                    key={keyword}
                  >
                    <Check size={13} />
                    {keyword}
                  </span>
                )
              )}

            </div>

          </div>

          {/* MISSING */}
          <div className="ats-result-card">

            <div className="ats-result-heading">
              <div className="ats-result-title warning">
                <AlertCircle size={18} />
                <h2>Missing Keywords</h2>
              </div>

              <span>
                {analysis?.missingKeywords.length}
              </span>
            </div>

            <div className="ats-keyword-list">

              {analysis?.missingKeywords.map(
                (keyword) => (
                  <span
                    className="ats-keyword missing"
                    key={keyword}
                  >
                    <XCircle size={13} />
                    {keyword}
                  </span>
                )
              )}

            </div>

          </div>

        </section>

        {/* STRENGTHS + ISSUES */}
        <section className="ats-results-two-column">

          {/* Strengths */}
          <div className="ats-result-card">

            <div className="ats-result-title success">
              <CheckCircle2 size={18} />
              <h2>What You're Doing Well</h2>
            </div>

            <div className="ats-bullet-list">

              {analysis?.strengths.map(
                (item) => (
                  <div
                    className="ats-bullet-item"
                    key={item}
                  >
                    <CheckCircle2 size={16} />
                    <span>{item}</span>
                  </div>
                )
              )}

            </div>

          </div>

          {/* Issues */}
          <div className="ats-result-card">

            <div className="ats-result-title warning">
              <AlertCircle size={18} />
              <h2>Areas to Improve</h2>
            </div>

            <div className="ats-bullet-list">

              {analysis?.issues.map(
                (item) => (
                  <div
                    className="ats-bullet-item issue"
                    key={item}
                  >
                    <AlertCircle size={16} />
                    <span>{item}</span>
                  </div>
                )
              )}

            </div>

          </div>

        </section>

        {/* =================================================
            IMPROVE RESUME
        ================================================= */}
        <section className="ats-improve-section">

          <div className="ats-improve-header">

            <div>
              <div className="ats-improve-icon">
                <Wand2 size={21} />
              </div>

              <div>
                <p className="ats-eyebrow">
                  AI RESUME COACH
                </p>

                <h2>
                  Improve Your Resume
                </h2>

                <p>
                  Get guided suggestions for making your
                  resume stronger and more ATS-friendly.
                </p>
              </div>
            </div>

          </div>

          <div className="ats-suggestions">

            {analysis?.suggestions.map(
              (suggestion) => {

                const isApplied =
                  appliedSuggestions.includes(
                    suggestion.id
                  );

                return (
                  <div
                    className={`ats-suggestion-card ${
                      isApplied
                        ? 'applied'
                        : ''
                    }`}
                    key={suggestion.id}
                  >

                    <div className="ats-suggestion-top">

                      <div>
                        <span className="ats-suggestion-section">
                          {suggestion.section}
                        </span>

                        <h3>
                          {suggestion.title}
                        </h3>
                      </div>

                      {isApplied && (
                        <span className="ats-applied-badge">
                          <Check size={13} />
                          Applied
                        </span>
                      )}

                    </div>

                    <div className="ats-comparison">

                      <div className="ats-current-box">
                        <span>
                          CURRENT
                        </span>

                        <p>
                          {suggestion.current}
                        </p>
                      </div>

                      <ArrowRight
                        size={18}
                        className="ats-comparison-arrow"
                      />

                      <div className="ats-suggested-box">
                        <span>
                          AI SUGGESTION
                        </span>

                        <p>
                          {suggestion.suggested}
                        </p>
                      </div>

                    </div>

                    <button
                      type="button"
                      className="ats-apply-btn"
                      disabled={isApplied}
                      onClick={() =>
                        handleApplySuggestion(
                          suggestion.id
                        )
                      }
                    >
                      {isApplied ? (
                        <>
                          <Check size={15} />
                          Suggestion Applied
                        </>
                      ) : (
                        <>
                          <Wand2 size={15} />
                          Apply Suggestion
                        </>
                      )}
                    </button>

                  </div>
                );
              }
            )}

          </div>

          {/* OPEN RESUME BUILDER */}
          <div className="ats-coach-footer">

            <div>
              <Sparkles size={18} />

              <span>
                Ready to improve your resume?
              </span>
            </div>

            <button
              type="button"
              className="ats-primary-btn"
              onClick={
                onOpenResumeBuilder
              }
            >
              Open Resume Builder
              <ArrowRight size={17} />
            </button>

          </div>

        </section>

      </main>
    </div>
  );
}