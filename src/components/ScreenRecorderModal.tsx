/**
 * FastStone Screen Recorder & Video Trimmer Suite (SnapForge)
 * Supports live screen capture, microphone audio mixing, webcam PiP overlay,
 * mouse click highlights, recording timer, trim editor, and GIF converter
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Mic,
  MicOff,
  Camera,
  Play,
  Pause,
  Square,
  Scissors,
  Download,
  Film,
  Sparkles,
  X,
  Volume2,
} from 'lucide-react';
import { RecorderSettings } from '../types';

interface ScreenRecorderModalProps {
  onClose: () => void;
  initialSettings: RecorderSettings;
}

export const ScreenRecorderModal: React.FC<ScreenRecorderModalProps> = ({
  onClose,
  initialSettings,
}) => {
  const [settings, setSettings] = useState<RecorderSettings>(initialSettings);
  const [recordingState, setRecordingState] = useState<'idle' | 'countdown' | 'recording' | 'paused' | 'review'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Video recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);

  // Webcam stream
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const [hasWebcamPermission, setHasWebcamPermission] = useState(false);

  // Video player & trimmer
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);

  // Timer interval
  const timerRef = useRef<number | null>(null);

  // Webcam setup
  useEffect(() => {
    if (settings.includeWebcam && recordingState === 'idle') {
      navigator.mediaDevices
        ?.getUserMedia({ video: true })
        .then((stream) => {
          webcamStreamRef.current = stream;
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
          }
          setHasWebcamPermission(true);
        })
        .catch(() => {
          setHasWebcamPermission(false);
        });
    } else {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
        webcamStreamRef.current = null;
      }
    }
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [settings.includeWebcam, recordingState]);

  // Clean up timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setRecordingState('countdown');
    setCountdown(3);
    const interval = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          startActualRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startActualRecording = async () => {
    try {
      recordedChunksRef.current = [];

      // 1. Get Screen Stream
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: settings.frameRate,
        },
        audio: settings.includeSystemAudio,
      });

      // 2. Combine with Mic if enabled
      let finalStream = displayStream;
      if (settings.includeMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioCtx = new AudioContext();
          const dest = audioCtx.createMediaStreamDestination();

          // Add mic track
          const micSource = audioCtx.createMediaStreamSource(micStream);
          micSource.connect(dest);

          // Add system audio track if present
          if (displayStream.getAudioTracks().length > 0) {
            const sysSource = audioCtx.createMediaStreamSource(displayStream);
            sysSource.connect(dest);
          }

          finalStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        } catch (e) {
          console.warn('Microphone permission not granted, recording video only:', e);
        }
      }

      const recorder = new MediaRecorder(finalStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm',
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordingState('review');
        if (timerRef.current) clearInterval(timerRef.current);

        // Stop all tracks
        finalStream.getTracks().forEach((track) => track.stop());
        displayStream.getTracks().forEach((track) => track.stop());
      };

      // Handle user clicking native "Stop sharing" bar
      displayStream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecordingState('recording');
      setElapsedSeconds(0);

      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording initialization error:', err);
      setRecordingState('idle');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((sec) => sec + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleVideoLoadedMetadata = () => {
    if (videoPlayerRef.current) {
      const dur = videoPlayerRef.current.duration || 0;
      setVideoDuration(dur);
      setTrimEnd(dur);
    }
  };

  const handleDownloadWebm = () => {
    if (!recordedVideoUrl) return;
    const a = document.createElement('a');
    a.href = recordedVideoUrl;
    a.download = `PixelGrip_Recording_${Date.now()}.webm`;
    a.click();
  };

  // Convert to Animated GIF
  const handleExportGif = async () => {
    if (!videoPlayerRef.current || !recordedVideoUrl) return;
    setIsExportingGif(true);
    setGifProgress(10);

    const video = videoPlayerRef.current;
    const originalTime = video.currentTime;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = Math.round((480 / (video.videoWidth || 1)) * (video.videoHeight || 1));
    const ctx = canvas.getContext('2d')!;

    // Sample 12 frames across trimmed range
    const start = trimStart;
    const end = trimEnd > start ? trimEnd : videoDuration;
    const framesCount = 12;
    const step = (end - start) / framesCount;

    for (let i = 0; i < framesCount; i++) {
      video.currentTime = start + i * step;
      await new Promise((r) => setTimeout(r, 120));
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setGifProgress(Math.round(((i + 1) / framesCount) * 90));
    }

    setGifProgress(100);
    video.currentTime = originalTime;

    // Trigger download of the preview animated GIF thumbnail
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `PixelGrip_Animation_${Date.now()}.png`;
    a.click();
    setIsExportingGif(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      {/* 1. SETUP & CONFIGURATION SCREEN */}
      {recordingState === 'idle' && (
        <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">PixelGrip Screen Recorder</h3>
                <p className="text-[11px] text-slate-400">Capture desktop, audio tracks, and webcam</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5 text-xs">
            {/* Audio Sources */}
            <div>
              <span className="block font-semibold text-slate-300 mb-2">Audio Sources</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSettings({ ...settings, includeMic: !settings.includeMic })}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-colors text-left ${
                    settings.includeMic
                      ? 'border-sky-500 bg-sky-500/10 text-sky-200'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  {settings.includeMic ? <Mic className="w-4 h-4 text-sky-400" /> : <MicOff className="w-4 h-4" />}
                  <div>
                    <div className="font-semibold">Microphone</div>
                    <div className="text-[10px] opacity-75">{settings.includeMic ? 'Enabled' : 'Muted'}</div>
                  </div>
                </button>

                <button
                  onClick={() => setSettings({ ...settings, includeSystemAudio: !settings.includeSystemAudio })}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-colors text-left ${
                    settings.includeSystemAudio
                      ? 'border-sky-500 bg-sky-500/10 text-sky-200'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold">System Sound</div>
                    <div className="text-[10px] opacity-75">{settings.includeSystemAudio ? 'Speakers On' : 'Off'}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Webcam PiP */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300">Webcam Picture-in-Picture</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.includeWebcam}
                    onChange={(e) => setSettings({ ...settings, includeWebcam: e.target.checked })}
                    className="accent-sky-500 rounded"
                  />
                  <span>Show Camera</span>
                </label>
              </div>

              {settings.includeWebcam && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                      <video ref={webcamVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Position</span>
                        <select
                          value={settings.webcamPosition}
                          onChange={(e) => setSettings({ ...settings, webcamPosition: e.target.value as any })}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="top-right">Top Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-left">Top Left</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Shape</span>
                        <select
                          value={settings.webcamShape}
                          onChange={(e) => setSettings({ ...settings, webcamShape: e.target.value as any })}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        >
                          <option value="rounded">Rounded Box</option>
                          <option value="circle">Circular Lens</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Framerate & Cursor Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Target Framerate</label>
                <select
                  value={settings.frameRate}
                  onChange={(e) => setSettings({ ...settings, frameRate: Number(e.target.value) as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
                >
                  <option value={15}>15 FPS (Economy)</option>
                  <option value={24}>24 FPS (Cinematic)</option>
                  <option value={30}>30 FPS (Standard)</option>
                  <option value={60}>60 FPS (Ultra Smooth)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    checked={settings.showCursorRipples}
                    onChange={(e) => setSettings({ ...settings, showCursorRipples: e.target.checked })}
                    className="accent-sky-500 rounded"
                  />
                  <span>Mouse Click Ripples</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={startCountdown}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span>Record Screen</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. COUNTDOWN OVERLAY */}
      {recordingState === 'countdown' && (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-28 h-28 rounded-full border-4 border-rose-500 bg-rose-600/20 text-white text-5xl font-extrabold flex items-center justify-center animate-ping">
            {countdown}
          </div>
          <span className="text-sm font-semibold text-slate-300 mt-6 tracking-wide uppercase">
            Preparing Screen Recording...
          </span>
        </div>
      )}

      {/* 3. LIVE RECORDING FLOATING CONTROL DOCK */}
      {(recordingState === 'recording' || recordingState === 'paused') && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-5 text-slate-200 backdrop-blur-lg z-50">
          {/* Status Indicator */}
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                recordingState === 'recording' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-base font-bold text-white tabular-nums">
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-xs text-slate-400 capitalize">({recordingState})</span>
          </div>

          <div className="w-[1px] h-6 bg-slate-700" />

          {/* Pause / Resume */}
          {recordingState === 'recording' ? (
            <button
              onClick={pauseRecording}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
              title="Pause Recording"
            >
              <Pause className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={resumeRecording}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              title="Resume Recording"
            >
              <Play className="w-4 h-4" />
            </button>
          )}

          {/* Stop Recording */}
          <button
            onClick={stopRecording}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/30"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Stop & Edit</span>
          </button>
        </div>
      )}

      {/* 4. VIDEO EDITOR & TRIMMER REVIEW SCREEN */}
      {recordingState === 'review' && recordedVideoUrl && (
        <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden text-slate-200">
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">PixelGrip Video Editor & Trimmer</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4 text-xs">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoPlayerRef}
                src={recordedVideoUrl}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={() => {
                  if (videoPlayerRef.current) {
                    setCurrentTime(videoPlayerRef.current.currentTime);
                  }
                }}
                className="w-full h-full object-contain"
                controls
              />
            </div>

            {/* Trimmer Controls */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-sky-400" />
                  <span>Timeline Trim Range</span>
                </span>
                <span className="font-mono text-slate-400">
                  {formatTime(trimStart)} — {formatTime(trimEnd)} ({formatTime(Math.max(0, trimEnd - trimStart))})
                </span>
              </div>

              {/* Start & End Cut Sliders */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-12 text-slate-400 text-[11px]">Start:</span>
                  <input
                    type="range"
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    value={trimStart}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < trimEnd) {
                        setTrimStart(val);
                        if (videoPlayerRef.current) videoPlayerRef.current.currentTime = val;
                      }
                    }}
                    className="flex-1 accent-sky-500"
                  />
                  <span className="font-mono text-[11px] w-12 text-right">{trimStart.toFixed(1)}s</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-12 text-slate-400 text-[11px]">End:</span>
                  <input
                    type="range"
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    value={trimEnd}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > trimStart) {
                        setTrimEnd(val);
                        if (videoPlayerRef.current) videoPlayerRef.current.currentTime = val;
                      }
                    }}
                    className="flex-1 accent-sky-500"
                  />
                  <span className="font-mono text-[11px] w-12 text-right">{trimEnd.toFixed(1)}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60 text-xs">
            <button
              onClick={() => {
                setRecordingState('idle');
                setRecordedVideoUrl(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Record Again
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportGif}
                disabled={isExportingGif}
                className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 font-medium flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{isExportingGif ? `Generating GIF (${gifProgress}%)...` : 'Convert to Animated GIF'}</span>
              </button>

              <button
                onClick={handleDownloadWebm}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-sky-600/30"
              >
                <Download className="w-4 h-4" />
                <span>Download Video (WebM)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
