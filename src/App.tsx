import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TestInstructionsView } from './components/TestInstructionsView';
import { VersantCheckModal } from './components/VersantCheckModal';
import { TakeTestFlow } from './components/TakeTestFlow';
import { ScoreReportView } from './components/ScoreReportView';
import { CandidateManager } from './components/CandidateManager';
import {
  checkServerHealth,
  fetchCandidateByTin,
  fetchAllCandidates,
} from './services/api';
import { Candidate, ScoreReport } from './types/versant';

// Fallback seed candidate matching the user's uploaded document
const defaultCandidate: Candidate = {
  tin: '27146819',
  fullName: 'RAHUL DRAVID S',
  email: 'hemalalitham24@gmail.com',
  testTitle: 'Versant English Test - 4 Skills (Web)',
  organization: 'Pearson Talent Assessment & Language Evaluation',
  validUntil: '2026-10-31',
  status: 'ready',
  systemCheckCompleted: false,
  createdAt: '2026-09-30T10:00:00Z',
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'instructions' | 'system-check' | 'take-test' | 'score-report' | 'proctor'
  >('instructions');

  const [activeCandidate, setActiveCandidate] = useState<Candidate>(defaultCandidate);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([defaultCandidate]);
  const [activeReport, setActiveReport] = useState<ScoreReport | null>(null);

  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(32);

  // Initialize and load candidates from backend
  const loadInitialData = async () => {
    try {
      const health = await checkServerHealth();
      setServerOnline(true);
      setLatencyMs(health.latencyMs);

      const candidateList = await fetchAllCandidates();
      if (candidateList.length > 0) {
        setAllCandidates(candidateList);
        // Find Rahul Dravid S by TIN 27146819
        const rahul = candidateList.find((c) => c.tin === '27146819');
        if (rahul) {
          setActiveCandidate(rahul);
          if (rahul.scoreReport) {
            setActiveReport(rahul.scoreReport);
          }
        }
      }
    } catch (err) {
      console.warn('Backend sync warning:', err);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Periodic ping to maintain live backend latency indicator
    const interval = setInterval(async () => {
      try {
        const health = await checkServerHealth();
        setServerOnline(true);
        setLatencyMs(health.latencyMs);
      } catch {
        setServerOnline(false);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleTestComplete = (report: ScoreReport, candidate: Candidate) => {
    setActiveReport(report);
    setActiveCandidate({
      ...candidate,
      status: 'completed',
      scoreReport: report,
    });
    // Switch to score report view
    setCurrentTab('score-report');
    loadInitialData();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-sky-200">
      {/* Top Pearson Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeCandidate={activeCandidate}
        serverOnline={serverOnline}
        latencyMs={latencyMs}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'instructions' && (
          <TestInstructionsView
            candidate={activeCandidate}
            onProceedToSystemCheck={() => setCurrentTab('system-check')}
            onProceedToTakeTest={() => setCurrentTab('take-test')}
          />
        )}

        {currentTab === 'system-check' && (
          <VersantCheckModal
            candidate={activeCandidate}
            onComplete={() => setCurrentTab('take-test')}
          />
        )}

        {currentTab === 'take-test' && (
          <TakeTestFlow
            initialCandidate={activeCandidate}
            onTestComplete={handleTestComplete}
            onGoToInstructions={() => setCurrentTab('instructions')}
          />
        )}

        {currentTab === 'score-report' && (
          <ScoreReportView
            report={activeReport}
            candidate={activeCandidate}
            onSelectCandidate={(c) => {
              setActiveCandidate(c);
              if (c.scoreReport) setActiveReport(c.scoreReport);
            }}
            onGoToTakeTest={() => setCurrentTab('take-test')}
          />
        )}

        {currentTab === 'proctor' && (
          <CandidateManager
            candidates={allCandidates}
            activeCandidate={activeCandidate}
            onSelectCandidate={(cand) => {
              setActiveCandidate(cand);
              if (cand.scoreReport) {
                setActiveReport(cand.scoreReport);
              }
            }}
            onRefreshCandidates={loadInitialData}
            onGoToInstructions={() => setCurrentTab('instructions')}
          />
        )}
      </main>

      {/* Persistent Pearson Footer */}
      <footer className="no-print bg-[#071126] text-slate-400 py-6 px-4 border-t border-slate-800 text-xs text-center">
        <div className="max-w-4xl mx-auto space-y-2">
          <p>© 2019-2026 Pearson Education, Inc. or its affiliate(s). All rights reserved.</p>
          <p className="text-[11px] text-slate-500">
            Versant by Pearson • Ordinate automated spoken language technology • Validated candidate test session for TIN: {activeCandidate.tin}
          </p>
        </div>
      </footer>
    </div>
  );
}
