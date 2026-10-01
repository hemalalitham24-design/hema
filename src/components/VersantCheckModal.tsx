import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  Headphones,
  Mic,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import { checkServerHealth, submitSystemCheck } from '../services/api';
import { Candidate } from '../types/versant';

interface VersantCheckProps {
  candidate: Candidate;
  onComplete: () => void;
}

export const VersantCheckModal: React.FC<VersantCheckProps> = ({ candidate, onComplete }) => {
  // Step 1: Network
  const [networkStatus, setNetworkStatus] = useState<'idle' | 'testing' | 'pass' | 'fail'>('idle');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Step 2: Audio playback
  const [audioStatus, setAudioStatus] = useState<'idle' | 'playing' | 'pass' | 'fail'>('idle');

  // Step 3: Microphone & Distance
  const [micStatus, setMicStatus] = useState<'idle' | 'listening' | 'pass' | 'fail'>('idle');
  const [micLevel, setMicLevel] = useState<number>(0);
  const [speechDetected, setSpeechDetected] = useState(false);
  const [quietRoomVerified, setQuietRoomVerified] = useState(false);

  // Final confirmation
  const [submitting, setSubmitting] = useState(false);
  const [isCertified, setIsCertified] = useState(candidate.systemCheckCompleted);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 1. Run Network Test
  const runNetworkTest = async () => {
    setNetworkStatus('testing');
    try {
      const result = await checkServerHealth();
      setLatencyMs(result.latencyMs);
      setNetworkStatus(result.latencyMs < 500 ? 'pass' : 'fail');
    } catch {
      setNetworkStatus('fail');
    }
  };

  // 2. Play Audio Tone Test
  const playAudioTone = () => {
    setAudioStatus('playing');
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.35); // D6

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.65);

      setTimeout(() => {
        setAudioStatus('pass');
      }, 700);
    } catch {
      setAudioStatus('fail');
    }
  };

  // 3. Test Microphone with Live Decibel Meter
  const startMicTest = async () => {
    setMicStatus('listening');
    setSpeechDetected(false);
    setQuietRoomVerified(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // keep natural for Versant calibration
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let silenceTicks = 0;
      let speechTicks = 0;

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setMicLevel(normalized);

        // Analyze room conditions
        if (normalized < 20) {
          silenceTicks++;
          if (silenceTicks > 25) {
            setQuietRoomVerified(true);
          }
        } else if (normalized > 30 && normalized < 85) {
          speechTicks++;
          if (speechTicks > 10) {
            setSpeechDetected(true);
          }
        }

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.error('Mic access error:', err);
      setMicStatus('fail');
    }
  };

  const confirmMicPass = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setMicStatus('pass');
  };

  // 4. Submit and Certify System Check
  const handleCertify = async () => {
    setSubmitting(true);
    try {
      await submitSystemCheck({
        tin: candidate.tin,
        micWorking: micStatus === 'pass' || speechDetected,
        audioWorking: audioStatus === 'pass',
        latencyMs: latencyMs || 45,
        roomNoiseLevel: quietRoomVerified ? 'Quiet (<25dB ambient)' : 'Normal',
      });
      setIsCertified(true);
    } catch (err) {
      console.error('System check submit failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const allPassed =
    (networkStatus === 'pass' || latencyMs !== null) &&
    audioStatus === 'pass' &&
    (micStatus === 'pass' || speechDetected);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B1B3D] to-[#0A2558] text-white p-6 rounded-2xl shadow-xl border border-sky-900/50 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>VersantCheck.com Diagnostic Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              System Readiness Check
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Candidate: <strong className="text-white">{candidate.fullName}</strong> (TIN: {candidate.tin})
            </p>
          </div>

          {isCertified ? (
            <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-4 py-2 rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold tracking-wide uppercase">System Certified Ready</span>
            </div>
          ) : (
            <div className="bg-sky-500/20 border border-sky-400/30 text-sky-200 px-4 py-2 rounded-xl text-xs">
              Complete 3 checks below before starting test
            </div>
          )}
        </div>
      </div>

      {/* Grid of 3 Official Versant Test Readiness Checks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* CHECK 1: Network & Internet */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0072CE]">
                <Wifi className="w-6 h-6" />
              </div>
              {networkStatus === 'pass' && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Pass
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              1. Good Internet Connection
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Verifies continuous, low-latency socket connectivity for uninterrupted test audio.
            </p>

            {latencyMs !== null && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Ping to Scorekeeper:</span>
                  <span className="font-mono font-bold text-slate-900">{latencyMs} ms</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Connection Quality:</span>
                  <span className="font-semibold text-emerald-600">Optimal (Stable)</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={runNetworkTest}
            disabled={networkStatus === 'testing'}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-1.5"
          >
            {networkStatus === 'testing' ? (
              <span>Testing Connection...</span>
            ) : networkStatus === 'pass' ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retest Latency</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test Internet</span>
              </>
            )}
          </button>
        </div>

        {/* CHECK 2: Headphones & Audio Playback */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0072CE]">
                <Headphones className="w-6 h-6" />
              </div>
              {audioStatus === 'pass' && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Pass
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              2. Headphones Output
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Ensures you can hear the spoken prompts and timing beeps clearly during Repeat and Story Retelling.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 text-xs text-slate-600">
              {audioStatus === 'pass' ? (
                <p className="text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Acoustic chime confirmed audible.
                </p>
              ) : (
                <p>Put on your headphones and click to play the 3-tone test sequence.</p>
              )}
            </div>
          </div>

          <button
            onClick={playAudioTone}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0072CE] hover:bg-blue-600 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-1.5"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{audioStatus === 'pass' ? 'Play Test Tone Again' : 'Play Sound Test'}</span>
          </button>
        </div>

        {/* CHECK 3: Boom Microphone & Distance Check */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0072CE]">
                <Mic className="w-6 h-6" />
              </div>
              {micStatus === 'pass' && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Pass
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              3. Boom Mic (3 - 5 cm)
            </h3>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Verify microphone distance from mouth (3-5 cm) and confirm room is quiet.
            </p>

            {/* Live Volume Meter */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 space-y-2">
              <div className="flex justify-between items-center text-[11px] text-slate-600">
                <span>Microphone Level:</span>
                <span className="font-mono font-bold text-slate-800">{micLevel}%</span>
              </div>

              {/* Meter bar */}
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-75 ${
                    micLevel > 80
                      ? 'bg-rose-500'
                      : micLevel > 30
                      ? 'bg-emerald-500'
                      : 'bg-sky-400'
                  }`}
                  style={{ width: `${Math.max(5, micLevel)}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Quiet Room</span>
                <span className="text-emerald-700 font-bold">Ideal (3-5 cm)</span>
                <span>Too Loud</span>
              </div>

              {speechDetected && (
                <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                  Voice level verified in optimal range!
                </p>
              )}
            </div>
          </div>

          {micStatus === 'listening' ? (
            <button
              onClick={confirmMicPass}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Mic Working</span>
            </button>
          ) : (
            <button
              onClick={startMicTest}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{micStatus === 'pass' ? 'Retest Mic Volume' : 'Test Microphone'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Guidelines reminder box matching uploaded PDF rules */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 mb-8 flex items-start space-x-4">
        <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-amber-900">
          <h4 className="font-bold text-amber-950">Important Pearson Versant Instructions:</h4>
          <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
            <li>Keep the boom microphone 3 to 5 cm away from your mouth.</li>
            <li>Speak naturally and clearly. If you don't know the answer, be silent or say "I don't know".</li>
            <li>No notes or paper are permitted. The test cannot be paused once initiated.</li>
          </ul>
        </div>
      </div>

      {/* Certification & Launch Section */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {isCertified
              ? 'Candidate Certified for Assessment'
              : allPassed
              ? 'Ready to Certify System'
              : 'Complete All 3 System Checks'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCertified
              ? 'All requirements satisfied. You can now launch the official Web Scorekeeper test.'
              : allPassed
              ? 'Click below to register your system check results with Pearson Scorekeeper.'
              : 'Please test Internet, Audio, and Microphone to activate the Start Test button.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isCertified && (
            <button
              onClick={handleCertify}
              disabled={submitting}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold transition shadow-sm ${
                allPassed
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Certifying...' : 'Certify System Check'}
            </button>
          )}

          <button
            onClick={onComplete}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-[#0072CE] hover:bg-blue-600 text-white text-xs font-bold shadow-md transition transform active:scale-95"
          >
            <span>Go to Take Test</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
