import { useState, useRef, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { AudioSource } from "../models";

function normalizeAudioUrl(url: string): string {
  if (Platform.OS === "android") {
    return url.replace(/http:\/\/(localhost|127\.0\.0\.1):(\d+)/g, "http://10.0.2.2:$2");
  }
  return url;
}

export interface AudioPlayerController {
  load(source: string | AudioSource): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(seconds: number): Promise<void>;
  replay(): Promise<void>;
}

export interface AudioPlayerState {
  isLoaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  positionSeconds: number;
  durationSeconds: number;
  error: string | null;
}

export function useAudioPlayer() {
  const [state, setState] = useState<AudioPlayerState>({
    isLoaded: false,
    isPlaying: false,
    isBuffering: false,
    positionSeconds: 0,
    durationSeconds: 0,
    error: null,
  });

  const soundRef = useRef<Audio.Sound | null>(null);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setState((prev) => ({ ...prev, error: status.error || "Audio playback error" }));
      }
      return;
    }

    setState({
      isLoaded: true,
      isPlaying: status.isPlaying,
      isBuffering: status.isBuffering,
      positionSeconds: Math.floor(status.positionMillis / 1000),
      durationSeconds: Math.floor((status.durationMillis || 0) / 1000),
      error: null,
    });
  }, []);

  const load = useCallback(
    async (source: string | AudioSource) => {
      try {
        setState((prev) => ({ ...prev, isBuffering: true, error: null }));

        if (soundRef.current) {
          await soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }

        const rawUrl = typeof source === "string" ? source : source.type === "file" ? source.url : source.streamUrl;
        const audioUrl = normalizeAudioUrl(rawUrl);

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false, progressUpdateIntervalMillis: 300 },
          onPlaybackStatusUpdate
        );

        soundRef.current = sound;
      } catch (err: any) {
        setState((prev) => ({ ...prev, isBuffering: false, error: err.message || "Failed to load audio" }));
      }
    },
    [onPlaybackStatusUpdate]
  );

  const play = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
      }
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message }));
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message }));
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
      }
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message }));
    }
  }, []);

  const seek = useCallback(async (seconds: number) => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(seconds * 1000);
      }
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message }));
    }
  }, []);

  const replay = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message }));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const controller: AudioPlayerController = {
    load,
    play,
    pause,
    stop,
    seek,
    replay,
  };

  return {
    controller,
    playerState: state,
  };
}
