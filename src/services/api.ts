import { Candidate, ScoreReport, TestSection, TestResponseRecord } from '../types/versant';

export async function checkServerHealth() {
  const start = performance.now();
  const res = await fetch('/api/health');
  const elapsed = Math.round(performance.now() - start);
  const data = await res.json();
  return { ...data, latencyMs: elapsed };
}

export async function fetchCandidateByTin(tin: string): Promise<Candidate> {
  const res = await fetch(`/api/candidates/${encodeURIComponent(tin.trim())}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Candidate not found');
  }
  return data.candidate;
}

export async function fetchAllCandidates(): Promise<Candidate[]> {
  const res = await fetch('/api/candidates');
  const data = await res.json();
  return data.candidates || [];
}

export async function createCandidate(payload: {
  fullName: string;
  email?: string;
  testTitle?: string;
  organization?: string;
}): Promise<Candidate> {
  const res = await fetch('/api/candidates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create candidate');
  }
  return data.candidate;
}

export async function submitSystemCheck(payload: {
  tin?: string;
  micWorking: boolean;
  audioWorking: boolean;
  latencyMs: number;
  roomNoiseLevel?: string;
}) {
  const res = await fetch('/api/system-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function fetchTestQuestions(): Promise<TestSection[]> {
  const res = await fetch('/api/test/questions');
  const data = await res.json();
  return data.sections || [];
}

export async function startTestSession(tin: string, deliveryMode: string = 'Web') {
  const res = await fetch('/api/test/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tin, deliveryMode }),
  });
  return await res.json();
}

export async function evaluateSpokenResponse(payload: {
  sectionId: string;
  itemId: string;
  prompt?: string;
  transcript: string;
  expectedAnswer?: string;
  audioDuration?: number;
}): Promise<{
  scores: {
    sentenceMastery: number;
    vocabulary: number;
    fluency: number;
    pronunciation: number;
  };
  feedback: string;
}> {
  const res = await fetch('/api/test/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data;
}

export async function finishTestSession(tin: string, responses: TestResponseRecord[]): Promise<ScoreReport> {
  const res = await fetch('/api/test/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tin, responses }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to finalize test score');
  }
  return data.report;
}

export async function fetchScoreReport(tin: string): Promise<{ report: ScoreReport; candidate: Candidate }> {
  const res = await fetch(`/api/test/results/${encodeURIComponent(tin.trim())}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Score report not available');
  }
  return data;
}
