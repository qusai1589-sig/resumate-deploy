import { useState } from 'react';

import Navbar from '../components/Navbar/Navbar';

import Hero from '../components/Hero/Hero';

import Stats from '../components/Stats/Stats';

import Features from '../components/Features/Features';

import HowItWorks from '../components/HowItWorks/HowItWorks';

import Templates from '../components/Templates/Templates';

import AIFeatureSection from '../components/AIFeature/AIFeatureSection';

import CertificateSection from '../components/Certificate/CertificateSection';

import CTA from '../components/CTA/CTA';

import Footer from '../components/Footer/Footer';

import TemplateModal from '../components/common/TemplateModal';

import CertificateVaultModal from '../components/CertificateVault/CertificateVaultModal';

import Toast from '../components/common/Toast';

export default function LandingPage({
  onNavigateToLogin,
  onCreateAccount,
  onUseTemplate,
  onOpenVault,
  onCreateResume,
}) {
  const [selectedTemplate, setSelectedTemplate] =
    useState(null);

  const [isVaultOpen, setIsVaultOpen] =
    useState(false);

  const [toastMessage, setToastMessage] =
    useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  // --------------------------------------------------
  // GET STARTED / CREATE RESUME
  // --------------------------------------------------
  const handleGetStarted = () => {
    const el = document.getElementById(
      'templates'
    );

    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
      });
    }
  };

  // --------------------------------------------------
  // HERO CREATE RESUME
  // --------------------------------------------------
  const handleCreateResume = () => {
    if (onCreateResume) {
      onCreateResume();
      return;
    }

    if (onCreateAccount) {
      onCreateAccount();
    }
  };

  // --------------------------------------------------
  // SIGN IN
  // --------------------------------------------------
  const handleSignIn = () => {
    onNavigateToLogin?.();
  };

  // --------------------------------------------------
  // CREATE ACCOUNT
  // --------------------------------------------------
  const handleCreateAccount = () => {
    onCreateAccount?.();
  };

  // --------------------------------------------------
  // EXPLORE TEMPLATES
  // --------------------------------------------------
  const handleExploreTemplates = () => {
    const el = document.getElementById(
      'templates'
    );

    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
      });
    }
  };

  // --------------------------------------------------
  // TEMPLATE PREVIEW
  // --------------------------------------------------
  const handlePreviewTemplate = (
    template
  ) => {
    setSelectedTemplate(template);
  };

  // --------------------------------------------------
  // USE TEMPLATE
  // --------------------------------------------------
  const handleUseTemplate = (
    template
  ) => {
    setSelectedTemplate(null);

    onUseTemplate?.(template);
  };

  // --------------------------------------------------
  // CERTIFICATE VAULT
  // --------------------------------------------------
  const handleOpenVault = () => {
    if (onOpenVault) {
      onOpenVault();
      return;
    }

    setIsVaultOpen(true);
  };

  const handleUseInResume = () => {
    showToast(
      'Certificate added to resume achievements'
    );
  };

  return (
    <div className="landing-page">

      {/* NAVBAR */}
      <Navbar
        onGetStarted={
          handleGetStarted
        }
        onLogin={
          handleSignIn
        }
        onSignIn={
          handleSignIn
        }
        onCreateAccount={
          handleCreateAccount
        }
        onOpenVault={
          handleOpenVault
        }
      />

      <main id="main-content">

        {/* HERO */}
        <Hero
          onCreateResume={
            handleCreateResume
          }
          onExploreTemplates={
            handleExploreTemplates
          }
        />

        {/* STATS */}
        <Stats />

        {/* FEATURES */}
        <Features />

        {/* HOW IT WORKS */}
        <HowItWorks />

        {/* TEMPLATES */}
        <Templates
          onPreviewTemplate={
            handlePreviewTemplate
          }
          onUseTemplate={
            handleUseTemplate
          }
        />

        {/* AI */}
        <AIFeatureSection />

        {/* CERTIFICATE */}
        <CertificateSection
          onUploadCertificate={
            handleOpenVault
          }
        />

        {/* CTA */}
        <CTA
          onCreateResume={
            handleCreateResume
          }
        />

      </main>

      {/* FOOTER */}
      <Footer />

      {/* TEMPLATE PREVIEW */}
      <TemplateModal
        template={
          selectedTemplate
        }
        onClose={() =>
          setSelectedTemplate(null)
        }
        onSelect={
          handleUseTemplate
        }
      />

      {/* CERTIFICATE VAULT */}
      <CertificateVaultModal
        isOpen={
          isVaultOpen
        }
        onClose={() =>
          setIsVaultOpen(false)
        }
        onUseInResume={
          handleUseInResume
        }
      />

      {/* TOAST */}
      <Toast
        message={
          toastMessage
        }
        onClose={() =>
          setToastMessage('')
        }
      />

    </div>
  );
}