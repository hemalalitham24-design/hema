import React from 'react';
import { FileText, Cpu, PlayCircle, Award, Users, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Candidate } from '../types/versant';

interface NavbarProps {
  currentTab: 'instructions' | 'system-check' | 'take-test' | 'score-report' | 'proctor';
  setCurrentTab: (tab: 'instructions' | 'system-check' | 'take-test' | 'score-report' | 'proctor') => void;
  activeCandidate: Candidate | null;
  serverOnline: boolean;
  latencyMs: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeCandidate,
  serverOnline,
  latencyMs,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0B1B3D] text-white shadow-md border-b border-[#1E293B]">
      {/* Top micro bar with Pearson certification and backend status */}
      <div className="bg-[#071126] text-xs text-slate-300 py-1.5 px-4 sm:px-8 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-sky-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Official Pearson Scorekeeper Service
          </span>
          <span className="text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">Ordinate™ Automated Spoken Language Evaluation</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-300">
              {serverOnline ? `Backend Connected (${latencyMs}ms)` : 'Connecting...'}
            </span>
          </div>
          {activeCandidate && (
            <span className="bg-sky-950 text-sky-200 border border-sky-800 text-[11px] px-2 py-0.5 rounded font-mono">
              TIN: {activeCandidate.tin}
            </span>
          )}
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setCurrentTab('instructions')}>
            <div className="flex flex-col">
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black tracking-tight text-white">VERSANT</span>
                <span className="text-xs font-semibold text-sky-400">™</span>
              </div>
              <span className="text-[11px] tracking-wider text-slate-400 uppercase font-medium">
                by <strong className="text-sky-400 font-semibold">Pearson</strong>
              </span>
            </div>
            <div className="hidden md:block h-7 w-[1px] bg-slate-700 mx-1" />
            <span className="hidden md:inline-block text-xs font-medium text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
              Candidate Testing Portal
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentTab('instructions')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentTab === 'instructions'
                  ? 'bg-[#0072CE] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Test Instructions</span>
            </button>

            <button
              onClick={() => setCurrentTab('system-check')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentTab === 'system-check'
                  ? 'bg-[#0072CE] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>VersantCheck™</span>
              {activeCandidate?.systemCheckCompleted && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
              )}
            </button>

            <button
              onClick={() => setCurrentTab('take-test')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentTab === 'take-test'
                  ? 'bg-[#0072CE] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Take Test</span>
              <span className="hidden lg:inline text-[10px] bg-sky-900 text-sky-200 px-1.5 py-0.2 rounded border border-sky-700">
                Web
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('score-report')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentTab === 'score-report'
                  ? 'bg-[#0072CE] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Score Report</span>
            </button>

            <button
              onClick={() => setCurrentTab('proctor')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentTab === 'proctor'
                  ? 'bg-[#0072CE] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Candidates / Hub</span>
              <span className="md:hidden">Proctor</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
