import { useState } from 'react';

import { Sparkles, Menu, X } from 'lucide-react';

import './Navbar.css';

export default function Navbar({
  onLogin,
  onOpenVault,
  onSignIn,
  onCreateAccount,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const handleSignIn = () => {
    handleLinkClick();

    if (onSignIn) {
      onSignIn();
    } else if (onLogin) {
      onLogin();
    }
  };

  const handleCreateAccount = () => {
    handleLinkClick();

    if (onCreateAccount) {
      onCreateAccount();
    }
  };

  return (
    <nav
      className="navbar"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="container navbar-container">

        {/* Brand Logo */}
        <a
          href="#hero"
          className="navbar-brand"
          onClick={handleLinkClick}
        >
          <div className="brand-icon-wrapper">
            <Sparkles size={20} />
          </div>

          <span className="brand-text">
            ResuMate
          </span>

          <span className="brand-badge">
            AI
          </span>
        </a>

        {/* Desktop Links */}
        <ul className="navbar-links">

          <li>
            <a
              href="#hero"
              className="nav-link"
            >
              Home
            </a>
          </li>

          <li>
            <a
              href="#features"
              className="nav-link"
            >
              Features
            </a>
          </li>

          <li>
            <a
              href="#templates"
              className="nav-link"
            >
              Templates
            </a>
          </li>

          <li>
            <a
              href="#how-it-works"
              className="nav-link"
            >
              How It Works
            </a>
          </li>

          <li>
            <a
              href="#ai-features"
              className="nav-link"
            >
              AI Superpowers
            </a>
          </li>

          {/* Vault */}
          <li>
            <button
              type="button"
              className="nav-link vault-nav-button"
              onClick={() => {
                onOpenVault?.();
              }}
            >
              Vault
            </button>
          </li>

        </ul>

        {/* Desktop Actions */}
        <div className="navbar-actions">

          {/* Sign In */}
          <button
            type="button"
            className="btn-login"
            onClick={handleSignIn}
          >
            Sign In
          </button>

          {/* Create Account */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleCreateAccount}
          >
            Create Account
          </button>

        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="menu-toggle"
          onClick={toggleMobileMenu}
          aria-label={
            mobileMenuOpen
              ? 'Close menu'
              : 'Open menu'
          }
        >
          {mobileMenuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu">

          <ul className="mobile-nav-links">

            <li>
              <a
                href="#hero"
                className="nav-link"
                onClick={handleLinkClick}
              >
                Home
              </a>
            </li>

            <li>
              <a
                href="#features"
                className="nav-link"
                onClick={handleLinkClick}
              >
                Features
              </a>
            </li>

            <li>
              <a
                href="#templates"
                className="nav-link"
                onClick={handleLinkClick}
              >
                Templates
              </a>
            </li>

            <li>
              <a
                href="#how-it-works"
                className="nav-link"
                onClick={handleLinkClick}
              >
                How It Works
              </a>
            </li>

            <li>
              <a
                href="#ai-features"
                className="nav-link"
                onClick={handleLinkClick}
              >
                AI Superpowers
              </a>
            </li>

            <li>
              <button
                type="button"
                className="nav-link vault-nav-button"
                onClick={() => {
                  handleLinkClick();
                  onOpenVault?.();
                }}
              >
                Certificate Vault
              </button>
            </li>

          </ul>

          {/* Mobile Actions */}
          <div className="mobile-actions">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSignIn}
            >
              Sign In
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateAccount}
            >
              Create Account
            </button>

          </div>

        </div>
      )}
    </nav>
  );
}