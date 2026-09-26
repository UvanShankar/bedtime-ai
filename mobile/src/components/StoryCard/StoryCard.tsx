import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Story } from "../../models";

interface StoryCardProps {
  story: Story;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{story.title}</Text>
      {story.summary ? <Text style={styles.summary}>{story.summary}</Text> : null}

      <View style={styles.divider} />

      <View style={styles.segmentsContainer}>
        {story.segments.map((segment) => (
          <View key={segment.id} style={styles.segmentBox}>
            <View style={styles.segmentHeader}>
              <Text style={styles.segmentOrder}>Part {segment.order}</Text>
              {segment.emotion && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{segment.emotion}</Text>
                </View>
              )}
            </View>
            <Text style={styles.segmentText}>{segment.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: "#94A3B8",
    fontStyle: "italic",
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 16,
  },
  segmentsContainer: {
    gap: 16,
  },
  segmentBox: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#38BDF8",
  },
  segmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  segmentOrder: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tag: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    color: "#38BDF8",
    fontSize: 11,
    textTransform: "capitalize",
  },
  segmentText: {
    fontSize: 15,
    color: "#E2E8F0",
    lineHeight: 24,
  },
});
