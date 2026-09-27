import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Story } from "../../models";
import { StoryCard } from "../../components/StoryCard/StoryCard";
import { AudioPlayer } from "../../components/AudioPlayer/AudioPlayer";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { ErrorState } from "../../components/ErrorState/ErrorState";

interface Props {
  route: any;
  navigation: any;
}

export const StoryResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { story, parent, child } = route.params as { story: Story; parent: any; child: any };
  const { controller, playerState } = useAudioPlayer();

  useEffect(() => {
    if (story?.audioUrl) {
      controller.load(story.audioUrl);
    }
  }, [story?.audioUrl]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topHeader}>
        <Text style={styles.badge}>🌙 Tonight's Tale</Text>
        <Text style={styles.metaText}>
          Told in {story.languageCode} • For {child.name}
        </Text>
      </View>

      {/* AUDIO PLAYER */}
      {story.audioUrl ? (
        <AudioPlayer controller={controller} playerState={playerState} />
      ) : (
        <ErrorState message="Audio is being prepared or was not generated." />
      )}

      {/* STORY DETAILS & TEXT */}
      <StoryCard story={story} />

      {/* NEW STORY BUTTON */}
      <TouchableOpacity
        style={styles.newStoryButton}
        onPress={() =>
          navigation.navigate("StoryRequest", {
            parent,
            child,
          })
        }
      >
        <Text style={styles.newStoryButtonText}>✨ Make Another Bedtime Story</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  topHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "#1E293B",
    color: "#38BDF8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#94A3B8",
  },
  newStoryButton: {
    backgroundColor: "#334155",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 12,
  },
  newStoryButtonText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
  },
});
