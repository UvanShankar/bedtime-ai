import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { NilaToggle } from "../../components/common/NilaToggle";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";

interface Props {
  route: any;
  navigation: any;
}

export const StoryPlayerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { story } = route.params || {};

  const [driftMode, setDriftMode] = useState(true);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  // Audio player hook
  const { controller, playerState } = useAudioPlayer();

  const totalDurationSeconds = story?.audioDurationSeconds || 304; // default 5:04
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Load real audio if story has audioUrl
  useEffect(() => {
    if (story?.audioUrl) {
      controller.load(story.audioUrl);
    }
  }, [story?.audioUrl, controller]);

  // Sync position from real audio player when available
  useEffect(() => {
    if (playerState.isLoaded && playerState.positionSeconds > 0) {
      setPlaybackSeconds(Math.floor(playerState.positionSeconds));
    }
  }, [playerState.positionSeconds, playerState.isLoaded]);

  // Audio timer simulation / sync
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackSeconds((prev) => {
          if (prev >= totalDurationSeconds) {
            clearInterval(interval);
            setIsPlaying(false);
            navigation.navigate("StoryComplete", { story });
            return totalDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDurationSeconds, navigation, story]);

  // Update active text segment based on progress
  useEffect(() => {
    if (story?.segments && story.segments.length > 0) {
      const idx = Math.min(
        Math.floor((playbackSeconds / totalDurationSeconds) * story.segments.length),
        story.segments.length - 1
      );
      setActiveSegmentIndex(idx);
    }
  }, [playbackSeconds, totalDurationSeconds, story?.segments]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins < 10 ? "0" : ""}${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      controller.pause();
      setIsPlaying(false);
    } else {
      controller.play();
      setIsPlaying(true);
    }
  };

  const handleSeekBackward = () => {
    const newPos = Math.max(0, playbackSeconds - 15);
    setPlaybackSeconds(newPos);
    controller.seek(newPos);
  };

  const handleSeekForward = () => {
    const newPos = Math.min(totalDurationSeconds, playbackSeconds + 15);
    setPlaybackSeconds(newPos);
    controller.seek(newPos);
  };

  const progressPercent = Math.min(100, (playbackSeconds / totalDurationSeconds) * 100);

  const segments =
    story?.segments && story.segments.length > 0
      ? story.segments
      : story?.text
      ? story.text
          .split(/\n\s*\n/)
          .map((t: string, i: number) => ({ id: String(i + 1), order: i + 1, text: t.trim() }))
          .filter((s: any) => s.text.length > 0)
      : [
          { id: "1", order: 1, text: "கண்ணா... ஒரு அழகான கதை கேளு." },
          { id: "2", order: 2, text: "நல்லா தூங்கு கண்ணா... இனிமையான கனவுகள் வரட்டும்." },
        ];

  return (
    <SafeAreaView style={[styles.container, driftMode && styles.containerDrift]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-down" size={26} color={NilaColors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.title} numberOfLines={1}>
            {story?.title || "The Little Elephant Who Couldn't Sleep"}
          </Text>
          <Text style={styles.narrator}>
            Narration by {story?.narratorName || "David (Dad)"}
          </Text>
        </View>

        <View style={styles.placeholderIcon} />
      </View>

      {/* Main Text Display Centerpiece */}
      <ScrollView
        contentContainerStyle={styles.textScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.moonGlowWrapper}>
          <Text style={styles.centerMoon}>☾</Text>
        </View>

        <View style={styles.storyCard}>
          {segments.map((seg: any, idx: number) => {
            const isCurrent = idx === activeSegmentIndex;
            return (
              <Text
                key={seg.id || idx}
                style={[
                  styles.segmentText,
                  isCurrent && styles.segmentTextCurrent,
                  idx < activeSegmentIndex && styles.segmentTextPast,
                ]}
              >
                {seg.text}
              </Text>
            );
          })}
        </View>
      </ScrollView>

      {/* Player Bottom Control Deck */}
      <View style={styles.controlDeck}>
        {/* Progress Scrubber */}
        <View style={styles.scrubberContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(playbackSeconds)}</Text>
            <Text style={styles.timeText}>{formatTime(totalDurationSeconds)}</Text>
          </View>
        </View>

        {/* Buttons Row */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.seekButton}
            onPress={handleSeekBackward}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color={NilaColors.textSecondary} />
            <Text style={styles.seekLabel}>15</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={handlePlayPause}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={30}
              color={NilaColors.midnight}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.seekButton}
            onPress={handleSeekForward}
            activeOpacity={0.7}
          >
            <Ionicons name="reload" size={24} color={NilaColors.textSecondary} />
            <Text style={styles.seekLabel}>15</Text>
          </TouchableOpacity>
        </View>

        {/* Drift Mode Section */}
        <View style={styles.driftCard}>
          <NilaToggle
            label="Drift Mode"
            sublabel="Stories gently slow down as bedtime gets closer."
            value={driftMode}
            onValueChange={setDriftMode}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
    justifyContent: "space-between",
  },
  containerDrift: {
    backgroundColor: "#060A14",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleBox: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  title: {
    color: NilaColors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  narrator: {
    color: NilaColors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  placeholderIcon: {
    width: 40,
  },
  textScroll: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
  },
  moonGlowWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 199, 106, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  centerMoon: {
    fontSize: 38,
    color: NilaColors.gold,
  },
  storyCard: {
    width: "100%",
    backgroundColor: NilaColors.surface,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    gap: 16,
  },
  segmentText: {
    fontSize: 18,
    lineHeight: 30,
    color: NilaColors.textSecondary,
    textAlign: "center",
  },
  segmentTextCurrent: {
    color: NilaColors.textPrimary,
    fontWeight: "700",
    textShadowColor: NilaColors.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  segmentTextPast: {
    color: NilaColors.textMuted,
    opacity: 0.6,
  },
  controlDeck: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 10,
  },
  scrubberContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: NilaColors.cardBorder,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: NilaColors.gold,
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeText: {
    color: NilaColors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
    marginBottom: 16,
  },
  seekButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    position: "relative",
  },
  seekLabel: {
    position: "absolute",
    fontSize: 9,
    fontWeight: "800",
    color: NilaColors.textSecondary,
    top: 20,
  },
  playPauseButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: NilaColors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NilaColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  driftCard: {
    backgroundColor: NilaColors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
});
