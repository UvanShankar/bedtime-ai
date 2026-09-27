import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { useNila } from "../../context/NilaContext";
import { Story } from "../../models";

interface Props {
  navigation: any;
}

export const StoriesScreen: React.FC<Props> = ({ navigation }) => {
  const { stories, toggleFavoriteStory } = useNila();

  const [activeFilter, setActiveFilter] = useState<"All" | "Favorites" | "This week">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filters = ["All", "Favorites", "This week"] as const;

  const filteredStories = stories.filter((story) => {
    if (activeFilter === "Favorites" && !story.isFavorite) return false;
    if (searchQuery.trim()) {
      return (
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const formatDuration = (secs?: number) => {
    if (!secs) return "5:00";
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const handlePlay = (story: Story) => {
    navigation.navigate("StoryPlayer", { story });
  };

  // Group by createdAt
  const groups: { [key: string]: Story[] } = {};
  filteredStories.forEach((s) => {
    const grp = s.createdAt || "Recent";
    if (!groups[grp]) groups[grp] = [];
    groups[grp].push(s);
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Our stories</Text>
        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={() => setShowSearch(!showSearch)}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={22} color={NilaColors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Input if toggled */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={NilaColors.textMuted} />
          <TextInput
            placeholder="Search our bedtime stories..."
            placeholderTextColor={NilaColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={NilaColors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filtersRow}>
        {filters.map((fil) => (
          <TouchableOpacity
            key={fil}
            style={[styles.filterPill, activeFilter === fil && styles.filterPillActive]}
            onPress={() => setActiveFilter(fil)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === fil && styles.filterPillTextActive,
              ]}
            >
              {fil}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stories Grouped List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {Object.keys(groups).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyMoon}>☾</Text>
            <Text style={styles.emptyTitle}>Your first story is waiting.</Text>
            <Text style={styles.emptyDesc}>
              Create a little adventure tonight using your loving voice.
            </Text>
          </View>
        ) : (
          Object.keys(groups).map((groupTitle) => (
            <View key={groupTitle} style={styles.groupContainer}>
              <Text style={styles.groupTitle}>{groupTitle}</Text>
              {groups[groupTitle].map((story) => (
                <TouchableOpacity
                  key={story.id}
                  style={styles.storyCard}
                  onPress={() => handlePlay(story)}
                  activeOpacity={0.8}
                >
                  <View style={styles.storyCover}>
                    <Text style={styles.coverEmoji}>🌙</Text>
                  </View>

                  <View style={styles.storyInfo}>
                    <Text style={styles.storyTitle} numberOfLines={1}>
                      {story.title}
                    </Text>
                    <Text style={styles.storyMeta}>
                      {formatDuration(story.audioDurationSeconds)} · {story.narratorName || "Dad's voice"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavoriteStory(story.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={story.isFavorite ? "heart" : "heart-outline"}
                      size={20}
                      color={story.isFavorite ? NilaColors.coral : NilaColors.textMuted}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => handlePlay(story)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play" size={16} color={NilaColors.midnight} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: NilaColors.textPrimary,
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NilaColors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NilaColors.surface,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: NilaColors.textPrimary,
    fontSize: 14,
  },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: NilaColors.surface,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
  },
  filterPillActive: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  filterPillText: {
    color: NilaColors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  filterPillTextActive: {
    color: NilaColors.textDark,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  groupContainer: {
    marginBottom: 20,
  },
  groupTitle: {
    color: NilaColors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  storyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NilaColors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    marginBottom: 10,
  },
  storyCover: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: NilaColors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  coverEmoji: {
    fontSize: 22,
  },
  storyInfo: {
    flex: 1,
    paddingRight: 8,
  },
  storyTitle: {
    color: NilaColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  storyMeta: {
    color: NilaColors.textSecondary,
    fontSize: 12,
  },
  favoriteButton: {
    padding: 8,
    marginRight: 4,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: NilaColors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyMoon: {
    fontSize: 54,
    color: NilaColors.gold,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: NilaColors.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
