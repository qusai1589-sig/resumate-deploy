import { useEffect, useRef, useState } from 'react';

import {
  ArrowLeft,
  Download,
  Save,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Globe,
  Upload,
  Award,
} from 'lucide-react';

import './ResumeBuilder.css';
import { uploadDocuments, getDocumentForResume, combineDocumentsForResume } from '../services/documentService';
import { applyDocumentToResume, templateResume } from '../services/documentResume';

const emptyEducation = {
  degree: '',
  institution: '',
  year: '',
  details: '',
};

const emptyExperience = {
  role: '',
  company: '',
  duration: '',
  description: '',
};

const emptyProject = {
  name: '',
  technologies: '',
  description: '',
  link: '',
};

export default function ResumeBuilder({
  onBackToDashboard,
  selectedTemplate = 'modern',
  resumeDraft,
  onResumeChange,
  onOpenVault,
  onSaveResume,
  accountMenu,
}) {
  const [activeSection, setActiveSection] = useState('personal');
  const [previewMode, setPreviewMode] = useState(false);
  const [localResume, setLocalResume] = useState(templateResume);
  const resume = resumeDraft || localResume;
  const setResume = onResumeChange || setLocalResume;
  const [saved, setSaved] = useState(false);
  const [certificateBusy, setCertificateBusy] = useState(false);
  const [certificateMessage, setCertificateMessage] = useState('');
  const [certificateError, setCertificateError] = useState('');
  const [saveError, setSaveError] = useState('');
  const certificateInput = useRef(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const handleCertificateUpload = async event => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || certificateBusy) return;
    setCertificateBusy(true); setCertificateMessage(''); setCertificateError('');
    try {
      const result = await uploadDocuments(files);
      const usable = []; const failures = result.failures.map(item => `${item.filename}: ${item.error}`);
      if (result.uploaded.length > 1) {
        try { usable.push(await combineDocumentsForResume(result.uploaded)); }
        catch (error) { failures.push(error.message); }
      } else {
        for (const document of result.uploaded) {
          try { usable.push(await getDocumentForResume(document)); }
          catch (error) { failures.push(`${document.file_name}: ${error.message}`); }
        }
      }
      if (!mounted.current) return;
      if (usable.length) {
        setResume(current => usable.reduce((draft, document) => applyDocumentToResume(draft, document), current));
        setSaved(false);
        setCertificateMessage(`${result.uploaded.length} document${result.uploaded.length === 1 ? '' : 's'} added to your vault. ${result.uploaded.length > 1 ? 'A combined summary and information from all certificates have' : 'Extracted information has'} filled the relevant resume sections; review and edit it below.`);
      }
      if (failures.length) setCertificateError(failures.join('; '));
    } catch (error) { if (mounted.current) setCertificateError(error.message); }
    finally { if (mounted.current) setCertificateBusy(false); }
  };
  const [showSectionMenu, setShowSectionMenu] = useState(false);

  /* =====================================================
     TEMPLATE NAMES
  ===================================================== */

  const templateNames = {
    modern: 'Modern',
    professional: 'Professional',
    minimal: 'Minimal',
    creative: 'Creative',
    executive: 'Executive',
    tech: 'Tech',
    student: 'Student',
    academic: 'Academic',
    developer: 'Developer',
    corporate: 'Corporate',
    classic: 'Classic',
    elegant: 'Elegant',
    portfolio: 'Portfolio',
    'ats-simple': 'ATS Simple',
  };

  /* =====================================================
     FIXED + CUSTOM SECTIONS
  ===================================================== */

  const sections = [
    {
      id: 'personal',
      label: 'Personal Info',
    },
    {
      id: 'summary',
      label: 'Summary',
    },
    {
      id: 'education',
      label: 'Education',
    },
    {
      id: 'experience',
      label: 'Experience',
    },
    {
      id: 'projects',
      label: 'Projects',
    },
    {
      id: 'skills',
      label: 'Skills',
    },
    {
      id: 'achievements',
      label: 'Achievements',
    },

    ...resume.customSections.map((section) => ({
      id: section.id,
      label: section.title,
      custom: true,
    })),
  ];

  /* =====================================================
     BASIC UPDATE HELPERS
  ===================================================== */

  const updateField = (section, field, value) => {
    setResume((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));

    setSaved(false);
  };

  const updateArrayItem = (
    section,
    index,
    field,
    value
  ) => {
    setResume((current) => ({
      ...current,
      [section]: current[section].map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
      ),
    }));

    setSaved(false);
  };

  const addArrayItem = (section, emptyItem) => {
    setResume((current) => ({
      ...current,
      [section]: [
        ...current[section],
        { ...emptyItem },
      ],
    }));

    setSaved(false);
  };

  const removeArrayItem = (section, index) => {
    setResume((current) => ({
      ...current,
      [section]: current[section].filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));

    setSaved(false);
  };

  /* =====================================================
     CUSTOM SECTION FUNCTIONS
  ===================================================== */

  const addCustomSection = (title) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) return;

    const newSection = {
      id: `custom-${Date.now()}-${resume.customSections.length}`,
      title: trimmedTitle,
      content: '',
    };

    setResume((current) => ({
      ...current,
      customSections: [
        ...current.customSections,
        newSection,
      ],
    }));

    setActiveSection(newSection.id);
    setSaved(false);
    setShowSectionMenu(false);
  };

  const updateCustomSection = (
    id,
    field,
    value
  ) => {
    setResume((current) => ({
      ...current,
      customSections: current.customSections.map(
        (section) =>
          section.id === id
            ? {
                ...section,
                [field]: value,
              }
            : section
      ),
    }));

    setSaved(false);
  };

  const removeCustomSection = (id) => {
    setResume((current) => ({
      ...current,
      customSections:
        current.customSections.filter(
          (section) => section.id !== id
        ),
    }));

    setSaved(false);

    if (activeSection === id) {
      setActiveSection('personal');
    }
  };

  /* =====================================================
     PREDEFINED CUSTOM SECTION
  ===================================================== */

  const handleAddPredefinedSection = (
    sectionName
  ) => {
    const alreadyExists =
      resume.customSections.some(
        (section) =>
          section.title.toLowerCase() ===
          sectionName.toLowerCase()
      );

    if (alreadyExists) {
      const existingSection =
        resume.customSections.find(
          (section) =>
            section.title.toLowerCase() ===
            sectionName.toLowerCase()
        );

      setActiveSection(existingSection.id);
      setShowSectionMenu(false);
      return;
    }

    addCustomSection(sectionName);
  };

  const handleAddCustomSection = () => {
    const sectionName = window.prompt(
      'Enter your preferred section name:'
    );

    if (sectionName?.trim()) {
      addCustomSection(sectionName);
    }
  };

  /* =====================================================
     SKILLS
  ===================================================== */

  const addSkill = () => {
    setResume((current) => ({
      ...current,
      skills: [
        ...current.skills,
        'New Skill',
      ],
    }));

    setSaved(false);
  };

  const updateSkill = (index, value) => {
    setResume((current) => ({
      ...current,
      skills: current.skills.map(
        (skill, skillIndex) =>
          skillIndex === index
            ? value
            : skill
      ),
    }));

    setSaved(false);
  };

  const removeSkill = (index) => {
    setResume((current) => ({
      ...current,
      skills: current.skills.filter(
        (_, skillIndex) =>
          skillIndex !== index
      ),
    }));

    setSaved(false);
  };

  /* =====================================================
     SAVE / DOWNLOAD
  ===================================================== */

  const handleSave = () => {
    setSaveError('');
    try { onSaveResume(); } catch { setSaveError('Could not save this resume in your browser. Please check available browser storage.'); return; }
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const handleDownload = () => {
    window.print();
  };

  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <div
      className={`resume-builder-page resume-template-${selectedTemplate}`}
    >
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      {saveError && <p role="alert">{saveError}</p>}
      <nav className="builder-navbar">
        <div className="builder-navbar-left">
          <button
            className="builder-back-btn"
            onClick={onBackToDashboard}
            type="button"
          >
            <ArrowLeft size={17} />
            Dashboard
          </button>

          <div className="builder-divider" />

          <div className="builder-logo">
            <div className="builder-logo-icon">
              <Sparkles size={18} />
            </div>

            <span>ResuMate</span>

            <div className="builder-ai-badge">
              <Sparkles size={10} />
              AI
            </div>
          </div>
        </div>

        <div className="builder-navbar-center">
          <div className="builder-document-name">
            My Resume
            <span className="document-dot" />
          </div>

          <div className="builder-template-label">
            {templateNames[selectedTemplate]}
          </div>
        </div>

        <div className="builder-navbar-actions">
          <button
            className="builder-save-btn"
            onClick={handleSave}
            type="button"
          >
            <Save size={16} />
            {saved ? 'Saved' : 'Save'}
          </button>

          <button
            className="builder-download-btn"
            onClick={handleDownload}
            type="button"
          >
            <Download size={16} />
            Download
          </button>
          {accountMenu}
        </div>
      </nav>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="builder-main">
        {/* =====================================================
            EDITOR
        ===================================================== */}

        <section
          className={`builder-editor ${
            previewMode
              ? 'editor-hidden'
              : ''
          }`}
        >
          <div className="builder-editor-header">
            <div>
              <p className="builder-eyebrow">
                RESUME BUILDER
              </p>

              <h1>Build your resume</h1>

              <p>
                Add your information and see your
                resume update instantly.
              </p>
            </div>

            <button
              className="mobile-preview-btn"
              type="button"
              onClick={() =>
                setPreviewMode(true)
              }
            >
              <Eye size={16} />
              Preview
            </button>
          </div>

          {/* =====================================================
              TABS
          ===================================================== */}

          <div className="builder-section-tabs">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={
                  activeSection ===
                  section.id
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setActiveSection(
                    section.id
                  )
                }
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* =====================================================
              ADD NEW SECTION
          ===================================================== */}

          <button
            type="button"
            className="add-new-section-btn"
            onClick={() =>
              setShowSectionMenu(
                (current) => !current
              )
            }
          >
            <Plus size={15} />
            Add New Section
          </button>

          {showSectionMenu && (
            <div className="add-section-menu">
              <div className="add-section-menu-header">
                <strong>
                  Add a new section
                </strong>

                <span>
                  Choose what you want to add
                  to your resume.
                </span>
              </div>

              <div className="add-section-options">
                <button
                  type="button"
                  onClick={() =>
                    handleAddPredefinedSection(
                      'Certifications'
                    )
                  }
                >
                  Certifications
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAddPredefinedSection(
                      'Awards'
                    )
                  }
                >
                  Awards
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAddPredefinedSection(
                      'Volunteer Experience'
                    )
                  }
                >
                  Volunteer Experience
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAddPredefinedSection(
                      'Languages'
                    )
                  }
                >
                  Languages
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAddPredefinedSection(
                      'Publications'
                    )
                  }
                >
                  Publications
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAddPredefinedSection(
                      'Extracurricular Activities'
                    )
                  }
                >
                  Extracurricular Activities
                </button>

                <button
                  type="button"
                  onClick={
                    handleAddCustomSection
                  }
                >
                  + Custom Section
                </button>
              </div>
            </div>
          )}

          {/* =====================================================
              PERSONAL
          ===================================================== */}

          {activeSection ===
            'personal' && (
            <div className="editor-card">
              <div className="editor-card-heading">
                <div>
                  <h2>
                    Personal Information
                  </h2>

                  <p>
                    Add the contact
                    information that
                    employers should see.
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <FormField
                  label="Full Name"
                  value={
                    resume.personal.name
                  }
                  onChange={(value) =>
                    updateField(
                      'personal',
                      'name',
                      value
                    )
                  }
                  placeholder="Your Name"
                />

                <FormField
                  label="Professional Title"
                  value={
                    resume.personal.title
                  }
                  onChange={(value) =>
                    updateField(
                      'personal',
                      'title',
                      value
                    )
                  }
                  placeholder="Computer Engineering Student"
                />

                <FormField
                  label="Email"
                  value={
                    resume.personal.email
                  }
                  onChange={(value) =>
                    updateField(
                      'personal',
                      'email',
                      value
                    )
                  }
                  placeholder="you@example.com"
                  type="email"
                />

                <FormField
                  label="Phone"
                  value={
                    resume.personal.phone
                  }
                  onChange={(value) =>
                    updateField(
                      'personal',
                      'phone',
                      value
                    )
                  }
                  placeholder="+91 98765 43210"
                />

                <FormField
                  label="Location"
                  value={
                    resume.personal.location
                  }
                  onChange={(value) =>
                    updateField(
                      'personal',
                      'location',
                      value
                    )
                  }
                  placeholder="Mumbai, India"
                />

                <FormField
                  label="LinkedIn"
                  value={
                    resume.personal.linkedin
                  }
                  onChange={(value) =>
                    updateField(
                      'personal',
                      'linkedin',
                      value
                    )
                  }
                  placeholder="linkedin.com/in/yourname"
                />

                <FormField
                  label="GitHub"
                  value={
                    resume.personal.github
                  }
                  onChange={(value) =>
                    updateField(
                      'personal',
                      'github',
                      value
                    )
                  }
                  placeholder="github.com/yourname"
                />

                <FormField
                  label="Portfolio"
                  value={
                    resume.personal.website
                  }
                  onChange={(value) =>
                    updateField(
                      'personal',
                      'website',
                      value
                    )
                  }
                  placeholder="yourwebsite.com"
                />
              </div>
            </div>
          )}

          {/* =====================================================
              SUMMARY
          ===================================================== */}

          {activeSection ===
            'summary' && (
            <div className="editor-card">
              <div className="editor-card-heading">
                <div>
                  <h2>
                    Professional Summary
                  </h2>

                  <p>
                    Give recruiters a quick
                    overview of your background
                    and goals.
                  </p>
                </div>
              </div>

              <div className="form-field full-width">
                <label htmlFor="summary">
                  Summary
                </label>

                <textarea
                  id="summary"
                  rows="8"
                  value={resume.summary}
                  onChange={(event) => {
                    setResume(
                      (current) => ({
                        ...current,
                        summary:
                          event.target
                            .value,
                      })
                    );

                    setSaved(false);
                  }}
                  placeholder="Write a short professional summary..."
                />

                <span className="field-hint">
                  Keep it concise —
                  around 3–5 lines is
                  ideal.
                </span>
              </div>
            </div>
          )}

          {/* =====================================================
              EDUCATION
          ===================================================== */}

          {activeSection ===
            'education' && (
            <div className="editor-card">
              <div className="editor-card-heading">
                <div>
                  <h2>Education</h2>

                  <p>
                    Add your academic
                    qualifications.
                  </p>
                </div>

                <button
                  className="small-add-btn"
                  type="button"
                  onClick={() =>
                    addArrayItem(
                      'education',
                      emptyEducation
                    )
                  }
                >
                  <Plus size={15} />
                  Add Education
                </button>
              </div>

              <div className="repeatable-list">
                {resume.education.map(
                  (item, index) => (
                    <div
                      className="repeatable-card"
                      key={index}
                    >
                      <div className="repeatable-card-top">
                        <strong>
                          Education{' '}
                          {index + 1}
                        </strong>

                        <button
                          className="delete-item-btn"
                          type="button"
                          onClick={() =>
                            removeArrayItem(
                              'education',
                              index
                            )
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="form-grid">
                        <FormField
                          label="Degree"
                          value={
                            item.degree
                          }
                          onChange={(value) =>
                            updateArrayItem(
                              'education',
                              index,
                              'degree',
                              value
                            )
                          }
                          placeholder="B.E. Computer Engineering"
                        />

                        <FormField
                          label="Year"
                          value={
                            item.year
                          }
                          onChange={(value) =>
                            updateArrayItem(
                              'education',
                              index,
                              'year',
                              value
                            )
                          }
                          placeholder="2024 – 2028"
                        />

                        <FormField
                          label="Institution"
                          value={
                            item.institution
                          }
                          onChange={(value) =>
                            updateArrayItem(
                              'education',
                              index,
                              'institution',
                              value
                            )
                          }
                          placeholder="Your College Name"
                        />

                        <FormField
                          label="Details"
                          value={
                            item.details
                          }
                          onChange={(value) =>
                            updateArrayItem(
                              'education',
                              index,
                              'details',
                              value
                            )
                          }
                          placeholder="CGPA: 9.50"
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              {resume.education.length ===
                0 && (
                <EmptyEditorState
                  title="No education added"
                  description="Add your degree, college and academic details."
                  buttonText="Add Education"
                  onClick={() =>
                    addArrayItem(
                      'education',
                      emptyEducation
                    )
                  }
                />
              )}
            </div>
          )}

          {/* =====================================================
              EXPERIENCE
          ===================================================== */}

          {activeSection ===
            'experience' && (
            <div className="editor-card">
              <div className="editor-card-heading">
                <div>
                  <h2>Experience</h2>

                  <p>
                    Add internships, jobs
                    and relevant work
                    experience.
                  </p>
                </div>

                <button
                  className="small-add-btn"
                  type="button"
                  onClick={() =>
                    addArrayItem(
                      'experience',
                      emptyExperience
                    )
                  }
                >
                  <Plus size={15} />
                  Add Experience
                </button>
              </div>

              <div className="repeatable-list">
                {resume.experience.map(
                  (item, index) => (
                    <div
                      className="repeatable-card"
                      key={index}
                    >
                      <div className="repeatable-card-top">
                        <strong>
                          Experience{' '}
                          {index + 1}
                        </strong>

                        <button
                          className="delete-item-btn"
                          type="button"
                          onClick={() =>
                            removeArrayItem(
                              'experience',
                              index
                            )
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="form-grid">
                        <FormField
                          label="Role"
                          value={item.role}
                          onChange={(value) =>
                            updateArrayItem(
                              'experience',
                              index,
                              'role',
                              value
                            )
                          }
                          placeholder="Software Development Intern"
                        />

                        <FormField
                          label="Company"
                          value={
                            item.company
                          }
                          onChange={(value) =>
                            updateArrayItem(
                              'experience',
                              index,
                              'company',
                              value
                            )
                          }
                          placeholder="Company Name"
                        />

                        <FormField
                          label="Duration"
                          value={
                            item.duration
                          }
                          onChange={(value) =>
                            updateArrayItem(
                              'experience',
                              index,
                              'duration',
                              value
                            )
                          }
                          placeholder="Jun 2026 – Jul 2026"
                        />

                        <div className="form-field full-width">
                          <label>
                            Description
                          </label>

                          <textarea
                            rows="5"
                            value={
                              item.description
                            }
                            onChange={(
                              event
                            ) =>
                              updateArrayItem(
                                'experience',
                                index,
                                'description',
                                event.target
                                  .value
                              )
                            }
                            placeholder="Describe your responsibilities and achievements..."
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {resume.experience.length ===
                0 && (
                <EmptyEditorState
                  title="No experience added"
                  description="Add your internships, jobs or work experience."
                  buttonText="Add Experience"
                  onClick={() =>
                    addArrayItem(
                      'experience',
                      emptyExperience
                    )
                  }
                />
              )}
            </div>
          )}

          {/* =====================================================
              PROJECTS
          ===================================================== */}

          {activeSection ===
            'projects' && (
            <div className="editor-card">
              <div className="editor-card-heading">
                <div>
                  <h2>Projects</h2>

                  <p>
                    Highlight projects that
                    demonstrate your skills.
                  </p>
                </div>

                <button
                  className="small-add-btn"
                  type="button"
                  onClick={() =>
                    addArrayItem(
                      'projects',
                      emptyProject
                    )
                  }
                >
                  <Plus size={15} />
                  Add Project
                </button>
              </div>

              <div className="repeatable-list">
                {resume.projects.map(
                  (item, index) => (
                    <div
                      className="repeatable-card"
                      key={index}
                    >
                      <div className="repeatable-card-top">
                        <strong>
                          Project{' '}
                          {index + 1}
                        </strong>

                        <button
                          className="delete-item-btn"
                          type="button"
                          onClick={() =>
                            removeArrayItem(
                              'projects',
                              index
                            )
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="form-grid">
                        <FormField
                          label="Project Name"
                          value={item.name}
                          onChange={(value) =>
                            updateArrayItem(
                              'projects',
                              index,
                              'name',
                              value
                            )
                          }
                          placeholder="AI Resume Builder"
                        />

                        <FormField
                          label="Technologies"
                          value={
                            item.technologies
                          }
                          onChange={(value) =>
                            updateArrayItem(
                              'projects',
                              index,
                              'technologies',
                              value
                            )
                          }
                          placeholder="React • JavaScript • AI"
                        />

                        <FormField
                          label="Project Link"
                          value={item.link}
                          onChange={(value) =>
                            updateArrayItem(
                              'projects',
                              index,
                              'link',
                              value
                            )
                          }
                          placeholder="github.com/yourproject"
                        />

                        <div className="form-field full-width">
                          <label>
                            Description
                          </label>

                          <textarea
                            rows="5"
                            value={
                              item.description
                            }
                            onChange={(
                              event
                            ) =>
                              updateArrayItem(
                                'projects',
                                index,
                                'description',
                                event.target
                                  .value
                              )
                            }
                            placeholder="Describe what you built..."
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {resume.projects.length ===
                0 && (
                <EmptyEditorState
                  title="No projects added"
                  description="Add projects that show your technical abilities."
                  buttonText="Add Project"
                  onClick={() =>
                    addArrayItem(
                      'projects',
                      emptyProject
                    )
                  }
                />
              )}
            </div>
          )}

          {/* =====================================================
              SKILLS
          ===================================================== */}

          {activeSection ===
            'skills' && (
            <div className="editor-card">
              <div className="editor-card-heading">
                <div>
                  <h2>Skills</h2>

                  <p>
                    Add technical and
                    professional skills.
                  </p>
                </div>

                <button
                  className="small-add-btn"
                  type="button"
                  onClick={addSkill}
                >
                  <Plus size={15} />
                  Add Skill
                </button>
              </div>

              <div className="skills-editor-list">
                {resume.skills.map(
                  (skill, index) => (
                    <div
                      className="skill-editor-row"
                      key={index}
                    >
                      <input
                        value={skill}
                        onChange={(event) =>
                          updateSkill(
                            index,
                            event.target.value
                          )
                        }
                        placeholder="Skill"
                      />

                      <button
                        className="delete-item-btn"
                        type="button"
                        onClick={() =>
                          removeSkill(index)
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* =====================================================
              ACHIEVEMENTS
          ===================================================== */}

          {activeSection ===
            'achievements' && (
            <div className="editor-card">
              <div className="editor-card-heading">
                <div>
                  <h2>Achievements</h2>

                  <p>
                    Add awards, competitions
                    and important
                    accomplishments.
                  </p>
                </div>
              </div>

              <div className="repeatable-list">
                <div className="achievement-certificate-upload">
                  <p>Upload certificates to fill your name, achievements, skills, and other relevant resume information with AI.</p>
                  <input ref={certificateInput} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp" hidden onChange={handleCertificateUpload} />
                  <div className="achievement-certificate-actions">
                    <button type="button" className="btn btn-primary" disabled={certificateBusy} onClick={() => certificateInput.current?.click()}><Upload size={16} />{certificateBusy ? 'Reading certificates…' : 'Add Certificates'}</button>
                    <button type="button" className="btn btn-secondary" disabled={certificateBusy} onClick={onOpenVault}><Award size={16} />Choose from Vault</button>
                  </div>
                  <small>Up to 5 documents, 10 MB each. PDF, PNG, JPG, JPEG, or WebP.</small>
                  {certificateBusy && <p role="status">Uploading and reading your certificates…</p>}
                  {certificateMessage && <p role="status">{certificateMessage}</p>}
                  {certificateError && <p role="alert">{certificateError}</p>}
                </div>
                {resume.achievements.map(
                  (achievement, index) => (
                    <div
                      className="skill-editor-row"
                      key={index}
                    >
                      <input
                        value={achievement}
                        onChange={(event) => {
                          setResume(
                            (current) => ({
                              ...current,
                              achievements:
                                current.achievements.map(
                                  (
                                    item,
                                    itemIndex
                                  ) =>
                                    itemIndex ===
                                    index
                                      ? event
                                          .target
                                          .value
                                      : item
                                ),
                            })
                          );

                          setSaved(false);
                        }}
                      />

                      <button
                        className="delete-item-btn"
                        type="button"
                        onClick={() => {
                          setResume(
                            (current) => ({
                              ...current,
                              achievements:
                                current.achievements.filter(
                                  (
                                    _,
                                    itemIndex
                                  ) =>
                                    itemIndex !==
                                    index
                                ),
                            })
                          );

                          setSaved(false);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )
                )}
              </div>

              <button
                className="small-add-btn"
                type="button"
                onClick={() => {
                  setResume(
                    (current) => ({
                      ...current,
                      achievements: [
                        ...current.achievements,
                        'New achievement',
                      ],
                    })
                  );

                  setSaved(false);
                }}
              >
                <Plus size={15} />
                Add Achievement
              </button>
            </div>
          )}

          {/* =====================================================
              CUSTOM SECTIONS EDITOR
          ===================================================== */}

          {resume.customSections.map(
            (section) =>
              activeSection ===
                section.id && (
                <div
                  className="editor-card"
                  key={section.id}
                >
                  <div className="editor-card-heading">
                    <div>
                      <h2>
                        {section.title}
                      </h2>

                      <p>
                        Add your own content
                        to this resume
                        section.
                      </p>
                    </div>

                    <button
                      className="delete-item-btn"
                      type="button"
                      title="Remove section"
                      onClick={() =>
                        removeCustomSection(
                          section.id
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="form-field full-width">
                    <label
                      htmlFor={`custom-${section.id}`}
                    >
                      {section.title}
                    </label>

                    <textarea
                      id={`custom-${section.id}`}
                      rows="8"
                      value={
                        section.content
                      }
                      onChange={(event) =>
                        updateCustomSection(
                          section.id,
                          'content',
                          event.target.value
                        )
                      }
                      placeholder={`Add details for ${section.title}...`}
                    />

                    <span className="field-hint">
                      This content will
                      appear automatically
                      in your resume preview.
                    </span>
                  </div>
                </div>
              )
          )}
        </section>

        {/* =====================================================
            PREVIEW
        ===================================================== */}

        <section
          className={`builder-preview-panel ${
            previewMode
              ? 'preview-mobile-active'
              : ''
          }`}
        >
          <div className="preview-toolbar">
            <div>
              <span className="preview-label">
                LIVE PREVIEW
              </span>

              <span className="preview-template-name">
                {templateNames[
                  selectedTemplate
                ]}
              </span>
            </div>

            <button
              className="close-preview-btn"
              type="button"
              onClick={() =>
                setPreviewMode(false)
              }
            >
              <Edit3 size={15} />
              Edit
            </button>
          </div>

          <div className="resume-preview-scroll">
            <ResumePreview
              resume={resume}
              selectedTemplate={
                selectedTemplate
              }
            />
          </div>
        </section>
      </main>
    </div>
  );
}

/* =====================================================
   FORM FIELD
===================================================== */

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}) {
  return (
    <div className="form-field">
      <label>{label}</label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
      />
    </div>
  );
}

/* =====================================================
   EMPTY STATE
===================================================== */

function EmptyEditorState({
  title,
  description,
  buttonText,
  onClick,
}) {
  return (
    <div className="empty-editor-state">
      <div className="empty-editor-icon">
        <Sparkles size={20} />
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      <button
        type="button"
        onClick={onClick}
      >
        <Plus size={15} />
        {buttonText}
      </button>
    </div>
  );
}

/* =====================================================
   RESUME PREVIEW
===================================================== */

export function ResumePreview({
  resume,
  selectedTemplate,
}) {
  switch (selectedTemplate) {
    case 'professional':
      return (
        <ProfessionalResume
          resume={resume}
        />
      );

    case 'minimal':
      return (
        <MinimalResume
          resume={resume}
        />
      );

    case 'creative':
      return (
        <CreativeResume
          resume={resume}
        />
      );

    case 'executive':
      return (
        <ExecutiveResume
          resume={resume}
        />
      );

    case 'tech':
      return (
        <TechResume
          resume={resume}
        />
      );

    case 'student':
      return <StudentResume resume={resume} />;

    case 'academic':
      return <AcademicResume resume={resume} />;

    case 'developer':
      return <DeveloperResume resume={resume} />;

    case 'corporate':
      return <CorporateResume resume={resume} />;

    case 'classic':
      return <ClassicResume resume={resume} />;

    case 'elegant':
      return <ElegantResume resume={resume} />;

    case 'portfolio':
      return <PortfolioResume resume={resume} />;

    case 'ats-simple':
      return <ATSSimpleResume resume={resume} />;

    default:
      return (
        <ModernResume
          resume={resume}
        />
      );
  }
}

/* =====================================================
   CONTACT
===================================================== */

function ContactLine({ resume }) {
  return (
    <div className="resume-contact-line">
      {resume.personal.email && (
        <span>
          <Mail size={11} />
          <span>
            {resume.personal.email}
          </span>
        </span>
      )}

      {resume.personal.phone && (
        <span>
          <Phone size={11} />
          <span>
            {resume.personal.phone}
          </span>
        </span>
      )}

      {resume.personal.location && (
        <span>
          <MapPin size={11} />
          <span>
            {resume.personal.location}
          </span>
        </span>
      )}
    </div>
  );
}

function SocialLine({ resume }) {
  return (
    <div className="resume-social-line">
      {resume.personal.linkedin && (
        <span>
          <span className="linkedin-icon">
            in
          </span>

          <span>
            {resume.personal.linkedin}
          </span>
        </span>
      )}

      {resume.personal.github && (
        <span>
          <span className="github-icon">
            GH
          </span>

          <span>
            {resume.personal.github}
          </span>
        </span>
      )}

      {resume.personal.website && (
        <span>
          <Globe size={11} />

          <span>
            {resume.personal.website}
          </span>
        </span>
      )}
    </div>
  );
}

/* =====================================================
   SECTION
===================================================== */

function ResumeSection({
  title,
  children,
  className = '',
}) {
  return (
    <section
      className={`resume-section ${className}`}
    >
      <h2>{title}</h2>

      <div className="resume-section-content">
        {children}
      </div>
    </section>
  );
}

/* =====================================================
   CUSTOM RESUME SECTIONS
===================================================== */

function CustomResumeSections({
  sections,
}) {
  if (
    !sections ||
    sections.length === 0
  ) {
    return null;
  }

  return (
    <>
      {sections.map((section) => {
        if (!section.content?.trim()) {
          return null;
        }

        return (
          <ResumeSection
            key={section.id}
            title={section.title}
          >
            <p className="resume-summary">
              {section.content}
            </p>
          </ResumeSection>
        );
      })}
    </>
  );
}

/* =====================================================
   EDUCATION
===================================================== */

function EducationItems({
  education,
}) {
  return (
    <div className="resume-items">
      {education.map((item, index) => (
        <article
          className="resume-item"
          key={index}
        >
          <div className="resume-item-main">
            <div className="resume-item-heading">
              <h3>
                {item.degree}
              </h3>

              {item.year && (
                <span className="resume-item-date">
                  {item.year}
                </span>
              )}
            </div>

            <div className="resume-item-company">
              {item.institution}
            </div>

            {item.details && (
              <div className="resume-item-details">
                {item.details}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

/* =====================================================
   EXPERIENCE
===================================================== */

function ExperienceItems({
  experience,
}) {
  return (
    <div className="resume-items">
      {experience.map((item, index) => (
        <article
          className="resume-item"
          key={index}
        >
          <div className="resume-item-main">
            <div className="resume-item-heading">
              <h3>
                {item.role}
              </h3>

              {item.duration && (
                <span className="resume-item-date">
                  {item.duration}
                </span>
              )}
            </div>

            <div className="resume-item-company">
              {item.company}
            </div>

            {item.description && (
              <p className="resume-item-description">
                {item.description}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

/* =====================================================
   PROJECTS
===================================================== */

function ProjectItems({
  projects,
}) {
  return (
    <div className="resume-items">
      {projects.map((item, index) => (
        <article
          className="resume-project"
          key={index}
        >
          <div className="resume-project-heading">
            <h3>{item.name}</h3>

            {item.link && (
              <span className="resume-project-link">
                {item.link}
              </span>
            )}
          </div>

          {item.technologies && (
            <div className="resume-project-tech">
              {item.technologies}
            </div>
          )}

          {item.description && (
            <p className="resume-project-description">
              {item.description}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

/* =====================================================
   MODERN
===================================================== */

function ModernResume({
  resume,
}) {
  return (
    <div className="resume-paper modern-paper">
      <header className="modern-header">
        <div>
          <h1>
            {resume.personal.name}
          </h1>

          <p>
            {resume.personal.title}
          </p>

          <ContactLine
            resume={resume}
          />

          <SocialLine
            resume={resume}
          />
        </div>

        <div className="modern-header-right">
          <Sparkles size={24} />
        </div>
      </header>

      <div className="modern-accent-line" />

      {resume.summary && (
        <ResumeSection title="Profile">
          <p className="resume-summary">
            {resume.summary}
          </p>
        </ResumeSection>
      )}

      {resume.experience.length >
        0 && (
        <ResumeSection title="Experience">
          <ExperienceItems
            experience={
              resume.experience
            }
          />
        </ResumeSection>
      )}

      {resume.projects.length > 0 && (
        <ResumeSection title="Projects">
          <ProjectItems
            projects={
              resume.projects
            }
          />
        </ResumeSection>
      )}

      {resume.education.length >
        0 && (
        <ResumeSection title="Education">
          <EducationItems
            education={
              resume.education
            }
          />
        </ResumeSection>
      )}

      {resume.skills.length > 0 && (
        <ResumeSection title="Skills">
          <div className="modern-skills">
            {resume.skills.map(
              (skill, index) => (
                <span key={index}>
                  {skill}
                </span>
              )
            )}
          </div>
        </ResumeSection>
      )}

      {resume.achievements.length >
        0 && (
        <ResumeSection title="Achievements">
          <ul className="resume-achievements">
            {resume.achievements.map(
              (
                achievement,
                index
              ) => (
                <li key={index}>
                  {achievement}
                </li>
              )
            )}
          </ul>
        </ResumeSection>
      )}

      <CustomResumeSections
        sections={
          resume.customSections
        }
      />
    </div>
  );
}

/* =====================================================
   PROFESSIONAL
===================================================== */

function ProfessionalResume({
  resume,
}) {
  return (
    <div className="resume-paper professional-paper">
      <header className="professional-header">
        <h1>
          {resume.personal.name}
        </h1>

        <p>
          {resume.personal.title}
        </p>

        <ContactLine
          resume={resume}
        />

        <SocialLine
          resume={resume}
        />
      </header>

      {resume.summary && (
        <ResumeSection title="Professional Summary">
          <p className="resume-summary">
            {resume.summary}
          </p>
        </ResumeSection>
      )}

      {resume.experience.length >
        0 && (
        <ResumeSection title="Professional Experience">
          <ExperienceItems
            experience={
              resume.experience
            }
          />
        </ResumeSection>
      )}

      {resume.education.length >
        0 && (
        <ResumeSection title="Education">
          <EducationItems
            education={
              resume.education
            }
          />
        </ResumeSection>
      )}

      {resume.projects.length > 0 && (
        <ResumeSection title="Selected Projects">
          <ProjectItems
            projects={
              resume.projects
            }
          />
        </ResumeSection>
      )}

      {resume.skills.length > 0 && (
        <ResumeSection title="Core Skills">
          <div className="professional-skills">
            {resume.skills.map(
              (skill, index) => (
                <span key={index}>
                  {skill}
                </span>
              )
            )}
          </div>
        </ResumeSection>
      )}

      {resume.achievements.length >
        0 && (
        <ResumeSection title="Achievements">
          <ul className="resume-achievements">
            {resume.achievements.map(
              (
                achievement,
                index
              ) => (
                <li key={index}>
                  {achievement}
                </li>
              )
            )}
          </ul>
        </ResumeSection>
      )}

      <CustomResumeSections
        sections={
          resume.customSections
        }
      />
    </div>
  );
}

/* =====================================================
   MINIMAL
===================================================== */

function MinimalResume({
  resume,
}) {
  return (
    <div className="resume-paper minimal-paper">
      <header className="minimal-header">
        <h1>
          {resume.personal.name}
        </h1>

        <p>
          {resume.personal.title}
        </p>

        <div className="minimal-contact">
          <ContactLine
            resume={resume}
          />

          <SocialLine
            resume={resume}
          />
        </div>
      </header>

      {resume.summary && (
        <ResumeSection title="About">
          <p className="resume-summary">
            {resume.summary}
          </p>
        </ResumeSection>
      )}

      {resume.experience.length >
        0 && (
        <ResumeSection title="Experience">
          <ExperienceItems
            experience={
              resume.experience
            }
          />
        </ResumeSection>
      )}

      {resume.projects.length > 0 && (
        <ResumeSection title="Projects">
          <ProjectItems
            projects={
              resume.projects
            }
          />
        </ResumeSection>
      )}

      <div className="minimal-two-column">
        <div>
          {resume.education.length >
            0 && (
            <ResumeSection title="Education">
              <EducationItems
                education={
                  resume.education
                }
              />
            </ResumeSection>
          )}
        </div>

        <div>
          {resume.skills.length >
            0 && (
            <ResumeSection title="Skills">
              <div className="minimal-skills">
                {resume.skills.map(
                  (skill, index) => (
                    <span key={index}>
                      {skill}
                    </span>
                  )
                )}
              </div>
            </ResumeSection>
          )}

          {resume.achievements.length >
            0 && (
            <ResumeSection title="Achievements">
              <ul className="resume-achievements">
                {resume.achievements.map(
                  (
                    achievement,
                    index
                  ) => (
                    <li key={index}>
                      {achievement}
                    </li>
                  )
                )}
              </ul>
            </ResumeSection>
          )}
        </div>
      </div>

      <CustomResumeSections
        sections={
          resume.customSections
        }
      />
    </div>
  );
}

/* =====================================================
   CREATIVE
===================================================== */

function CreativeResume({
  resume,
}) {
  return (
    <div className="resume-paper creative-paper">
      <aside className="creative-sidebar">
        <div className="creative-avatar">
          {resume.personal.name
            ? resume.personal.name.charAt(
                0
              )
            : 'R'}
        </div>

        <div className="creative-profile">
          <h1>
            {resume.personal.name}
          </h1>

          <p>
            {resume.personal.title}
          </p>
        </div>

        <div className="creative-side-section">
          <h2>Contact</h2>

          <div className="creative-contact">
            {resume.personal.email && (
              <span>
                <Mail size={11} />
                {resume.personal.email}
              </span>
            )}

            {resume.personal.phone && (
              <span>
                <Phone size={11} />
                {resume.personal.phone}
              </span>
            )}

            {resume.personal.location && (
              <span>
                <MapPin size={11} />
                {resume.personal.location}
              </span>
            )}
          </div>
        </div>

        <div className="creative-side-section">
          <h2>Skills</h2>

          <div className="creative-skills">
            {resume.skills.map(
              (skill, index) => (
                <div key={index}>
                  <span>
                    {skill}
                  </span>

                  <div className="skill-bar">
                    <span />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {resume.personal.linkedin && (
          <div className="creative-side-section">
            <h2>LinkedIn</h2>

            <p className="creative-side-text">
              {resume.personal.linkedin}
            </p>
          </div>
        )}

        {resume.personal.github && (
          <div className="creative-side-section">
            <h2>GitHub</h2>

            <p className="creative-side-text">
              {resume.personal.github}
            </p>
          </div>
        )}
      </aside>

      <div className="creative-content">
        {resume.summary && (
          <ResumeSection title="Profile">
            <p className="resume-summary">
              {resume.summary}
            </p>
          </ResumeSection>
        )}

        {resume.experience.length >
          0 && (
          <ResumeSection title="Experience">
            <ExperienceItems
              experience={
                resume.experience
              }
            />
          </ResumeSection>
        )}

        {resume.projects.length >
          0 && (
          <ResumeSection title="Projects">
            <ProjectItems
              projects={
                resume.projects
              }
            />
          </ResumeSection>
        )}

        {resume.education.length >
          0 && (
          <ResumeSection title="Education">
            <EducationItems
              education={
                resume.education
              }
            />
          </ResumeSection>
        )}

        {resume.achievements.length >
          0 && (
          <ResumeSection title="Achievements">
            <ul className="resume-achievements">
              {resume.achievements.map(
                (
                  achievement,
                  index
                ) => (
                  <li key={index}>
                    {achievement}
                  </li>
                )
              )}
            </ul>
          </ResumeSection>
        )}

        <CustomResumeSections
          sections={
            resume.customSections
          }
        />
      </div>
    </div>
  );
}

/* =====================================================
   EXECUTIVE
===================================================== */

function ExecutiveResume({
  resume,
}) {
  return (
    <div className="resume-paper executive-paper">
      <header className="executive-header">
        <div>
          <h1>
            {resume.personal.name}
          </h1>

          <p>
            {resume.personal.title}
          </p>
        </div>

        <div className="executive-contact">
          <ContactLine
            resume={resume}
          />

          <SocialLine
            resume={resume}
          />
        </div>
      </header>

      <div className="executive-body">
        <aside className="executive-sidebar">
          {resume.skills.length >
            0 && (
            <div className="executive-side-section">
              <h2>Expertise</h2>

              <div className="executive-skills">
                {resume.skills.map(
                  (skill, index) => (
                    <span key={index}>
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {resume.education.length >
            0 && (
            <div className="executive-side-section">
              <h2>Education</h2>

              <div className="executive-education">
                {resume.education.map(
                  (item, index) => (
                    <div key={index}>
                      <strong>
                        {item.degree}
                      </strong>

                      <span>
                        {item.institution}
                      </span>

                      <small>
                        {item.year}
                      </small>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </aside>

        <div className="executive-content">
          {resume.summary && (
            <ResumeSection title="Executive Profile">
              <p className="resume-summary">
                {resume.summary}
              </p>
            </ResumeSection>
          )}

          {resume.experience.length >
            0 && (
            <ResumeSection title="Career Experience">
              <ExperienceItems
                experience={
                  resume.experience
                }
              />
            </ResumeSection>
          )}

          {resume.projects.length >
            0 && (
            <ResumeSection title="Selected Projects">
              <ProjectItems
                projects={
                  resume.projects
                }
              />
            </ResumeSection>
          )}

          {resume.achievements.length >
            0 && (
            <ResumeSection title="Achievements">
              <ul className="resume-achievements">
                {resume.achievements.map(
                  (
                    achievement,
                    index
                  ) => (
                    <li key={index}>
                      {achievement}
                    </li>
                  )
                )}
              </ul>
            </ResumeSection>
          )}

          <CustomResumeSections
            sections={
              resume.customSections
            }
          />
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   TECH
===================================================== */

function TechResume({
  resume,
}) {
  return (
    <div className="resume-paper tech-paper">
      <header className="tech-header">
        <div className="tech-name-block">
          <span className="tech-prompt">
            &gt;_
          </span>

          <div>
            <h1>
              {resume.personal.name}
            </h1>

            <p>
              {resume.personal.title}
            </p>
          </div>
        </div>

        <div className="tech-contact">
          <ContactLine
            resume={resume}
          />

          <SocialLine
            resume={resume}
          />
        </div>
      </header>

      <div className="tech-grid">
        <div className="tech-main">
          {resume.summary && (
            <ResumeSection title="about_me()">
              <p className="resume-summary">
                {resume.summary}
              </p>
            </ResumeSection>
          )}

          {resume.experience.length >
            0 && (
            <ResumeSection title="experience[]">
              <ExperienceItems
                experience={
                  resume.experience
                }
              />
            </ResumeSection>
          )}

          {resume.projects.length >
            0 && (
            <ResumeSection title="projects[]">
              <ProjectItems
                projects={
                  resume.projects
                }
              />
            </ResumeSection>
          )}

          {resume.achievements.length >
            0 && (
            <ResumeSection title="achievements[]">
              <ul className="resume-achievements">
                {resume.achievements.map(
                  (
                    achievement,
                    index
                  ) => (
                    <li key={index}>
                      {achievement}
                    </li>
                  )
                )}
              </ul>
            </ResumeSection>
          )}

          <CustomResumeSections
            sections={
              resume.customSections
            }
          />
        </div>

        <aside className="tech-sidebar">
          {resume.skills.length >
            0 && (
            <div className="tech-side-section">
              <h2>skills</h2>

              <div className="tech-skills">
                {resume.skills.map(
                  (skill, index) => (
                    <span key={index}>
                      <b>
                        {index + 1}.
                      </b>
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {resume.education.length >
            0 && (
            <div className="tech-side-section">
              <h2>education</h2>

              {resume.education.map(
                (item, index) => (
                  <div
                    className="tech-education"
                    key={index}
                  >
                    <strong>
                      {item.degree}
                    </strong>

                    <span>
                      {item.institution}
                    </span>

                    <small>
                      {item.year}
                    </small>
                  </div>
                )
              )}
            </div>
          )}

          <div className="tech-code-box">
            <span>const</span>{' '}
            career = {'{'}
            <br />
            &nbsp;&nbsp;growth: true,
            <br />
            &nbsp;&nbsp;learning: true
            <br />
            {'}'};
          </div>
        </aside>
      </div>
    </div>
  );
}

/* =====================================================
   NEW TEMPLATE HELPERS
   These eight templates use inline styles so they work
   immediately without changing the existing ResumeBuilder.css.
===================================================== */

const newTemplateBase = {
  width: '100%',
  minHeight: '100%',
  boxSizing: 'border-box',
  background: '#ffffff',
  color: '#1f2937',
  fontFamily: 'Arial, Helvetica, sans-serif',
  lineHeight: 1.45,
};

function NewTemplateSection({
  title,
  children,
  color = '#4f46e5',
  border = true,
}) {
  return (
    <section
      style={{
        marginBottom: 18,
        paddingBottom: border ? 12 : 0,
        borderBottom: border ? `1px solid ${color}22` : 'none',
      }}
    >
      <h2
        style={{
          margin: '0 0 9px',
          fontSize: 12,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color,
          fontWeight: 800,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function NewTemplateContact({ resume, color = '#64748b' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '5px 12px',
        fontSize: 8.5,
        color,
      }}
    >
      {resume.personal.email && <span>{resume.personal.email}</span>}
      {resume.personal.phone && <span>{resume.personal.phone}</span>}
      {resume.personal.location && <span>{resume.personal.location}</span>}
      {resume.personal.linkedin && <span>{resume.personal.linkedin}</span>}
      {resume.personal.github && <span>{resume.personal.github}</span>}
      {resume.personal.website && <span>{resume.personal.website}</span>}
    </div>
  );
}

function NewTemplateSummary({ resume, color }) {
  return resume.summary ? (
    <NewTemplateSection title="Profile" color={color}>
      <p style={{ margin: 0, fontSize: 9.5, color: '#475569' }}>
        {resume.summary}
      </p>
    </NewTemplateSection>
  ) : null;
}

function NewTemplateExperience({ resume, color, title = 'Experience' }) {
  return resume.experience.length > 0 ? (
    <NewTemplateSection title={title} color={color}>
      <div style={{ display: 'grid', gap: 10 }}>
        {resume.experience.map((item, index) => (
          <div key={index}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <strong style={{ fontSize: 10.5 }}>{item.role}</strong>
              {item.duration && (
                <span style={{ fontSize: 8, color: '#64748b' }}>
                  {item.duration}
                </span>
              )}
            </div>
            {item.company && (
              <div style={{ fontSize: 8.5, color, marginTop: 2 }}>
                {item.company}
              </div>
            )}
            {item.description && (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 8.8,
                  color: '#475569',
                }}
              >
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </NewTemplateSection>
  ) : null;
}

function NewTemplateEducation({ resume, color, title = 'Education' }) {
  return resume.education.length > 0 ? (
    <NewTemplateSection title={title} color={color}>
      <div style={{ display: 'grid', gap: 8 }}>
        {resume.education.map((item, index) => (
          <div key={index}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <strong style={{ fontSize: 9.8 }}>{item.degree}</strong>
              {item.year && (
                <span style={{ fontSize: 8, color: '#64748b' }}>
                  {item.year}
                </span>
              )}
            </div>
            <div style={{ fontSize: 8.5, color: '#475569', marginTop: 2 }}>
              {item.institution}
            </div>
            {item.details && (
              <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
                {item.details}
              </div>
            )}
          </div>
        ))}
      </div>
    </NewTemplateSection>
  ) : null;
}

function NewTemplateProjects({ resume, color, title = 'Projects' }) {
  return resume.projects.length > 0 ? (
    <NewTemplateSection title={title} color={color}>
      <div style={{ display: 'grid', gap: 9 }}>
        {resume.projects.map((item, index) => (
          <div
            key={index}
            style={{
              padding: '7px 9px',
              background: `${color}08`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 5,
            }}
          >
            <strong style={{ fontSize: 9.8 }}>{item.name}</strong>
            {item.technologies && (
              <div style={{ fontSize: 7.8, color, marginTop: 2 }}>
                {item.technologies}
              </div>
            )}
            {item.description && (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 8.5,
                  color: '#475569',
                }}
              >
                {item.description}
              </p>
            )}
            {item.link && (
              <div style={{ fontSize: 7.5, color: '#64748b', marginTop: 2 }}>
                {item.link}
              </div>
            )}
          </div>
        ))}
      </div>
    </NewTemplateSection>
  ) : null;
}

function NewTemplateSkills({ resume, color, title = 'Skills' }) {
  return resume.skills.length > 0 ? (
    <NewTemplateSection title={title} color={color}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {resume.skills.map((skill, index) => (
          <span
            key={index}
            style={{
              padding: '4px 7px',
              borderRadius: 999,
              background: `${color}12`,
              color,
              fontSize: 7.8,
              fontWeight: 700,
            }}
          >
            {skill}
          </span>
        ))}
      </div>
    </NewTemplateSection>
  ) : null;
}

function NewTemplateAchievements({ resume, color }) {
  return resume.achievements.length > 0 ? (
    <NewTemplateSection title="Achievements" color={color}>
      <ul
        style={{
          margin: 0,
          paddingLeft: 16,
          color: '#475569',
          fontSize: 8.8,
        }}
      >
        {resume.achievements.map((item, index) => (
          <li key={index} style={{ marginBottom: 4 }}>
            {item}
          </li>
        ))}
      </ul>
    </NewTemplateSection>
  ) : null;
}

function NewTemplateCustomSections({ resume }) {
  return (
    <CustomResumeSections sections={resume.customSections} />
  );
}

/* =====================================================
   STUDENT
===================================================== */

function StudentResume({ resume }) {
  const color = '#6d4aff';

  return (
    <div style={{ ...newTemplateBase, background: '#f8f7ff', padding: 0 }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #5b3fd8, #2f80ed)',
          color: '#fff',
          padding: '24px 26px 20px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 26 }}>{resume.personal.name}</h1>
        <p style={{ margin: '4px 0 10px', fontSize: 11, opacity: 0.9 }}>
          {resume.personal.title}
        </p>
        <NewTemplateContact resume={resume} color="#e9e5ff" />
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr .65fr',
          gap: 20,
          padding: 24,
        }}
      >
        <div>
          <NewTemplateSummary resume={resume} color={color} />
          <NewTemplateProjects resume={resume} color={color} title="Student Projects" />
          <NewTemplateEducation resume={resume} color={color} />
          <NewTemplateExperience resume={resume} color={color} title="Internships & Experience" />
        </div>
        <aside>
          <NewTemplateSkills resume={resume} color={color} />
          <NewTemplateAchievements resume={resume} color={color} />
        </aside>
      </div>
      <div style={{ padding: '0 24px 24px' }}>
        <NewTemplateCustomSections resume={resume} color={color} />
      </div>
    </div>
  );
}

/* =====================================================
   ACADEMIC
===================================================== */

function AcademicResume({ resume }) {
  const color = '#173b67';

  return (
    <div
      style={{
        ...newTemplateBase,
        padding: '28px 32px',
        fontFamily: 'Georgia, Times New Roman, serif',
      }}
    >
      <header style={{ textAlign: 'center', paddingBottom: 18, borderBottom: '3px double #173b67' }}>
        <h1 style={{ margin: 0, fontSize: 25, color }}>{resume.personal.name}</h1>
        <p style={{ margin: '5px 0 9px', fontSize: 11, color: '#475569' }}>{resume.personal.title}</p>
        <NewTemplateContact resume={resume} color="#475569" />
      </header>
      <main style={{ paddingTop: 20 }}>
        <NewTemplateSummary resume={resume} color={color} />
        <NewTemplateEducation resume={resume} color={color} title="Academic Background" />
        <NewTemplateExperience resume={resume} color={color} title="Research / Experience" />
        <NewTemplateProjects resume={resume} color={color} title="Research & Projects" />
        <NewTemplateAchievements resume={resume} color={color} />
        <NewTemplateSkills resume={resume} color={color} title="Research Skills" />
        <NewTemplateCustomSections resume={resume} color={color} />
      </main>
    </div>
  );
}

/* =====================================================
   DEVELOPER
===================================================== */

function DeveloperResume({ resume }) {
  const color = '#16a34a';

  return (
    <div style={{ ...newTemplateBase, background: '#07110d', color: '#d1fae5', padding: 0 }}>
      <header
        style={{
          padding: '22px 25px',
          background: '#0d1b15',
          borderBottom: '1px solid #16a34a55',
          fontFamily: 'Consolas, monospace',
        }}
      >
        <div style={{ color: '#22c55e', fontSize: 9, marginBottom: 5 }}>~/resume $ whoami</div>
        <h1 style={{ margin: 0, color: '#f0fdf4', fontSize: 25 }}>{resume.personal.name}</h1>
        <p style={{ margin: '4px 0 10px', color: '#86efac', fontSize: 10 }}>{resume.personal.title}</p>
        <NewTemplateContact resume={resume} color="#86efac" />
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr .8fr', gap: 20, padding: 24 }}>
        <div>
          {resume.summary && (
            <NewTemplateSection title="README.md" color={color}>
              <p style={{ margin: 0, fontSize: 9.5, color: '#bbf7d0' }}>{resume.summary}</p>
            </NewTemplateSection>
          )}
          <NewTemplateProjects resume={resume} color={color} title="projects/" />
          <NewTemplateExperience resume={resume} color={color} title="experience/" />
          <NewTemplateAchievements resume={resume} color={color} />
        </div>
        <aside>
          <NewTemplateSkills resume={resume} color={color} title="stack" />
          <NewTemplateEducation resume={resume} color={color} />
        </aside>
      </div>
      <div style={{ padding: '0 24px 24px' }}>
        <NewTemplateCustomSections resume={resume} color={color} />
      </div>
    </div>
  );
}

/* =====================================================
   CORPORATE
===================================================== */

function CorporateResume({ resume }) {
  const color = '#1d4ed8';

  return (
    <div style={{ ...newTemplateBase, padding: '26px 30px' }}>
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 20,
          paddingBottom: 16,
          borderBottom: '4px solid #1d4ed8',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 25, color: '#0f172a' }}>{resume.personal.name}</h1>
          <p style={{ margin: '4px 0 8px', fontSize: 10, color }}>{resume.personal.title}</p>
        </div>
        <NewTemplateContact resume={resume} color="#475569" />
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24, paddingTop: 20 }}>
        <div>
          <NewTemplateSummary resume={resume} color={color} />
          <NewTemplateExperience resume={resume} color={color} />
          <NewTemplateProjects resume={resume} color={color} />
          <NewTemplateAchievements resume={resume} color={color} />
        </div>
        <aside style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: 18 }}>
          <NewTemplateEducation resume={resume} color={color} />
          <NewTemplateSkills resume={resume} color={color} />
        </aside>
      </div>
      <NewTemplateCustomSections resume={resume} color={color} />
    </div>
  );
}

/* =====================================================
   CLASSIC
===================================================== */

function ClassicResume({ resume }) {
  const color = '#111827';

  return (
    <div
      style={{
        ...newTemplateBase,
        padding: '30px 34px',
        fontFamily: 'Georgia, Times New Roman, serif',
      }}
    >
      <header style={{ textAlign: 'center', paddingBottom: 15, borderBottom: '1px solid #111827' }}>
        <h1 style={{ margin: 0, fontSize: 26, letterSpacing: 1 }}>{resume.personal.name}</h1>
        <p style={{ margin: '5px 0 9px', fontSize: 10 }}>{resume.personal.title}</p>
        <NewTemplateContact resume={resume} color="#4b5563" />
      </header>
      <main style={{ paddingTop: 18 }}>
        <NewTemplateSummary resume={resume} color={color} />
        <NewTemplateExperience resume={resume} color={color} />
        <NewTemplateEducation resume={resume} color={color} />
        <NewTemplateProjects resume={resume} color={color} />
        <NewTemplateSkills resume={resume} color={color} />
        <NewTemplateAchievements resume={resume} color={color} />
        <NewTemplateCustomSections resume={resume} color={color} />
      </main>
    </div>
  );
}

/* =====================================================
   ELEGANT
===================================================== */

function ElegantResume({ resume }) {
  const color = '#8b5e3c';

  return (
    <div style={{ ...newTemplateBase, background: '#fffaf5', padding: 0 }}>
      <header style={{ padding: '28px 30px 22px', background: 'linear-gradient(135deg, #fff7ed, #fef3c7)', borderBottom: '1px solid #d6a46b' }}>
        <div style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color, marginBottom: 8 }}>Professional Profile</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, color: '#3f2a1d' }}>{resume.personal.name}</h1>
        <p style={{ margin: '5px 0 10px', fontSize: 11, color }}>{resume.personal.title}</p>
        <NewTemplateContact resume={resume} color="#6b5b4d" />
      </header>
      <div style={{ padding: '22px 30px' }}>
        <NewTemplateSummary resume={resume} color={color} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr', gap: 24 }}>
          <div>
            <NewTemplateExperience resume={resume} color={color} />
            <NewTemplateProjects resume={resume} color={color} />
          </div>
          <aside>
            <NewTemplateEducation resume={resume} color={color} />
            <NewTemplateSkills resume={resume} color={color} />
            <NewTemplateAchievements resume={resume} color={color} />
          </aside>
        </div>
        <NewTemplateCustomSections resume={resume} color={color} />
      </div>
    </div>
  );
}

/* =====================================================
   PORTFOLIO
===================================================== */

function PortfolioResume({ resume }) {
  const color = '#db2777';

  return (
    <div style={{ ...newTemplateBase, background: '#fff1f7', padding: 0 }}>
      <header style={{ padding: '26px 28px', background: 'linear-gradient(135deg, #831843, #db2777)', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: 2.5, textTransform: 'uppercase', opacity: .8 }}>Creative Portfolio</div>
            <h1 style={{ margin: '6px 0 3px', fontSize: 28 }}>{resume.personal.name}</h1>
            <p style={{ margin: 0, fontSize: 11, opacity: .9 }}>{resume.personal.title}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <NewTemplateContact resume={resume} color="#fce7f3" />
          </div>
        </div>
      </header>
      <div style={{ padding: 24 }}>
        <NewTemplateSummary resume={resume} color={color} />
        {resume.projects.length > 0 && (
          <NewTemplateSection title="Featured Work" color={color}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {resume.projects.map((item, index) => (
                <div key={index} style={{ background: '#fff', borderRadius: 10, padding: 12, boxShadow: '0 4px 16px rgba(131,24,67,.10)' }}>
                  <div style={{ width: 30, height: 4, borderRadius: 3, background: color, marginBottom: 8 }} />
                  <strong style={{ fontSize: 10.5 }}>{item.name}</strong>
                  {item.technologies && <div style={{ fontSize: 7.8, color, marginTop: 3 }}>{item.technologies}</div>}
                  {item.description && <p style={{ margin: '6px 0 0', fontSize: 8.5, color: '#475569' }}>{item.description}</p>}
                </div>
              ))}
            </div>
          </NewTemplateSection>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 22 }}>
          <div>
            <NewTemplateExperience resume={resume} color={color} />
            <NewTemplateEducation resume={resume} color={color} />
          </div>
          <aside>
            <NewTemplateSkills resume={resume} color={color} />
            <NewTemplateAchievements resume={resume} color={color} />
          </aside>
        </div>
        <NewTemplateCustomSections resume={resume} color={color} />
      </div>
    </div>
  );
}

/* =====================================================
   ATS SIMPLE
===================================================== */

function ATSSimpleResume({ resume }) {
  const color = '#111827';

  return (
    <div
      style={{
        ...newTemplateBase,
        padding: '28px 34px',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <header style={{ paddingBottom: 12, borderBottom: '2px solid #111827' }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>{resume.personal.name}</h1>
        <p style={{ margin: '3px 0 7px', fontSize: 10 }}>{resume.personal.title}</p>
        <NewTemplateContact resume={resume} color="#374151" />
      </header>
      <main style={{ paddingTop: 15 }}>
        <NewTemplateSummary resume={resume} color={color} />
        <NewTemplateExperience resume={resume} color={color} />
        <NewTemplateEducation resume={resume} color={color} />
        <NewTemplateProjects resume={resume} color={color} />
        <NewTemplateSkills resume={resume} color={color} />
        <NewTemplateAchievements resume={resume} color={color} />
        <NewTemplateCustomSections resume={resume} color={color} />
      </main>
    </div>
  );
}

