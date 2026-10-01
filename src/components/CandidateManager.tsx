import React, { useState } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  ShieldCheck,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Candidate } from '../types/versant';
import { createCandidate } from '../services/api';

interface CandidateManagerProps {
  candidates: Candidate[];
  activeCandidate: Candidate;
  onSelectCandidate: (candidate: Candidate) => void;
  onRefreshCandidates: () => void;
  onGoToInstructions: () => void;
}

export const CandidateManager: React.FC<CandidateManagerProps> = ({
  candidates,
  activeCandidate,
  onSelectCandidate,
  onRefreshCandidates,
  onGoToInstructions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTestTitle, setNewTestTitle] = useState('Versant English Test - 4 Skills (Web)');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = candidates.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tin.includes(searchTerm) ||
      c.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) return;

    setCreating(true);
    setErrorMsg(null);
    try {
      const created = await createCandidate({
        fullName: newFullName.trim(),
        email: newEmail.trim() || undefined,
        testTitle: newTestTitle,
      });
      onRefreshCandidates();
      onSelectCandidate(created);
      setShowCreateModal(false);
      setNewFullName('');
      setNewEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create candidate ticket');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B1B3D] to-[#0A2558] text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-sky-900/50 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Users className="w-4 h-4" /> Proctor Hub & Voucher Administration
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">Scorekeeper Candidate Directory</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Manage candidate test authorizations, issue new 8-digit TINs, and audit test completions.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 rounded-xl bg-[#0072CE] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue New TIN Voucher</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by Candidate Name, TIN, or Organization..."
            className="w-full bg-white text-slate-900 text-xs px-4 py-3 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0072CE] focus:ring-2 focus:ring-sky-100 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} candidate vouchers
        </div>
      </div>

      {/* Candidate List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cand) => {
          const isSelected = activeCandidate?.tin === cand.tin;
          return (
            <div
              key={cand.tin}
              className={`p-6 rounded-2xl border-2 transition bg-white shadow-sm flex flex-col justify-between ${
                isSelected
                  ? 'border-[#0072CE] ring-2 ring-sky-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold bg-sky-50 text-[#0072CE] px-2.5 py-1 rounded-lg border border-sky-200">
                    TIN: {cand.tin}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      cand.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : cand.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {cand.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{cand.fullName}</h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{cand.testTitle}</p>
                <p className="text-[11px] text-slate-400 mt-1">{cand.organization}</p>

                {cand.scoreReport && (
                  <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Score Result</span>
                      <span className="font-extrabold text-emerald-900 text-sm">
                        {cand.scoreReport.overallScore} / 80 ({cand.scoreReport.cefrLevel})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">GSE Score</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {cand.scoreReport.gseScore} / 90
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    onSelectCandidate(cand);
                    onGoToInstructions();
                  }}
                  className="text-xs text-[#0072CE] hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Voucher</span>
                </button>

                <button
                  onClick={() => onSelectCandidate(cand)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isSelected ? 'Active Candidate' : 'Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create New Candidate Voucher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900">Issue New Test Voucher</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Candidate Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. PRIYA SHARMA"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0072CE] focus:ring-2 focus:ring-sky-100 outline-none uppercase font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0072CE] focus:ring-2 focus:ring-sky-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Test Assessment Form
                </label>
                <select
                  value={newTestTitle}
                  onChange={(e) => setNewTestTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0072CE] outline-none font-medium bg-white"
                >
                  <option value="Versant English Test - 4 Skills (Web)">
                    Versant English Test - 4 Skills (Web)
                  </option>
                  <option value="Versant Professional English Test (Web)">
                    Versant Professional English Test (Web)
                  </option>
                  <option value="Versant Writing & Speaking Evaluation (Web)">
                    Versant Writing & Speaking Evaluation (Web)
                  </option>
                </select>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-[#0072CE] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition"
                >
                  {creating ? 'Issuing...' : 'Generate 8-Digit TIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
