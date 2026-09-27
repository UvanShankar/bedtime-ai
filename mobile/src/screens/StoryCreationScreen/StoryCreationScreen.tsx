import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { StoryApi } from "../../services/api/StoryApi";
import { useNila } from "../../context/NilaContext";
import { Story } from "../../models";

interface Props {
  route: any;
  navigation: any;
}

export const StoryCreationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { request } = route.params || {};
  const { selectedChild, addStory } = useNila();

  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    `Thinking about ${selectedChild?.name || "Aarav"}`,
    "Finding a little adventure",
    "Bringing home into the story",
    "Making it sound like you",
    "Getting bedtime ready",
  ];

  useEffect(() => {
    let isMounted = true;

    // Smooth step interval
    const stepInterval = setInterval(() => {
      if (isMounted) {
        setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
      }
    }, 1200);

    const executeStoryGeneration = async () => {
      try {
        let generatedStory: Story | null = null;
        if (request?.parentId) {
          try {
            const apiRes = await StoryApi.createStory({
              parentId: request.parentId,
              childId: request.childId,
              topic: request.topic || "A bedtime adventure",
              storyType: request.storyType || "Bedtime Adventure",
              mood: request.mood || "Gentle & Sleepy",
              durationMinutes: request.durationMinutes || 5,
              bedtimeCalmness: request.bedtimeCalmness || 0.8,
              includeChildName: request.includeChildName ?? true,
              realWorldFacts: false,
            });
            generatedStory = apiRes?.story;
          } catch (apiErr) {
            console.log("Real backend error, switching to offline story generator:", apiErr);
          }
        }

        if (!generatedStory) {
          // Fallback realistic story
          generatedStory = {
            id: `story-${Date.now()}`,
            requestId: `req-${Date.now()}`,
            parentId: request?.parentId || "parent-001",
            childId: request?.childId || "child-001",
            title: request?.topic
              ? request.topic.length > 35
                ? request.topic.substring(0, 32) + "..."
                : request.topic
              : "THE LITTLE ELEPHANT WHO COULDN'T SLEEP",
            languageCode: "ta",
            text: `கண்ணா ${selectedChild?.name || "ஆரவ்"}... அந்த பெரிய காட்டுல ஒரு குட்டி யானை இருந்துச்சாம். அது நள்ளிரவு நேரத்துல வானத்துல இருக்கற நட்சத்திரங்களை எண்ணி பாக்க விரும்புச்சாம். மெரினா கடற்கரை மணல்ல கட்டின கோட்டை ஞாபகம் வந்துச்சாம். அப்புறம் தன் தும்பிக்கையை மெதுவா அசைச்சு படுத்து தூங்கிடுச்சாம். நல்லா தூங்கு கண்ணா... இனிமையான கனவுகள் வரட்டும்.`,
            segments: [
              { id: "1", order: 1, text: `கண்ணா ${selectedChild?.name || "ஆரவ்"}... அந்த பெரிய காட்டுல ஒரு குட்டி யானை இருந்துச்சாம்.` },
              { id: "2", order: 2, text: "அது நள்ளிரவு நேரத்துல வானத்துல இருக்கற நட்சத்திரங்களை எண்ணி பாக்க விரும்புச்சாம்." },
              { id: "3", order: 3, text: "மெரினா கடற்கரை மணல்ல கட்டின கோட்டை ஞாபகம் வந்துச்சாம்." },
              { id: "4", order: 4, text: "அப்புறம் தன் தும்பிக்கையை மெதுவா அசைச்சு படுத்து தூங்கிடுச்சாம்." },
              { id: "5", order: 5, text: "நல்லா தூங்கு கண்ணா... இனிமையான கனவுகள் வரட்டும்." },
            ],
            narrationVersion: "1.0",
            audioStatus: "ready",
            audioDurationSeconds: (request?.durationMinutes || 5) * 60,
            audioUrl: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
            narratorName: "Dad's Voice",
            narratorStyle: "Tamil · Chennai style",
            inspiredByMemory: "Marina Beach",
            isFavorite: true,
            createdAt: "Tonight",
          };
        }

        addStory(generatedStory);

        setTimeout(() => {
          if (isMounted) {
            navigation.replace("StoryReady", { story: generatedStory });
          }
        }, 3000);
      } catch (err) {
        console.error("Story creation flow error:", err);
      }
    };

    executeStoryGeneration();

    return () => {
      isMounted = false;
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Glow Moon */}
        <View style={styles.illustrationWrapper}>
          <View style={styles.glowCircle} />
          <Text style={styles.moonIcon}>☾</Text>
        </View>

        <Text style={styles.title}>Creating tonight's story...</Text>
        <Text style={styles.subtitle}>Personalizing the cozy world of dreams.</Text>

        <View style={styles.stepsContainer}>
          {steps.map((step, idx) => {
            const isDone = idx < activeStep;
            const isCurrent = idx === activeStep;

            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepIndicator,
                    isDone && styles.stepIndicatorDone,
                    isCurrent && styles.stepIndicatorCurrent,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color={NilaColors.textDark} />
                  ) : isCurrent ? (
                    <View style={styles.currentDot} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    (isDone || isCurrent) && styles.stepTextActive,
                  ]}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NilaColors.midnight,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 28,
    width: "100%",
  },
  illustrationWrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    position: "relative",
  },
  glowCircle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(245, 199, 106, 0.08)",
  },
  moonIcon: {
    fontSize: 64,
    color: NilaColors.gold,
    textShadowColor: NilaColors.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: NilaColors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: NilaColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 36,
  },
  stepsContainer: {
    width: "100%",
    backgroundColor: NilaColors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    gap: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stepIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: NilaColors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndicatorDone: {
    backgroundColor: NilaColors.gold,
    borderColor: NilaColors.gold,
  },
  stepIndicatorCurrent: {
    borderColor: NilaColors.gold,
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NilaColors.gold,
  },
  stepText: {
    color: NilaColors.textMuted,
    fontSize: 15,
  },
  stepTextActive: {
    color: NilaColors.textPrimary,
    fontWeight: "600",
  },
});
