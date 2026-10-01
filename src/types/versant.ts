export interface Candidate {
  tin: string;
  fullName: string;
  email: string;
  testTitle: string;
  organization: string;
  validUntil: string;
  status: 'ready' | 'in_progress' | 'completed';
  systemCheckCompleted: boolean;
  scoreReport?: ScoreReport;
  createdAt: string;
}

export interface ScoreReport {
  tin: string;
  candidateName: string;
  completedAt: string;
  overallScore: number; // 20 - 80
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  gseScore: number; // 10 - 90
  subScores: {
    sentenceMastery: number;
    vocabulary: number;
    fluency: number;
    pronunciation: number;
  };
  summary: string;
  recommendations: string[];
  sectionResponses?: TestResponseRecord[];
}

export interface TestResponseRecord {
  sectionId: string;
  itemId: string;
  prompt: string;
  transcript: string;
  scores: {
    sentenceMastery: number;
    vocabulary: number;
    fluency: number;
    pronunciation: number;
  };
  feedback: string;
}

export interface TestItem {
  id: string;
  prompt?: string;
  audioText?: string;
  expectedAnswer?: string;
  fragments?: string;
  expectedSentence?: string;
  storyText?: string;
}

export interface TestSection {
  id: string;
  title: string;
  instructions: string;
  timeLimitSeconds: number;
  items: TestItem[];
}

export interface SystemCheckState {
  network: { tested: boolean; latencyMs: number; passed: boolean };
  audio: { tested: boolean; passed: boolean };
  microphone: { tested: boolean; volumeLevel: number; passed: boolean };
  browser: { tested: boolean; passed: boolean };
}
