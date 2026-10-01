import React from 'react';
import {
  Printer,
  ExternalLink,
  Play,
  CheckCircle,
  Wifi,
  Headphones,
  Volume2,
  Mic,
  MessageSquare,
  FileX,
  PauseOctagon,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import { Candidate } from '../types/versant';

interface TestInstructionsViewProps {
  candidate: Candidate;
  onProceedToSystemCheck: () => void;
  onProceedToTakeTest: () => void;
}

export const TestInstructionsView: React.FC<TestInstructionsViewProps> = ({
  candidate,
  onProceedToSystemCheck,
  onProceedToTakeTest,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Action banner on top for rapid testing */}
      <div className="no-print mb-6 p-4 rounded-xl bg-gradient-to-r from-sky-900/40 via-blue-900/30 to-indigo-900/40 border border-sky-600/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#0072CE] text-white rounded-lg shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Official Candidate Voucher Loaded
              <span className="text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-normal">
                TIN Active: {candidate.tin}
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Assigned to <strong className="text-sky-300">{candidate.fullName}</strong> • Valid until {candidate.validUntil}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-medium border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
          <button
            onClick={onProceedToSystemCheck}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-sky-700 hover:bg-sky-600 text-white text-xs font-medium shadow-sm transition"
          >
            <span>VersantCheck™</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onProceedToTakeTest}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#0072CE] hover:bg-blue-600 text-white text-xs font-semibold shadow-sm transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Test</span>
          </button>
        </div>
      </div>

      {/* Official Sheet Card (Replicating exact uploaded layout) */}
      <div className="bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
        <div className="p-8 sm:p-12 space-y-8">
          {/* Header row: VERSANT by Pearson + Candidate Name & TIN */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-100 gap-4">
            <div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B1B3D]">
                  VERSANT
                </span>
                <span className="text-xs font-bold text-[#0072CE]">™</span>
              </div>
              <p className="text-xs font-semibold text-slate-600 tracking-wide mt-0.5">
                by <span className="text-[#0072CE] font-bold">Pearson</span>
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-4">
                Test Instructions
              </h1>
            </div>

            <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-lg sm:rounded-none w-full sm:w-auto border sm:border-none border-slate-200">
              <div className="text-sm font-bold tracking-wider text-slate-800 uppercase font-mono">
                {candidate.fullName}
              </div>
              <div className="mt-1 flex items-baseline sm:justify-end gap-1.5">
                <span className="text-lg font-semibold text-slate-500 font-mono">TIN:</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0B1B3D] tracking-tight font-mono">
                  {candidate.tin}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Test: {candidate.testTitle}
              </div>
            </div>
          </div>

          {/* SECTION: BEFORE THE TEST */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase">
              BEFORE THE TEST:
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              {/* Item 1: Computer with internet */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-18 h-18 rounded-full border-2 border-sky-400/40 bg-sky-50 flex items-center justify-center mb-3 text-sky-700 shadow-sm relative">
                  <div className="w-10 h-8 border-2 border-slate-700 rounded-sm flex items-center justify-center bg-white relative">
                    <div className="w-3 h-3 rounded-full bg-sky-500/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                    </div>
                    {/* Wifi symbol indicator */}
                    <div className="absolute -top-3 -right-2 text-rose-500">
                      <Wifi className="w-4 h-4 text-orange-500" />
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-800 leading-snug">
                  Computer with a<br />good internet<br />connection
                </p>
              </div>

              {/* Item 2: Headphones with boom microphone */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-18 h-18 rounded-full border-2 border-sky-400/40 bg-sky-50 flex items-center justify-center mb-3 text-sky-700 shadow-sm relative">
                  <Headphones className="w-9 h-9 text-slate-700" />
                  <div className="absolute bottom-2 right-4 w-4 h-4 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center">
                    <Mic className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-800 leading-snug">
                  Headphones with a<br />boom microphone
                </p>
              </div>

              {/* Item 3: A quiet room */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-18 h-18 rounded-full border-2 border-sky-400/40 bg-sky-50 flex items-center justify-center mb-3 text-sky-700 shadow-sm relative">
                  <div className="flex items-center space-x-1">
                    <span className="text-2xl font-bold text-slate-700">🤫</span>
                    <span className="text-[10px] font-semibold text-slate-600 tracking-tight">Shhh...</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-800 leading-snug">
                  A quiet room
                </p>
              </div>
            </div>

            {/* VersantCheck Callout Banner */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-sky-50 via-blue-50/60 to-indigo-50/50 border border-sky-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>For system check, go to</span>
                  <button
                    onClick={onProceedToSystemCheck}
                    className="text-[#0072CE] underline hover:text-blue-800 font-bold"
                  >
                    VersantCheck.com
                  </button>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Follow the instructions to make sure you are ready to take a Versant test
                </p>
              </div>

              <button
                onClick={onProceedToSystemCheck}
                className="no-print inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-[#0072CE] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap"
              >
                <span>Launch System Check</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SECTION: DURING THE TEST */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase">
              DURING THE TEST:
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
              {/* Badge 1: Microphone distance */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="w-16 h-16 rounded-full border-2 border-sky-300/40 bg-sky-50/50 flex flex-col items-center justify-center mb-2 shadow-sm">
                  <Headphones className="w-6 h-6 text-slate-700 mb-0.5" />
                  <span className="text-[10px] font-bold text-slate-600 font-mono">3 - 5 cm</span>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-tight">
                  Microphone<br />distance from<br />mouth
                </p>
              </div>

              {/* Badge 2: Speak naturally */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="w-16 h-16 rounded-full border-2 border-sky-300/40 bg-sky-50/50 flex items-center justify-center mb-2 shadow-sm text-amber-600">
                  <div className="relative">
                    <span className="text-2xl">🗣️</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-tight">
                  Speak naturally
                </p>
              </div>

              {/* Badge 3: Don't know */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="w-16 h-16 rounded-full border-2 border-sky-300/40 bg-sky-50/50 flex items-center justify-center mb-2 shadow-sm text-slate-700">
                  <span className="text-2xl">🤷‍♂️</span>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-tight">
                  Don't know? Be<br />silent or say<br />"I don't know"
                </p>
              </div>

              {/* Badge 4: No notes */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="w-16 h-16 rounded-full border-2 border-rose-300 bg-rose-50 flex items-center justify-center mb-2 shadow-sm relative">
                  <FileX className="w-7 h-7 text-rose-600" />
                  {/* Diagonal strike */}
                  <div className="absolute inset-0 rounded-full border-2 border-rose-500 pointer-events-none flex items-center justify-center">
                    <div className="w-12 h-0.5 bg-rose-500 rotate-45" />
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-tight">
                  No notes
                </p>
              </div>

              {/* Badge 5: Test cannot be paused */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/60 border border-slate-100 col-span-2 sm:col-span-1">
                <div className="w-16 h-16 rounded-full border-2 border-rose-300 bg-rose-50 flex items-center justify-center mb-2 shadow-sm relative">
                  <div className="flex items-center space-x-1 text-rose-600">
                    <div className="w-1.5 h-6 bg-rose-600 rounded-xs" />
                    <div className="w-1.5 h-6 bg-rose-600 rounded-xs" />
                  </div>
                  {/* Diagonal strike */}
                  <div className="absolute inset-0 rounded-full border-2 border-rose-500 pointer-events-none flex items-center justify-center">
                    <div className="w-12 h-0.5 bg-rose-500 rotate-45" />
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-tight">
                  Test cannot be<br />paused
                </p>
              </div>
            </div>
          </div>

          {/* SECTION: STARTING AND ENDING THE TEST */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase">
              STARTING AND ENDING THE TEST
            </h2>

            <ol className="space-y-3 pt-1 text-slate-800 text-sm font-medium">
              <li className="flex items-start">
                <span className="font-bold text-slate-900 mr-2 min-w-5">1.</span>
                <div>
                  Go to{' '}
                  <button
                    onClick={onProceedToTakeTest}
                    className="text-[#0072CE] underline font-bold hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    https://www.versanttest.com/scorekeeper/take-test
                    <ExternalLink className="w-3.5 h-3.5 inline" />
                  </button>
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-slate-900 mr-2 min-w-5">2.</span>
                <span>You may be asked to enter your TIN</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-slate-900 mr-2 min-w-5">3.</span>
                <span>Click on "Validate", then follow the on-screen instructions</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-slate-900 mr-2 min-w-5">4.</span>
                <span>
                  Select <strong className="text-[#0072CE]">“Web”</strong> and click on{' '}
                  <strong className="text-slate-900">“Start test”</strong>
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-slate-900 mr-2 min-w-5">5.</span>
                <span>
                  Click <strong className="text-slate-900">“Finish”</strong> at the end of the test
                </span>
              </li>
            </ol>
          </div>

          {/* CTA Footer in card */}
          <div className="no-print pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Need assistance? Check your audio peripherals before validating your TIN.
            </div>

            <button
              onClick={onProceedToTakeTest}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-[#0072CE] hover:bg-blue-600 text-white font-bold shadow-md transition transform active:scale-95"
            >
              <span>Validate TIN {candidate.tin} & Begin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Pearson Copyright & Legal Footer */}
          <div className="pt-8 border-t border-slate-100 text-[10px] text-slate-500 leading-relaxed space-y-1">
            <p>© 2019-2025 Pearson Education, Inc. or its affiliate(s). All rights reserved.</p>
            <p>
              Ordinate and Versant are trademarks, in the U.S. and/or other countries, of Pearson Education, Inc. or its
              affiliate(s). Other names may be the trademarks of their respective owners.
            </p>
            <p>
              For more information, visit us online at{' '}
              <span className="text-[#0072CE] underline">VersantTests.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
