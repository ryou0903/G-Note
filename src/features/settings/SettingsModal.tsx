import React, { useState } from 'react';
import classNames from 'classnames';
import { X, ChevronRight, ChevronLeft, Info, FileText } from 'lucide-react';
import { APP_VERSION, CHANGELOG } from './version';

type SettingsSection = 'about' | null;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktop: boolean;
}

const menuItems: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: 'about', label: 'G Noteについて', icon: <Info size={18} /> },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isDesktop }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>(isDesktop ? 'about' : null);
  const [showChangelog, setShowChangelog] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setActiveSection(isDesktop ? 'about' : null);
    setShowChangelog(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  // --- About Content ---
  const AboutContent = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
          <FileText size={28} className="text-indigo-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white">G Note</h3>
          <p className="text-sm text-slate-400">AI Native Knowledge Base</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-300">Version {APP_VERSION}</span>
        <button
          onClick={() => setShowChangelog(true)}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
        >
          Changelog
        </button>
      </div>

      <div className="border-t border-white/5 pt-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Obsidianにインスパイアされた、パーソナルなノート管理アプリです。
          マークダウン対応のエディタ、フォルダ管理、PWAによるオフライン動作をサポートしています。
        </p>
      </div>
    </div>
  );

  // --- Changelog Content ---
  const ChangelogContent = () => (
    <div className="space-y-4">
      {CHANGELOG.map((entry) => (
        <div key={entry.version} className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-white">{entry.version}</span>
            <span className="text-xs text-slate-500">{entry.date}</span>
          </div>
          <ul className="space-y-0.5">
            {entry.changes.map((change, i) => (
              <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                <span className="text-indigo-400 mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-indigo-400" />
                {change}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  // Determine what to show in the right/detail panel
  const renderSectionContent = () => {
    if (showChangelog) return <ChangelogContent />;
    if (activeSection === 'about') return <AboutContent />;
    return null;
  };

  const sectionTitle = () => {
    if (showChangelog) return 'Changelog';
    if (activeSection === 'about') return 'G Noteについて';
    return '';
  };

  // ========================
  // DESKTOP: Modal layout
  // ========================
  if (isDesktop) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="relative w-full max-w-2xl h-[480px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 flex overflow-hidden">
          {/* Glass shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

          {/* Left sidebar */}
          <div className="relative w-52 flex-shrink-0 border-r border-white/5 flex flex-col">
            <div className="px-4 py-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">設定</h2>
            </div>
            <nav className="flex-1 px-2 space-y-0.5">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); setShowChangelog(false); }}
                  className={classNames(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    activeSection === item.id && !showChangelog
                      ? "bg-indigo-500/15 text-indigo-400"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right content */}
          <div className="relative flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                {showChangelog && (
                  <button
                    onClick={() => setShowChangelog(false)}
                    className="p-1 text-slate-400 hover:text-white rounded transition-colors mr-1"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <h2 className="text-base font-semibold text-white">{sectionTitle()}</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // MOBILE: Full-screen layout
  // ========================

  // Mobile: detail view (section selected)
  if (activeSection !== null) {
    return (
      <div className="fixed inset-0 z-50 bg-midnight flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-slate-900/60 backdrop-blur-xl">
          <button
            onClick={() => {
              if (showChangelog) {
                setShowChangelog(false);
              } else {
                setActiveSection(null);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-base font-semibold text-white flex-1 truncate">{sectionTitle()}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </header>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {renderSectionContent()}
        </div>
      </div>
    );
  }

  // Mobile: list view (no section selected)
  return (
    <div className="fixed inset-0 z-50 bg-midnight flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/60 backdrop-blur-xl">
        <h2 className="text-lg font-bold text-white">設定</h2>
        <button
          onClick={handleClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </header>
      {/* Menu list */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-slate-200 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
