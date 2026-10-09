import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Platform } from "react-native";
import {
  createAudioPlayer,
  setAudioModeAsync,
  AudioPlayer as ExpoAudioPlayer,
  AudioStatus,
} from "expo-audio";
import { AudioSource } from "../models";
import { AppConfig } from "../config";
import { logger } from "../utils/logger";

function normalizeAudioUrl(url: string): string {
  if (!url) return url;
  if (
    AppConfig.apiBaseUrl.startsWith("http") &&
    !AppConfig.apiBaseUrl.includes("localhost") &&
    !AppConfig.apiBaseUrl.includes("10.0.2.2")
  ) {
    const origin = AppConfig.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
    return url.replace(/^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?/, origin);
  }
  if (Platform.OS === "android") {
    return url.replace(/http:\/\/(localhost|127\.0\.0\.1):(\d+)/g, "http://10.0.2.2:$2");
  }
  return url;
}

export interface AudioPlayerController {
  load(source: string | AudioSource, autoPlay?: boolean): Promise<void>;
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

  const playerRef = useRef<ExpoAudioPlayer | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  const load = useCallback(async (source: string | AudioSource, autoPlay = true) => {
    try {
      const rawUrl =
        typeof source === "string"
          ? source
          : source.type === "file"
          ? source.url
          : source.streamUrl;

      if (!rawUrl || rawUrl.trim() === "") {
        const errMsg = "Audio stream URL is missing or empty";
        logger.error("AUDIO", `[useAudioPlayer] ${errMsg}`);
        setState((prev) => ({
          ...prev,
          isBuffering: false,
          error: errMsg,
        }));
        return;
      }

      const audioUrl = normalizeAudioUrl(rawUrl);
      logger.info("AUDIO", `[S3 AUDIO STREAM URL]: ${audioUrl} (autoPlay: ${autoPlay})`);
      console.log(`[S3 AUDIO STREAM URL]: ${audioUrl}`);

      setState((prev) => ({ ...prev, isBuffering: true, error: null }));

      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.remove();
        playerRef.current = null;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: "doNotMix",
        allowsRecording: false,
      });

      const player = createAudioPlayer(audioUrl, { updateInterval: 500 });
      player.volume = 1.0;
      player.muted = false;
      playerRef.current = player;

      if (autoPlay) {
        logger.info("AUDIO", `[useAudioPlayer] Triggering playback for S3 stream: ${audioUrl}`);
        player.play();
      }

      let lastReportedStatus: string | null = null;

      const subscription = (player as any).addListener(
        "playbackStatusUpdate",
        (status: AudioStatus) => {
          const currentStatusKey = `${status.isLoaded}-${status.playing}-${status.isBuffering}`;
          if (currentStatusKey !== lastReportedStatus) {
            lastReportedStatus = currentStatusKey;
            logger.info("AUDIO", `Audio state: loaded=${status.isLoaded}, playing=${status.playing}, buffering=${status.isBuffering}, pos=${Math.floor(status.currentTime || 0)}s/${Math.floor(status.duration || 0)}s`);
          }

          if (status.error) {
            logger.error("AUDIO", `[useAudioPlayer] Playback error reported for S3 stream: ${audioUrl}`, status.error);
          }

          setState({
            isLoaded: status.isLoaded,
            isPlaying: status.playing,
            isBuffering: status.isBuffering,
            positionSeconds: Math.floor(status.currentTime || 0),
            durationSeconds: Math.floor(status.duration || 0),
            error: status.error || null,
          });
        }
      );
      subscriptionRef.current = subscription;
    } catch (err: any) {
      logger.error("AUDIO", `[useAudioPlayer] Failed to load/download S3 audio stream: ${source}`, err);
      setState((prev) => ({
        ...prev,
        isBuffering: false,
        error: err.message || "Failed to load audio stream from S3",
      }));
    }
  }, []);

  const play = useCallback(async () => {
    try {
      if (playerRef.current) {
        logger.info("AUDIO", "User started playback");
        playerRef.current.play();
      }
    } catch (err: any) {
      logger.error("AUDIO", "Error playing audio", err);
      setState((prev) => ({ ...prev, error: err.message }));
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      if (playerRef.current) {
        logger.info("AUDIO", "User paused playback");
        playerRef.current.pause();
      }
    } catch (err: any) {
      logger.error("AUDIO", "Error pausing audio", err);
      setState((prev) => ({ ...prev, error: err.message }));
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      if (playerRef.current) {
        logger.info("AUDIO", "User stopped playback");
        playerRef.current.pause();
        await playerRef.current.seekTo(0);
      }
    } catch (err: any) {
      logger.error("AUDIO", "Error stopping audio", err);
      setState((prev) => ({ ...prev, error: err.message }));
    }
  }, []);

  const seek = useCallback(async (seconds: number) => {
    try {
      if (playerRef.current) {
        logger.info("AUDIO", `User seeked playback to ${seconds}s`);
        await playerRef.current.seekTo(seconds);
      }
    } catch (err: any) {
      logger.error("AUDIO", "Error seeking audio", err);
      setState((prev) => ({ ...prev, error: err.message }));
    }
  }, []);

  const replay = useCallback(async () => {
    try {
      if (playerRef.current) {
        await playerRef.current.seekTo(0);
        playerRef.current.play();
      }
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message }));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, []);

  const controller: AudioPlayerController = useMemo(
    () => ({
      load,
      play,
      pause,
      stop,
      seek,
      replay,
    }),
    [load, play, pause, stop, seek, replay]
  );

  return {
    controller,
    playerState: state,
  };
}
