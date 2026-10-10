import { useState, useRef, useEffect } from "react";
import { Platform } from "react-native";
import {
  useAudioRecorder,
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
  IOSOutputFormat,
  AudioQuality,
  AudioPlayer,
  AudioStatus,
  RecordingOptions,
} from "expo-audio";
import { logger } from "../utils/logger";

// Direct recording in formats natively accepted by Sarvam AI without conversion:
// Android: AAC Audio Data Transport Stream (.aac)
// iOS: Linear PCM 16-bit WAV (.wav)
export const VOICE_RECORDING_OPTIONS: RecordingOptions = {
  extension: Platform.OS === "ios" ? ".wav" : ".aac",
  sampleRate: 24000,
  numberOfChannels: 1,
  bitRate: 128000,
  android: {
    extension: ".aac",
    outputFormat: "aac_adts",
    audioEncoder: "aac",
  },
  ios: {
    extension: ".wav",
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.MAX,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

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

  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS, (status) => {
    if (status.hasError && status.error) {
      setErrorMessage(status.error);
      setState("error");
    }
  });

  const previewPlayerRef = useRef<AudioPlayer | null>(null);
  const previewSubRef = useRef<{ remove: () => void } | null>(null);
  const timerRef = useRef<any>(null);

  const stopPreviewInternal = () => {
    if (previewSubRef.current) {
      previewSubRef.current.remove();
      previewSubRef.current = null;
    }
    if (previewPlayerRef.current) {
      previewPlayerRef.current.pause();
      previewPlayerRef.current.remove();
      previewPlayerRef.current = null;
    }
    setIsPlayingPreview(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopPreviewInternal();
    };
  }, []);

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      stopPreviewInternal();

      logger.info("VOICE", "Requesting microphone permissions...");
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        logger.error("VOICE", "Microphone permission was denied by user");
        setState("error");
        setErrorMessage("Microphone permission was denied.");
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();

      logger.success("VOICE", "Voice recording session active");
      setState("recording");
      setDurationSeconds(0);

      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      logger.error("VOICE", "Failed to start recording", err);
      setState("error");
      setErrorMessage(err.message || "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorder.isRecording) {
        await recorder.stop();
      }

      const uri = recorder.uri || (recorder.getStatus() as any)?.url;

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      logger.success("VOICE", `Recording completed. Audio URI: ${uri}`);
      setRecordingUri(uri);
      setState("recorded");
    } catch (err: any) {
      logger.error("VOICE", "Failed to stop recording", err);
      setState("error");
      setErrorMessage(err.message || "Failed to stop recording");
    }
  };

  const playPreview = async () => {
    if (!recordingUri) {
      logger.warn("VOICE", "[useVoiceRecorder] playPreview called without recordingUri");
      return;
    }
    try {
      logger.info("VOICE", `[useVoiceRecorder] Playing preview audio from: ${recordingUri}`);
      stopPreviewInternal();

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: "doNotMix",
      });

      const player = createAudioPlayer(recordingUri, { updateInterval: 200 });
      player.volume = 1.0;
      player.muted = false;
      previewPlayerRef.current = player;

      const sub = (player as any).addListener(
        "playbackStatusUpdate",
        (status: AudioStatus) => {
          setIsPlayingPreview(status.playing);
          if (status.didJustFinish) {
            setIsPlayingPreview(false);
          }
        }
      );
      previewSubRef.current = sub;
      player.play();
      setIsPlayingPreview(true);
    } catch (err: any) {
      logger.error("VOICE", `[useVoiceRecorder] Preview playback error: ${err.message}`, err);
      setErrorMessage("Could not play recorded sample: " + err.message);
    }
  };

  const pausePreview = async () => {
    try {
      if (previewPlayerRef.current) {
        previewPlayerRef.current.pause();
      }
      setIsPlayingPreview(false);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const resetRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorder.isRecording) {
      await recorder.stop().catch(() => {});
    }
    stopPreviewInternal();

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
