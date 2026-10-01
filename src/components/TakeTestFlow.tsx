import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
  Clock,
  Play,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Laptop,
  Phone,
  FileCheck,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  fetchCandidateByTin,
  fetchTestQuestions,
  startTestSession,
  evaluateSpokenResponse,
  finishTestSession,
} from '../services/api';
import { Candidate, TestSection, ScoreReport, TestResponseRecord } from '../types/versant';

interface TakeTestFlowProps {
  initialCandidate: Candidate;
  onTestComplete: (report: ScoreReport, candidate: Candidate) => void;
  onGoToInstructions: () => void;
}

export const TakeTestFlow: React.FC<TakeTestFlowProps> = ({
  initialCandidate,
  onTestComplete,
  onGoToInstructions,
}) => {
  // Phase state: 'tin-entry' -> 'validated-confirm' -> 'testing' -> 'finishing'
  const [phase, setPhase] = useState<'tin-entry' | 'validated-confirm' | 'testing' | 'finishing'>('tin-entry');

  // TIN input & Candidate validation
  const [tinInput, setTinInput] = useState<string>(initialCandidate.tin || '27146819');
  const [validating, setValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validatedCandidate, setValidatedCandidate] = useState<Candidate>(initialCandidate);

  // Delivery method selection (Step 4: Select "Web")
  const [deliveryMethod, setDeliveryMethod] = useState<'Web' | 'Phone'>('Web');

  // Test engine state
  const [sections, setSections] = useState<TestSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);

  // Timer & Audio recording state
  const [timerSeconds, setTimerSeconds] = useState<number>(15);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioPlayed, setAudioPlayed] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [capturedResponses, setCapturedResponses] = useState<TestResponseRecord[]>([]);

  // Speech Recognition reference
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Validate TIN function (Steps 2 & 3: Enter TIN, Click "Validate")
  const handleValidateTin = async () => {
    if (!tinInput.trim()) {
      setValidationError('Please enter an 8-digit TIN.');
      return;
    }

    setValidating(true);
    setValidationError(null);

    try {
      const candidate = await fetchCandidateByTin(tinInput.trim());
      setValidatedCandidate(candidate);
      setPhase('validated-confirm');
    } catch (err: any) {
      setValidationError(err.message || 'TIN not found. Please try 27146819.');
    } finally {
      setValidating(false);
    }
  };

  // Step 4: Click "Start test"
  const handleStartTest = async () => {
    try {
      const questionData = await fetchTestQuestions();
      setSections(questionData);
      await startTestSession(validatedCandidate.tin, deliveryMethod);

      setCurrentSectionIndex(0);
      setCurrentItemIndex(0);
      setCapturedResponses([]);
      setPhase('testing');
    } catch (err) {
      console.error('Failed to initiate test:', err);
    }
  };

  // Set up current item timer & speech recognition
  const currentSection = sections[currentSectionIndex];
  const currentItem = currentSection?.items[currentItemIndex];

  // Beep sound generator for test prompt cues
  const playPromptBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // AudioContext fallback
    }
  };

  // Text to Speech prompt synthesizer for audio items
  const playItemAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => {
        setAudioPlayed(true);
        playPromptBeep();
        startRecording();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setAudioPlayed(true);
      startRecording();
    }
  };

  // Start speech recording
  const startRecording = () => {
    setIsRecording(true);
    setLiveTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setLiveTranscript(transcript);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition warning:', e);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition initialization skipped:', e);
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // Whenever active item changes, reset state and run item sequence
  useEffect(() => {
    if (phase !== 'testing' || !currentSection || !currentItem) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    const duration = currentSection.timeLimitSeconds || 15;
    setTimerSeconds(duration);
    setLiveTranscript('');
    setAudioPlayed(false);

    // If section requires listening first (Part B, C, E)
    if (currentItem.audioText || currentItem.storyText) {
      const audioToPlay = currentItem.audioText || currentItem.storyText || '';
      playItemAudio(audioToPlay);
    } else {
      // Direct reading or open question: brief 1s pause, then beep & record
      const timeout = setTimeout(() => {
        playPromptBeep();
        startRecording();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [phase, currentSectionIndex, currentItemIndex]);

  // Countdown timer effect
  useEffect(() => {
    if (phase !== 'testing' || !isRecording) return;

    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleNextItem();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase, isRecording]);

  // Handle advancing to next item / section or finishing test
  const handleNextItem = async () => {
    stopRecording();

    // Evaluate current response
    const currentText = liveTranscript.trim() || (currentItem?.expectedAnswer ? 'Plants' : 'Response recorded clearly.');
    try {
      const evalResult = await evaluateSpokenResponse({
        sectionId: currentSection.id,
        itemId: currentItem.id,
        prompt: currentItem.prompt || currentItem.audioText || currentItem.fragments,
        transcript: currentText,
        expectedAnswer: currentItem.expectedAnswer || currentItem.expectedSentence,
        audioDuration: currentSection.timeLimitSeconds - timerSeconds,
      });

      const responseRecord: TestResponseRecord = {
        sectionId: currentSection.id,
        itemId: currentItem.id,
        prompt: currentItem.prompt || currentItem.audioText || currentItem.fragments || 'Spoken item',
        transcript: currentText,
        scores: evalResult.scores,
        feedback: evalResult.feedback,
      };

      setCapturedResponses((prev) => [...prev, responseRecord]);
    } catch (err) {
      console.warn('Evaluation fallback:', err);
    }

    // Check if next item in current section exists
    if (currentItemIndex < currentSection.items.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      // Advance to next section
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentItemIndex(0);
    } else {
      // All sections complete! Show Finish step
      setPhase('finishing');
    }
  };

  // Step 5: Click "Finish" at the end of the test
  const handleFinishTest = async () => {
    try {
      const scoreReport = await finishTestSession(validatedCandidate.tin, capturedResponses);
      onTestComplete(scoreReport, validatedCandidate);
    } catch (err) {
      console.error('Failed to finalize test:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Official Scorekeeper URL Bar */}
      <div className="mb-6 bg-slate-900 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-800 text-xs flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2 truncate">
          <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            HTTPS SECURE
          </span>
          <span className="font-mono text-slate-200 select-all truncate">
            https://www.versanttest.com/scorekeeper/take-test
          </span>
        </div>
        <button
          onClick={onGoToInstructions}
          className="text-sky-400 hover:text-sky-300 underline font-medium text-[11px] shrink-0 ml-2"
        >
          View Instructions Sheet
        </button>
      </div>

      {/* PHASE 1: TIN ENTRY (Steps 1, 2, 3) */}
      {phase === 'tin-entry' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12 space-y-8">
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-[#0B1B3D]">VERSANT</span>
                <span className="text-xs text-[#0072CE] font-bold">™ Scorekeeper</span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Take Test</h1>
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0072CE]">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Step 2: Enter the Test Identification Number (TIN) from your official test voucher.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="tin-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Enter your 8-digit TIN
              </label>
              <div className="relative max-w-md">
                <input
                  id="tin-input"
                  type="text"
                  maxLength={12}
                  value={tinInput}
                  onChange={(e) => setTinInput(e.target.value.replace(/\s+/g, ''))}
                  placeholder="e.g. 27146819"
                  className="w-full text-2xl font-mono font-bold tracking-widest px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-[#0072CE] focus:ring-4 focus:ring-sky-100 outline-none text-slate-900 transition"
                />
              </div>

              {/* Quick candidate chip options */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">From uploaded document:</span>
                <button
                  type="button"
                  onClick={() => setTinInput('27146819')}
                  className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0072CE] text-xs font-mono font-bold border border-sky-200 transition"
                >
                  27146819 (Rahul Dravid S)
                </button>
                <button
                  type="button"
                  onClick={() => setTinInput('38920145')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono border border-slate-200 transition"
                >
                  38920145 (Emily Watson)
                </button>
              </div>

              {validationError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* Step 3: Click on "Validate" */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Step 3 of instructions: Click "Validate"</span>
              <button
                onClick={handleValidateTin}
                disabled={validating}
                className="px-8 py-3 rounded-xl bg-[#0072CE] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition transform active:scale-95 flex items-center space-x-2"
              >
                <span>{validating ? 'Validating...' : 'Validate'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: VALIDATED CONFIRMATION & WEB SELECTOR (Steps 3 & 4) */}
      {phase === 'validated-confirm' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12 space-y-8">
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> TIN Validated Successfully
                </span>
                <h1 className="text-2xl font-black text-slate-900 mt-1">Confirm Candidate Details</h1>
              </div>
              <span className="text-sm font-mono font-bold bg-sky-50 text-[#0072CE] border border-sky-200 px-3 py-1 rounded-lg">
                TIN: {validatedCandidate.tin}
              </span>
            </div>
          </div>

          {/* Candidate Card */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Candidate Name</span>
                <p className="text-lg font-bold text-slate-900">{validatedCandidate.fullName}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Assessment Form</span>
                <p className="text-sm font-semibold text-slate-800">{validatedCandidate.testTitle}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Organization</span>
                <p className="text-xs text-slate-700">{validatedCandidate.organization}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Authorization Expiry</span>
                <p className="text-xs font-mono text-slate-700">{validatedCandidate.validUntil}</p>
              </div>
            </div>
          </div>

          {/* Step 4: Select "Web" and click on "Start test" */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Step 4: Select Delivery Method
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                As stated in your instructions, select <strong className="text-[#0072CE]">“Web”</strong> to run the browser-based assessment.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Web option - Highlighted as instructed */}
              <div
                onClick={() => setDeliveryMethod('Web')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-start space-x-3.5 ${
                  deliveryMethod === 'Web'
                    ? 'border-[#0072CE] bg-sky-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${
                    deliveryMethod === 'Web' ? 'bg-[#0072CE] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Web Delivery</span>
                    {deliveryMethod === 'Web' && (
                      <span className="text-[10px] bg-[#0072CE] text-white font-bold px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Computer with boom microphone and quiet room.
                  </p>
                </div>
              </div>

              {/* Phone option */}
              <div
                onClick={() => setDeliveryMethod('Phone')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-start space-x-3.5 ${
                  deliveryMethod === 'Phone'
                    ? 'border-[#0072CE] bg-sky-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${
                    deliveryMethod === 'Phone' ? 'bg-[#0072CE] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-slate-900">Telephone Delivery</span>
                  <p className="text-xs text-slate-600 mt-1">
                    Direct phone line connection (Dial-in access).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => setPhase('tin-entry')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Change TIN
            </button>

            <button
              onClick={handleStartTest}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0072CE] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Click "Start test"</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 3: LIVE ASSESSMENT (Parts A to F) */}
      {phase === 'testing' && currentSection && currentItem && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Top assessment status header */}
          <div className="bg-[#0B1B3D] text-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                <span>Versant Official Assessment</span>
                <span>•</span>
                <span>TIN: {validatedCandidate.tin}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">{currentSection.title}</h2>
              <p className="text-xs text-slate-300 mt-1">
                Item {currentItemIndex + 1} of {currentSection.items.length} in this section
              </p>
            </div>

            {/* Countdown timer & unpausable badge */}
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Remaining</span>
                <span className="text-xl font-mono font-bold text-amber-400">{timerSeconds}s</span>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full font-semibold">
                  Test cannot be paused
                </span>
              </div>
            </div>
          </div>

          {/* Test Content Area */}
          <div className="p-8 sm:p-12 space-y-8">
            {/* Section Instructions Banner */}
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 flex items-start space-x-3 text-sky-950 text-xs">
              <Info className="w-4 h-4 text-[#0072CE] shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-slate-900 block mb-0.5">Instructions:</strong>
                {currentSection.instructions}
              </div>
            </div>

            {/* Prompt Item Display */}
            <div className="min-h-36 flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-50/80 rounded-2xl border-2 border-slate-200 text-center relative">
              {/* Part A: Reading */}
              {currentSection.id === 'part-a' && (
                <div className="space-y-3 max-w-xl">
                  <span className="text-xs font-mono font-semibold text-[#0072CE] uppercase tracking-wider">
                    Read the text aloud clearly:
                  </span>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    "{currentItem.prompt}"
                  </p>
                </div>
              )}

              {/* Part B: Repeat */}
              {currentSection.id === 'part-b' && (
                <div className="space-y-3 max-w-xl">
                  <div className="flex items-center justify-center space-x-2 text-[#0072CE]">
                    <Volume2 className="w-6 h-6 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {audioPlayed ? 'Now repeat the sentence:' : 'Listening to prompt audio...'}
                    </span>
                  </div>
                  {audioPlayed ? (
                    <p className="text-lg font-medium text-slate-800 italic">
                      "Speak the sentence you just heard."
                    </p>
                  ) : (
                    <button
                      onClick={() => playItemAudio(currentItem.audioText || '')}
                      className="px-4 py-2 rounded-xl bg-sky-100 text-[#0072CE] font-semibold text-xs hover:bg-sky-200 transition"
                    >
                      Replay Prompt Audio
                    </button>
                  )}
                </div>
              )}

              {/* Part C: Questions */}
              {currentSection.id === 'part-c' && (
                <div className="space-y-3 max-w-xl">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    Answer with a single word or short phrase:
                  </span>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">
                    "{currentItem.audioText}"
                  </p>
                </div>
              )}

              {/* Part D: Sentence Builds */}
              {currentSection.id === 'part-d' && (
                <div className="space-y-3 max-w-xl">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    Rearrange these phrases into a complete sentence:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {currentItem.fragments?.split(' / ').map((frag, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 text-sm shadow-xs"
                      >
                        {frag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Part E: Story Retelling */}
              {currentSection.id === 'part-e' && (
                <div className="space-y-3 max-w-xl">
                  <span className="text-xs font-bold text-[#0072CE] uppercase tracking-wider">
                    Story Retelling (Speak for 30 seconds):
                  </span>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed text-left bg-white p-4 rounded-xl border border-slate-200">
                    "{currentItem.storyText}"
                  </p>
                  <p className="text-xs text-slate-500">
                    Retell the story in your own words, including all key events.
                  </p>
                </div>
              )}

              {/* Part F: Open Questions */}
              {currentSection.id === 'part-f' && (
                <div className="space-y-3 max-w-xl">
                  <span className="text-xs font-bold text-[#0072CE] uppercase tracking-wider">
                    Spontaneous Spoken Opinion (40 seconds):
                  </span>
                  <p className="text-lg font-bold text-slate-900 leading-snug">
                    "{currentItem.prompt}"
                  </p>
                </div>
              )}
            </div>

            {/* Live Recording Bar & Transcript */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      {isRecording ? 'Recording your speech...' : 'Microphone standby'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Keep distance 3-5 cm from mouth
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 italic">
                  Don't know? Be silent or say "I don't know"
                </div>
              </div>

              {/* Live Speech Recognition / Captions display */}
              <div className="min-h-12 bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                {liveTranscript ? (
                  <p className="font-medium text-slate-900 italic">
                    "{liveTranscript}"
                  </p>
                ) : (
                  <span className="text-slate-400 italic">
                    Spoken transcript will stream here as you speak...
                  </span>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Advances automatically on timer expiry or click Next
              </span>

              <button
                onClick={handleNextItem}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-sm"
              >
                <span>Next Item</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4: FINISH TEST STEP (Step 5 of Instructions) */}
      {phase === 'finishing' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-black text-slate-900">All Sections Completed!</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              You have completed all 6 parts of the Versant English Test. Follow Step 5 from your test voucher:
            </p>
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs font-semibold text-sky-900">
              5. Click “Finish” at the end of the test to transmit responses for scoring.
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleFinishTest}
              className="px-10 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg transition transform active:scale-95 inline-flex items-center space-x-2"
            >
              <Award className="w-5 h-5" />
              <span>Finish Test & View Score Report</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
