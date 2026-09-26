import { useState, useRef, useEffect } from "react";
import { Audio } from "expo-av";

export type RecorderState =
  | "idle"
  | "recording"
  | "paused"
  | "recorded"
  | "uploading"
  | "processing"
  | "ready"
  | "error";

export interface UseVoiceRecorderResult {
  state: RecorderState;
  recordingUri: string | null;
  durationSeconds: number;
  isPlayingPreview: boolean;
  errorMessage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  playPreview: () => Promise<void>;
  pausePreview: () => Promise<void>;
  resetRecording: () => Promise<void>;
  setUploadingState: () => void;
  setProcessingState: () => void;
  setReadyState: () => void;
  setErrorState: (msg: string) => void;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [state, setState] = useState<RecorderState>("idle");
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setState("error");
        setErrorMessage("Microphone permission was denied.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setState("recording");
      setDurationSeconds(0);

      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setState("error");
      setErrorMessage(err.message || "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setRecordingUri(uri);
      setState("recorded");
    } catch (err: any) {
      setState("error");
      setErrorMessage(err.message || "Failed to stop recording");
    }
  };

  const playPreview = async () => {
    if (!recordingUri) return;
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setIsPlayingPreview(status.isPlaying);
              if (status.didJustFinish) {
                setIsPlayingPreview(false);
              }
            }
          }
        );
        soundRef.current = sound;
      } else {
        await soundRef.current.playAsync();
      }
      setIsPlayingPreview(true);
    } catch (err: any) {
      setErrorMessage("Could not play recorded sample: " + err.message);
    }
  };

  const pausePreview = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlayingPreview(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const resetRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    recordingRef.current = null;
    setRecordingUri(null);
    setDurationSeconds(0);
    setIsPlayingPreview(false);
    setErrorMessage(null);
    setState("idle");
  };

  return {
    state,
    recordingUri,
    durationSeconds,
    isPlayingPreview,
    errorMessage,
    startRecording,
    stopRecording,
    playPreview,
    pausePreview,
    resetRecording,
    setUploadingState: () => setState("uploading"),
    setProcessingState: () => setState("processing"),
    setReadyState: () => setState("ready"),
    setErrorState: (msg: string) => {
      setErrorMessage(msg);
      setState("error");
    },
  };
}
