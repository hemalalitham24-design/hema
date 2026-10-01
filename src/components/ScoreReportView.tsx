import React, { useState } from 'react';
import {
  Award,
  Printer,
  Download,
  CheckCircle2,
  BarChart2,
  BookOpen,
  Mic,
  Activity,
  Layers,
  Search,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ScoreReport, Candidate } from '../types/versant';
import { fetchScoreReport } from '../services/api';

interface ScoreReportViewProps {
  report: ScoreReport | null;
  candidate: Candidate;
  onSelectCandidate: (candidate: Candidate) => void;
  onGoToTakeTest: () => void;
}

export const ScoreReportView: React.FC<ScoreReportViewProps> = ({
  report,
  candidate,
  onSelectCandidate,
  onGoToTakeTest,
}) => {
  const [lookupTin, setLookupTin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<ScoreReport | null>(report);
  const [currentCandidate, setCurrentCandidate] = useState<Candidate>(candidate);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupTin.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchScoreReport(lookupTin.trim());
      setCurrentReport(data.report);
      setCurrentCandidate(data.candidate);
      onSelectCandidate(data.candidate);
    } catch (err: any) {
      setErrorMsg(err.message || 'No score report found for this TIN.');
    } finally {
      setLoading(false);
    }
  };

  const activeReport = currentReport || candidate.scoreReport;
  const activeCand = currentCandidate || candidate;

  const cefrLevels: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'> = [
    'A1',
    'A2',
    'B1',
    'B2',
    'C1',
    'C2',
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Controls Bar */}
      <div className="no-print mb-6 p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-800">
        {/* Lookup form */}
        <form onSubmit={handleLookup} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              value={lookupTin}
              onChange={(e) => setLookupTin(e.target.value)}
              placeholder="Search TIN (e.g. 27146819)"
              className="bg-slate-800 text-slate-100 text-xs px-3 py-2 pl-8 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500 font-mono w-48 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-[#0072CE] hover:bg-blue-600 text-xs font-semibold text-white transition"
          >
            {loading ? 'Searching...' : 'Lookup'}
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="no-print mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {errorMsg}
        </div>
      )}

      {!activeReport ? (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0072CE] mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            No Score Report Recorded for TIN: {activeCand.tin}
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Candidate <strong>{activeCand.fullName}</strong> has not yet submitted test responses. Please take the test to generate the official CEFR Score Report.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={onGoToTakeTest}
              className="px-6 py-2.5 rounded-xl bg-[#0072CE] hover:bg-blue-600 text-white text-xs font-bold shadow-md transition"
            >
              Take Test Now
            </button>
          </div>
        </div>
      ) : (
        /* Official Pearson Versant Score Report Sheet */
        <div className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
          {/* Header banner */}
          <div className="bg-[#0B1B3D] text-white p-8 border-b-4 border-[#0072CE]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black tracking-tight">VERSANT</span>
                  <span className="text-xs font-bold text-sky-400">™</span>
                </div>
                <p className="text-xs font-medium text-slate-300">
                  by <span className="text-sky-400 font-bold">Pearson</span> • Official Scorekeeper Report
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-mono bg-sky-950 text-sky-300 border border-sky-800 px-2.5 py-1 rounded-md">
                  Report ID: VST-{activeReport.tin}-{Date.now().toString().slice(-4)}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Issued: {new Date(activeReport.completedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Candidate summary banner */}
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Candidate</span>
                <span className="text-base font-bold text-white font-mono">{activeReport.candidateName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">TIN</span>
                <span className="text-base font-bold text-sky-400 font-mono">{activeReport.tin}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Test Name</span>
                <span className="font-semibold text-slate-200">{activeCand.testTitle}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Delivery Format</span>
                <span className="font-semibold text-slate-200">Web Delivery (Verified)</span>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10 space-y-8">
            {/* Primary Scores Grid: Overall Score + CEFR + GSE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Score */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/50 border border-sky-200/80 flex flex-col justify-between text-center">
                <div>
                  <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                    Versant Overall Score
                  </span>
                  <div className="mt-2 text-5xl font-black text-[#0B1B3D] tracking-tight">
                    {activeReport.overallScore}
                    <span className="text-xl font-normal text-slate-400 font-mono"> / 80</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-sky-100 text-[11px] text-slate-600 font-medium">
                  Standardized Pearson Versant Scale (20-80)
                </div>
              </div>

              {/* CEFR Level */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50/50 border border-indigo-200/80 flex flex-col justify-between text-center">
                <div>
                  <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                    CEFR Proficiency Level
                  </span>
                  <div className="mt-2 text-5xl font-black text-indigo-950 tracking-tight">
                    {activeReport.cefrLevel}
                  </div>
                </div>

                {/* CEFR Scale Visualizer */}
                <div className="mt-3">
                  <div className="flex justify-between gap-1">
                    {cefrLevels.map((lvl) => (
                      <div
                        key={lvl}
                        className={`flex-1 py-1 rounded text-[10px] font-bold ${
                          lvl === activeReport.cefrLevel
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {lvl}
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    Common European Framework of Reference
                  </div>
                </div>
              </div>

              {/* Global Scale of English (GSE) */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 flex flex-col justify-between text-center">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Global Scale of English (GSE)
                  </span>
                  <div className="mt-2 text-5xl font-black text-emerald-950 tracking-tight">
                    {activeReport.gseScore}
                    <span className="text-xl font-normal text-slate-400 font-mono"> / 90</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-100 text-[11px] text-slate-600 font-medium">
                  Continuous Granular English Scale (10-90)
                </div>
              </div>
            </div>

            {/* Sub-Scores Detailed Breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase">
                Diagnostic Sub-Skill Breakdown
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sentence Mastery */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#0072CE]" />
                      Sentence Mastery
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {activeReport.subScores.sentenceMastery} / 80
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0072CE] rounded-full"
                      style={{ width: `${(activeReport.subScores.sentenceMastery / 80) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Measures grammatical structure, syntactical accuracy, and sentence building competence.
                  </p>
                </div>

                {/* Vocabulary */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Vocabulary
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {activeReport.subScores.vocabulary} / 80
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${(activeReport.subScores.vocabulary / 80) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Evaluates lexical breadth, accurate word selection, and contextual comprehension.
                  </p>
                </div>

                {/* Fluency */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      Fluency
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {activeReport.subScores.fluency} / 80
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${(activeReport.subScores.fluency / 80) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Measures speech tempo, rhythm, natural hesitation, and continuous spoken flow.
                  </p>
                </div>

                {/* Pronunciation */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-amber-600" />
                      Pronunciation
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {activeReport.subScores.pronunciation} / 80
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-600 rounded-full"
                      style={{ width: `${(activeReport.subScores.pronunciation / 80) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Measures phonemic clarity, syllable stress, intonation, and intelligibility.
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Summary & Recommendations */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Spoken English Performance Profile
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {activeReport.summary}
              </p>

              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 mb-2">Targeted Growth Recommendations:</h4>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                  {activeReport.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Official Certification Signature Box */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Certified by Pearson Ordinate™ Patented Acoustic Evaluation Technology</span>
              </div>
              <div className="font-mono text-[11px]">
                Valid for employment and academic credentialing.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
