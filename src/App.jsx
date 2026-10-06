import { useEffect, useState } from 'react';

import { templateResume, applyDocumentToResume } from './services/documentResume';
import { getAuthClient } from './services/authService';

import AccountMenu from './components/Account/AccountMenu';
import YourResumes from './screens/YourResumes';
import { listSavedResumes, saveResume } from './services/resumeLibrary';

import LandingPage from './screens/LandingPage';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import TemplateSelection from './screens/TemplateSelection';
import ResumeBuilder from './screens/ResumeBuilder';
import ATSChecker from './screens/ATSChecker';
import CertificateVaultModal from './components/CertificateVault/CertificateVaultModal';

function App() {
  const [page, setPage] = useState('landing');
  const [session, setSession] = useState(null);
  const [resumeDraft, setResumeDraft] = useState(templateResume);
  const [savedResumes, setSavedResumes] = useState([]);
  const [pendingDocument, setPendingDocument] = useState(null);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [selectedTemplate, setSelectedTemplate] =
    useState('modern');

  const [isVaultOpen, setIsVaultOpen] =
    useState(false);

  const [authMode, setAuthMode] =
    useState('signup');

  useEffect(() => {
    let alive = true; let subscription;
    getAuthClient().then(async client => {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!alive) return;
      setSession(data.session); setSavedResumes(listSavedResumes(data.session?.user.id)); setAuthReady(true);
      if (data.session) setPage('dashboard');
      let previousUserId = data.session?.user.id;
      subscription = client.auth.onAuthStateChange((_event, next) => {
        if (previousUserId !== next?.user.id) { setIsVaultOpen(false); setPendingDocument(null); setResumeDraft(templateResume()); setActiveResumeId(null); setSavedResumes(listSavedResumes(next?.user.id)); }
        previousUserId = next?.user.id;
        setSession(next);
        if (!next) { setIsVaultOpen(false); setResumeDraft(templateResume()); setPendingDocument(null); setPage('landing'); }
        else if (_event === 'SIGNED_IN') setPage('dashboard');
      }).data.subscription;
    }).catch(error => { if (alive) { setAuthError(error.message); setAuthReady(true); } });
    return () => { alive = false; subscription?.unsubscribe(); };
  }, []);

  /* =====================================================
     BROWSER HISTORY
  ===================================================== */

  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState(
        { page: 'landing' },
        '',
        window.location.href
      );
    }

    const handlePopState = (event) => {
      const historyPage = event.state?.page;

      if (historyPage) {
        setPage(['landing', 'login'].includes(historyPage) || session ? historyPage : 'login');
      } else {
        setPage('landing');
      }

      setIsVaultOpen(false);
    };

    window.addEventListener(
      'popstate',
      handlePopState
    );

    return () => {
      window.removeEventListener(
        'popstate',
        handlePopState
      );
    };
  }, [session]);

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const navigateTo = (nextPage) => {
    if (!['landing', 'login'].includes(nextPage) && !session) { setAuthMode('signin'); setPage('login'); return; }
    setPage(nextPage);

    window.history.pushState(
      { page: nextPage },
      '',
      window.location.href
    );
  };

  /* =====================================================
     LOGIN / SIGN UP
  ===================================================== */

  const handleOpenAuth = (mode = 'signup') => {
    setAuthMode(mode);
    navigateTo('login');
  };

  /* =====================================================
     LOGIN → DASHBOARD
  ===================================================== */

  const handleContinueToDashboard = () => {
    setAuthError('');
    setPage('dashboard');
    window.history.pushState({ page: 'dashboard' }, '', window.location.href);
  };

  /* =====================================================
     DASHBOARD → TEMPLATE SELECTION
  ===================================================== */

  const handleCreateResume = () => {
    setResumeDraft(templateResume()); setActiveResumeId(null); setPendingDocument(null);
    navigateTo('templateSelection');
  };

  /* =====================================================
     TEMPLATE SELECTION → RESUME BUILDER
  ===================================================== */

  const handleTemplateContinue = (template) => {
    setSelectedTemplate(template);
    if (pendingDocument) setResumeDraft(current => applyDocumentToResume(current, pendingDocument));
    setPendingDocument(null);
    navigateTo('resumeBuilder');
  };

  /* =====================================================
     RESUME BUILDER → DASHBOARD
  ===================================================== */

  const handleBackToDashboard = () => {
    navigateTo('dashboard');
  };

  /* =====================================================
     TEMPLATE SELECTION → DASHBOARD
  ===================================================== */

  const handleBackFromTemplates = () => {
    setPendingDocument(null);
    navigateTo('dashboard');
  };

  /* =====================================================
     CERTIFICATE VAULT
  ===================================================== */

  const handleOpenVault = () => {
    if (!session) { handleOpenAuth('signin'); return; }
    setIsVaultOpen(true);
  };

  const handleCloseVault = () => {
    setIsVaultOpen(false);
  };

  const handleUseInResume = (certificate) => {
    setPendingDocument(certificate);

    setIsVaultOpen(false);

    navigateTo('templateSelection');
  };

  /* =====================================================
     ATS SCORE CHECKER
  ===================================================== */

  const handleOpenATS = () => {
    navigateTo('atsChecker');
  };

  const handleBackFromATS = () => {
    navigateTo('dashboard');
  };

  const handleOpenResumeBuilderFromATS = () => {
    navigateTo('resumeBuilder');
  };

  /* =====================================================
     PAGE RENDER
  ===================================================== */

  const handleLogout = async () => {
    try { const client = await getAuthClient(); const { error } = await client.auth.signOut(); if (error) throw error; }
    catch (error) { setAuthError(error.message); }
  };
  const updateResumeDraft = updater => {
    setResumeDraft(current => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (next._exampleSections === current._exampleSections) {
        return { ...next, _exampleSections: (current._exampleSections || []).filter(section => next[section] === current[section]) };
      }
      return next;
    });
  };
  const handleSaveResume = () => {
    const { entry, entries } = saveResume(session?.user.id, resumeDraft, selectedTemplate, activeResumeId);
    setActiveResumeId(entry.id); setSavedResumes(entries);
  };
  const accountMenu = session && <AccountMenu user={session.user} onHome={() => navigateTo('landing')} onResumes={() => navigateTo('yourResumes')} onDashboard={handleBackToDashboard} onVault={handleOpenVault} onLogout={handleLogout} />;

  if (!authReady) return <p role="status">Restoring session…</p>;
  return (
    <>
      {authError && <p role="alert">{authError}</p>}
      {session && !['dashboard', 'resumeBuilder'].includes(page) && <div className="account-toolbar">{accountMenu}</div>}
      {/* =================================================
          LOGIN
      ================================================= */}
      {page === 'login' && (
        <Login
          key={authMode}
          authMode={authMode}
          onContinueToDashboard={
            handleContinueToDashboard
          }
          onSwitchMode={() =>
            setAuthMode(
              authMode === 'signin'
                ? 'signup'
                : 'signin'
            )
          }
        />
      )}

      {/* =================================================
          DASHBOARD
      ================================================= */}
      {page === 'yourResumes' && <YourResumes resumes={savedResumes} onCreate={handleCreateResume} onBack={handleBackToDashboard} onOpen={entry => { setResumeDraft(entry.resume); setSelectedTemplate(entry.template); setActiveResumeId(entry.id); navigateTo('resumeBuilder'); }} />}

      {page === 'dashboard' && (
        <Dashboard
          accountMenu={accountMenu}
          onCreateResume={handleCreateResume}
          onOpenVault={handleOpenVault}
          onOpenATS={handleOpenATS}
        />
      )}

      {/* =================================================
          TEMPLATE SELECTION
      ================================================= */}
      {page === 'templateSelection' && (
        <TemplateSelection
          onBackToDashboard={
            handleBackFromTemplates
          }
          onContinue={
            handleTemplateContinue
          }
        />
      )}

      {/* =================================================
          RESUME BUILDER
      ================================================= */}
      {page === 'resumeBuilder' && (
        <ResumeBuilder
          accountMenu={accountMenu}
          onOpenVault={handleOpenVault}
          onSaveResume={handleSaveResume}
          resumeDraft={resumeDraft}
          onResumeChange={updateResumeDraft}
          onBackToDashboard={
            handleBackToDashboard
          }
          selectedTemplate={
            selectedTemplate
          }
        />
      )}

      {/* =================================================
          ATS SCORE CHECKER
      ================================================= */}
      {page === 'atsChecker' && (
        <ATSChecker
          existingResume={savedResumes[0]?.resume || resumeDraft}
          onBackToDashboard={
            handleBackFromATS
          }
          onOpenResumeBuilder={
            handleOpenResumeBuilderFromATS
          }
        />
      )}

      {/* =================================================
          LANDING PAGE
      ================================================= */}
      {page === 'landing' && (
        <LandingPage
          onNavigateToLogin={() =>
            handleOpenAuth('signin')
          }
          onCreateAccount={() =>
            handleOpenAuth('signup')
          }
          onUseTemplate={(template) => {
            setSelectedTemplate(template.id);
            handleOpenAuth('signin');
          }}
          onCreateResume={
            () => handleOpenAuth('signup')
          }
          onOpenVault={handleOpenVault}
        />
      )}

      {/* =================================================
          CERTIFICATE VAULT MODAL
      ================================================= */}
      {isVaultOpen && <CertificateVaultModal
        key={session?.user.id || "guest"}
        isOpen={isVaultOpen}
        onClose={handleCloseVault}
        onUseInResume={handleUseInResume}
      />}
    </>
  );
}

export default App;