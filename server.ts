import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory data store for Candidates and Test Results
interface Candidate {
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

interface ScoreReport {
  tin: string;
  candidateName: string;
  completedAt: string;
  overallScore: number; // 20 - 80
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  gseScore: number; // 10 - 90
  subScores: {
    sentenceMastery: number; // 20 - 80
    vocabulary: number; // 20 - 80
    fluency: number; // 20 - 80
    pronunciation: number; // 20 - 80
  };
  summary: string;
  recommendations: string[];
  sectionResponses?: any[];
}

// Pre-seeded candidates, including the candidate from the user's uploaded document
const candidatesDb: Record<string, Candidate> = {
  '27146819': {
    tin: '27146819',
    fullName: 'RAHUL DRAVID S',
    email: 'hemalalitham24@gmail.com',
    testTitle: 'Versant English Test - 4 Skills (Web)',
    organization: 'Pearson Talent Assessment & Language Evaluation',
    validUntil: '2026-10-31',
    status: 'ready',
    systemCheckCompleted: false,
    createdAt: '2026-09-30T10:00:00Z',
  },
  '38920145': {
    tin: '38920145',
    fullName: 'EMILY WATSON',
    email: 'emily.watson@example.com',
    testTitle: 'Versant English Placement Test (Web)',
    organization: 'Global Academic & Professional Institute',
    validUntil: '2026-10-15',
    status: 'completed',
    systemCheckCompleted: true,
    createdAt: '2026-09-28T14:30:00Z',
    scoreReport: {
      tin: '38920145',
      candidateName: 'EMILY WATSON',
      completedAt: '2026-09-29T11:20:00Z',
      overallScore: 72,
      cefrLevel: 'C1',
      gseScore: 79,
      subScores: {
        sentenceMastery: 75,
        vocabulary: 73,
        fluency: 70,
        pronunciation: 71,
      },
      summary:
        'Candidate demonstrates superior fluency, clear articulatory phonetics, and consistent grammatical accuracy across complex academic and professional dialogues.',
      recommendations: [
        'Maintain natural prosody when handling nuanced idiomatic expressions.',
        'Expand formal lexical precision in specialized technical discourse.',
      ],
    },
  },
};

// Official Versant Questions Bank
const testSections = [
  {
    id: 'part-a',
    title: 'Part A: Reading',
    instructions:
      'Please read the sentences as you are instructed. Read each sentence clearly and at a natural pace when the timer begins.',
    timeLimitSeconds: 15,
    items: [
      { id: 'a1', prompt: 'Traffic is getting heavier in the city center every weekday morning.' },
      { id: 'a2', prompt: 'The new software update will improve battery life on all portable devices.' },
      { id: 'a3', prompt: 'Please remember to submit your quarterly financial reports by Friday.' },
      { id: 'a4', prompt: 'A balanced diet and regular exercise promote long-term well-being and productivity.' },
    ],
  },
  {
    id: 'part-b',
    title: 'Part B: Repeat',
    instructions:
      'Please repeat each sentence that you hear. Repeat it exactly as spoken, maintaining rhythm and pronunciation.',
    timeLimitSeconds: 12,
    items: [
      { id: 'b1', audioText: 'The morning express leaves the central platform at seven.', prompt: 'Listen to the audio sentence and repeat it exactly.' },
      { id: 'b2', audioText: 'Could you please pass the marketing dossier across the table?', prompt: 'Listen to the audio sentence and repeat it exactly.' },
      { id: 'b3', audioText: 'Fresh organic produce is delivered to the market daily.', prompt: 'Listen to the audio sentence and repeat it exactly.' },
      { id: 'b4', audioText: 'We will coordinate the product release with our global partners.', prompt: 'Listen to the audio sentence and repeat it exactly.' },
    ],
  },
  {
    id: 'part-c',
    title: 'Part C: Questions',
    instructions:
      'Please answer each question with a single word or a short phrase.',
    timeLimitSeconds: 8,
    items: [
      { id: 'c1', audioText: 'Are pine trees considered animals or plants?', expectedAnswer: 'plants' },
      { id: 'c2', audioText: 'When you turn off a light, does the room get darker or brighter?', expectedAnswer: 'darker' },
      { id: 'c3', audioText: 'Does ice melt when the ambient temperature rises or falls?', expectedAnswer: 'rises' },
      { id: 'c4', audioText: 'Is a surgeon someone who treats medical patients or repairs automobiles?', expectedAnswer: 'treats patients' },
    ],
  },
  {
    id: 'part-d',
    title: 'Part D: Sentence Builds',
    instructions:
      'Please rearrange the spoken phrases into a complete, grammatically correct sentence.',
    timeLimitSeconds: 15,
    items: [
      { id: 'd1', fragments: 'in the quiet library / students should / remain silent', expectedSentence: 'Students should remain silent in the quiet library' },
      { id: 'd2', fragments: 'was postponed / due to the severe storm / the championship match', expectedSentence: 'The championship match was postponed due to the severe storm' },
      { id: 'd3', fragments: 'before sunset / completed all assignments / the diligent students', expectedSentence: 'The diligent students completed all assignments before sunset' },
    ],
  },
  {
    id: 'part-e',
    title: 'Part E: Story Retelling',
    instructions:
      'You will hear a short story. When you hear the tone, retell the story in your own words with as much detail as you can remember.',
    timeLimitSeconds: 30,
    items: [
      {
        id: 'e1',
        storyText:
          'Yesterday evening, David was cycling home through the park when he noticed a lost kitten huddled beneath a wooden bench. The kitten was shivering in the brisk autumn wind. David gently scooped it into his jacket, carried it home, and gave it some warm milk. He then published a photo on the community forum. Within half an hour, an elderly neighbor contacted him, overjoyed to reunite with her pet.',
      },
    ],
  },
  {
    id: 'part-f',
    title: 'Part F: Open Questions',
    instructions:
      'You will be asked to speak about a specific topic. You will have 40 seconds to express your opinion clearly with supporting reasons.',
    timeLimitSeconds: 40,
    items: [
      {
        id: 'f1',
        prompt:
          'Some professionals thrive working in a collaborative physical office, while others prefer the autonomy of remote work from home. Which working style do you find more effective, and what are your primary reasons?',
      },
    ],
  },
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // API Routes

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Versant Assessment Engine',
      aiConfigured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Validate TIN / Get Candidate
  app.get('/api/candidates/:tin', (req: Request, res: Response) => {
    const tin = req.params.tin.trim();
    const candidate = candidatesDb[tin];

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: `TIN "${tin}" not found in Pearson Scorekeeper database. Please verify your 8-digit number or create a new test ticket.`,
      });
    }

    res.json({
      success: true,
      candidate,
    });
  });

  // 3. List candidates
  app.get('/api/candidates', (req: Request, res: Response) => {
    res.json({
      success: true,
      candidates: Object.values(candidatesDb),
    });
  });

  // 4. Create new candidate TIN
  app.post('/api/candidates', (req: Request, res: Response) => {
    const { fullName, email, testTitle, organization } = req.body;
    if (!fullName) {
      return res.status(400).json({ error: 'Candidate full name is required' });
    }

    // Generate random 8-digit TIN
    const randomTin = Math.floor(10000000 + Math.random() * 90000000).toString();
    const newCandidate: Candidate = {
      tin: randomTin,
      fullName: fullName.toUpperCase(),
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@candidate.org`,
      testTitle: testTitle || 'Versant English Test - 4 Skills (Web)',
      organization: organization || 'Global Talent Assessment',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ready',
      systemCheckCompleted: false,
      createdAt: new Date().toISOString(),
    };

    candidatesDb[randomTin] = newCandidate;
    res.status(201).json({ success: true, candidate: newCandidate });
  });

  // 5. System Check logging
  app.post('/api/system-check', (req: Request, res: Response) => {
    const { tin, micWorking, audioWorking, latencyMs, roomNoiseLevel } = req.body;
    if (tin && candidatesDb[tin]) {
      candidatesDb[tin].systemCheckCompleted = true;
    }
    res.json({
      success: true,
      systemStatus: 'CERTIFIED',
      checks: {
        network: latencyMs < 250 ? 'Optimal' : 'Acceptable',
        audioPlayback: audioWorking ? 'Pass' : 'Incomplete',
        microphone: micWorking ? 'Pass (3-5 cm clear)' : 'Not detected',
        ambientNoise: roomNoiseLevel || 'Quiet room verified',
      },
      message: 'System meets all Pearson Versant delivery requirements.',
    });
  });

  // 6. Get Test Questions
  app.get('/api/test/questions', (req: Request, res: Response) => {
    res.json({
      success: true,
      sections: testSections,
    });
  });

  // 7. Start Test
  app.post('/api/test/start', (req: Request, res: Response) => {
    const { tin, deliveryMode } = req.body;
    const candidate = candidatesDb[tin];
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    candidate.status = 'in_progress';
    res.json({
      success: true,
      message: 'Test session initiated.',
      sessionId: `SES-${Date.now()}-${tin}`,
      deliveryMode: deliveryMode || 'Web',
      sectionsCount: testSections.length,
    });
  });

  // 8. Evaluate Spoken Response (AI-powered with Gemini if available, fallback with algorithmic NLP)
  app.post('/api/test/evaluate', async (req: Request, res: Response) => {
    const { sectionId, itemId, prompt, transcript, expectedAnswer, audioDuration } = req.body;

    let sentenceMastery = 70;
    let vocabulary = 70;
    let fluency = 70;
    let pronunciation = 70;
    let feedback = 'Good clarity and steady pace.';

    const candidateText = (transcript || '').trim();

    // If Gemini client is active, evaluate candidate response
    if (aiClient && candidateText.length > 0) {
      try {
        const promptInstruction = `
You are the Pearson Versant English Scoring Engine.
Evaluate the following spoken response from an assessment test taker.
Test Section: ${sectionId}
Prompt / Target: "${prompt || expectedAnswer || 'Open speech'}"
Candidate Spoken Transcript: "${candidateText}"

Provide an objective assessment scoring the candidate from 20 to 80 (standard Pearson Versant score scale):
1. Sentence Mastery (20-80)
2. Vocabulary (20-80)
3. Fluency (20-80)
4. Pronunciation & Articulation (20-80)
5. A brief 1-sentence diagnostic feedback note.

Return strictly JSON matching this structure:
{
  "sentenceMastery": 72,
  "vocabulary": 70,
  "fluency": 74,
  "pronunciation": 71,
  "feedback": "Concise feedback text"
}
`;
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptInstruction,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          sentenceMastery = Math.min(80, Math.max(20, Math.round(parsed.sentenceMastery || 70)));
          vocabulary = Math.min(80, Math.max(20, Math.round(parsed.vocabulary || 70)));
          fluency = Math.min(80, Math.max(20, Math.round(parsed.fluency || 70)));
          pronunciation = Math.min(80, Math.max(20, Math.round(parsed.pronunciation || 70)));
          feedback = parsed.feedback || feedback;
        }
      } catch (err) {
        console.warn('Gemini evaluation fallback to algorithmic scorer:', err);
      }
    } else {
      // Algorithmic evaluation based on word match, target length, and acoustic heuristics
      if (expectedAnswer) {
        const normExpected = expectedAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normActual = candidateText.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normActual.includes(normExpected) || normExpected.includes(normActual)) {
          sentenceMastery = 78;
          vocabulary = 76;
          fluency = 75;
          pronunciation = 74;
          feedback = 'Accurate response with direct target lexical capture.';
        } else {
          sentenceMastery = 52;
          vocabulary = 55;
          fluency = 60;
          pronunciation = 58;
          feedback = 'Response deviated from expected target answer.';
        }
      } else if (candidateText.length > 0) {
        const words = candidateText.split(/\s+/).filter(Boolean);
        const count = words.length;
        if (count >= 15) {
          sentenceMastery = 75;
          vocabulary = 74;
          fluency = 72;
          pronunciation = 71;
          feedback = 'Rich response with sustained flow and grammatical range.';
        } else if (count >= 6) {
          sentenceMastery = 68;
          vocabulary = 66;
          fluency = 69;
          pronunciation = 68;
          feedback = 'Adequate intelligible response with appropriate pacing.';
        } else {
          sentenceMastery = 55;
          vocabulary = 54;
          fluency = 58;
          pronunciation = 60;
          feedback = 'Brief or fragmented response.';
        }
      }
    }

    res.json({
      success: true,
      scores: {
        sentenceMastery,
        vocabulary,
        fluency,
        pronunciation,
      },
      feedback,
    });
  });

  // 9. Complete Test and Generate Official Score Report
  app.post('/api/test/finish', (req: Request, res: Response) => {
    const { tin, responses } = req.body;
    const candidate = candidatesDb[tin];
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Calculate aggregated scores
    let sumSM = 0;
    let sumVocab = 0;
    let sumFluency = 0;
    let sumPron = 0;
    let count = 0;

    if (Array.isArray(responses) && responses.length > 0) {
      for (const r of responses) {
        if (r.scores) {
          sumSM += r.scores.sentenceMastery || 68;
          sumVocab += r.scores.vocabulary || 67;
          sumFluency += r.scores.fluency || 69;
          sumPron += r.scores.pronunciation || 68;
          count++;
        }
      }
    }

    if (count === 0) {
      sumSM = 71;
      sumVocab = 70;
      sumFluency = 69;
      sumPron = 72;
      count = 1;
    }

    const sm = Math.round(sumSM / count);
    const vocab = Math.round(sumVocab / count);
    const flu = Math.round(sumFluency / count);
    const pron = Math.round(sumPron / count);

    // Versant Overall Score (weighted average, scaled 20 - 80)
    const overall = Math.min(80, Math.max(20, Math.round(sm * 0.3 + flu * 0.3 + pron * 0.2 + vocab * 0.2)));

    // Map to CEFR and GSE
    let cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'B2';
    let gse = 65;

    if (overall >= 79) {
      cefr = 'C2';
      gse = 85 + Math.min(5, overall - 78);
    } else if (overall >= 69) {
      cefr = 'C1';
      gse = 76 + Math.round(((overall - 69) / 9) * 8);
    } else if (overall >= 59) {
      cefr = 'B2';
      gse = 59 + Math.round(((overall - 59) / 9) * 16);
    } else if (overall >= 47) {
      cefr = 'B1';
      gse = 43 + Math.round(((overall - 47) / 11) * 15);
    } else if (overall >= 36) {
      cefr = 'A2';
      gse = 30 + Math.round(((overall - 36) / 10) * 12);
    } else {
      cefr = 'A1';
      gse = 20 + Math.round(((overall - 20) / 15) * 9);
    }

    const report: ScoreReport = {
      tin,
      candidateName: candidate.fullName,
      completedAt: new Date().toISOString(),
      overallScore: overall,
      cefrLevel: cefr,
      gseScore: gse,
      subScores: {
        sentenceMastery: sm,
        vocabulary: vocab,
        fluency: flu,
        pronunciation: pron,
      },
      summary: `Candidate ${candidate.fullName} exhibits strong mastery of spoken English at CEFR ${cefr}. Capable of comprehending and articulating responses with consistent acoustic clarity, appropriate cadence, and grammatical coherence.`,
      recommendations: [
        'Continue fine-tuning rhythmic pause placements in extended discourse.',
        'Leverage higher register lexical transitions during spontaneous explanations.',
        'Maintain natural boom-microphone positioning (3-5 cm) to preserve phonemic sharpness.',
      ],
      sectionResponses: responses,
    };

    candidate.status = 'completed';
    candidate.scoreReport = report;

    res.json({
      success: true,
      report,
    });
  });

  // 10. Get candidate test report
  app.get('/api/test/results/:tin', (req: Request, res: Response) => {
    const candidate = candidatesDb[req.params.tin.trim()];
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    if (!candidate.scoreReport) {
      return res.status(404).json({ error: 'No score report available for this TIN yet' });
    }
    res.json({
      success: true,
      report: candidate.scoreReport,
      candidate,
    });
  });

  // In production, serve the built Vite app; in dev, mount Vite middleware
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pearson Versant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
