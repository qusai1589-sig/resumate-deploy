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
import apiClient from '../services/apiClient';
import { inspectResume } from '../services/atsValidation';

export default function ATSChecker({
  existingResume,
  onBackToDashboard,
  onOpenResumeBuilder,
}) {
  const fileInputRef = useRef(null);

  const [error, setError] = useState('');
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
    setSelectedFile(null);
    setAnalysis(null);
    setMode('upload');

    if (!file) {
      return;
    }

    if (!/\.(pdf|docx|txt)$/i.test(file.name) || file.size > 10 * 1024 * 1024 || !file.size) {
      setError('Choose a nonempty PDF, DOCX or TXT file, up to 10 MB.');
      return;
    }
    setError('');
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
    if (!existingResume || existingResume._exampleSections?.length) { setError('Save a resume with your own details first; example content cannot be scored.'); return; }
    setError('');
    setSelectedFile({ name: 'Current Resume', resume: existingResume });

    setMode('ready');
  };

  /* =====================================================
     ANALYZE
  ===================================================== */

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setError('');
    setAnalysis(null);
    setMode('analyzing');
    setAnalysisProgress(20);
    setAnalysisStep(0);
    try {
      let body;
      if (selectedFile.resume) {
        const resume = selectedFile.resume;
        const lines = [Object.values(resume.personal || {}).join(' '), ...(resume.summary ? ['Summary', resume.summary] : [])];
        for (const section of ['skills', 'education', 'experience', 'projects', 'achievements']) {
          if (resume[section]?.length) lines.push(section, ...resume[section].map(item => typeof item === 'string' ? item : Object.values(item).join(' ')));
        }
        const resumeText = lines.join('\n');
        const validation = inspectResume(resumeText);
        if (!validation.accepted) throw new Error(validation.reason);
        body = { resumeText, jobDescription };
      } else {
        if (/\.txt$/i.test(selectedFile.name)) {
          const validation = inspectResume(await selectedFile.text());
          if (!validation.accepted) throw new Error(validation.reason);
        }
        body = new FormData();
        body.append('resume', selectedFile);
        body.append('jobDescription', jobDescription);
      }
      const result = await apiClient.post('/ats/analyze', body);
      if (result.documentType !== 'resume' || result.methodologyVersion !== 2 || !Number.isFinite(result.score) || result.score < 0 || result.score > 100) {
        throw new Error('The deployed ATS service is outdated or returned an invalid result. Deploy the latest frontend and backend together.');
      }
      setAnalysisProgress(100);
      setAnalysisStep(5);
      setAnalysis(result);
      setAppliedSuggestions([]);
      setMode('results');
    } catch (err) {
      setError(err.message || 'Unable to read this resume. Try another file.');
      setSelectedFile(null);
      setAnalysis(null);
      setMode('upload');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
    setError('');
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
                    Resumes only: PDF, DOCX or TXT (up to 10 MB). Other documents will be rejected.
                  </p>
                </div>

                <FileText size={22} />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
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
                    PDF, DOCX or TXT
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
                      Resume selected — content will be validated
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
                maxLength={20000}
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

          {error && <p role="alert" className="ats-error">{error}</p>}
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
              RESUME VALIDATED · ATS ANALYSIS V2
            </p>

            <h1>
              Your Resume
              <span> Analysis</span>
            </h1>

            <p>
              Results calculated from the contents of this resume.
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

          <div className="ats-score-circle" style={{ '--ats-score-angle': `${(analysis?.score || 0) * 3.6}deg` }}>

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
              {analysis?.summary}
            </p>

            <div className="ats-score-file">
              <FileText size={15} />
              {selectedFile?.name}
            </div>

          </div>

        </section>

        <p className="ats-job-hint">Content quality: {analysis?.contentQuality}% · {analysis?.wordCount} words. Score weights: {Object.entries(analysis?.weights || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1')}: ${value}%`).join(' · ')}. N/A means there is insufficient evidence to assess that metric.</p>
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
                {analysis?.keywordMatch == null ? 'N/A' : `${analysis.keywordMatch}%`}
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
                {analysis?.skillsMatch == null ? 'N/A' : `${analysis.skillsMatch}%`}
              </strong>
            </div>
          </div>

          <div className="ats-metric-card">
            <div className="ats-metric-icon">
              <Briefcase size={19} />
            </div>

            <div>
              <span>
                Experience Requirement
              </span>

              <strong>
                {analysis?.experienceMatch == null ? 'N/A' : `${analysis.experienceMatch}%`}
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
                  RESUME COACH
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
                          Reviewed
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
                          SUGGESTED ACTION
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
                          Marked Reviewed
                        </>
                      ) : (
                        <>
                          <Wand2 size={15} />
                          Mark Reviewed
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