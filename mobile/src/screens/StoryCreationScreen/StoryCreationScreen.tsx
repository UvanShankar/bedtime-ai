import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NilaColors } from "../../theme/colors";
import { StoryApi, StoryStatusResponse } from "../../services/api/StoryApi";
import { useNila } from "../../context/NilaContext";
import { Story } from "../../models";
import { logger } from "../../utils/logger";

interface Props {
  route: any;
  navigation: any;
}

export const StoryCreationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { request } = route.params || {};
  const { parent, selectedChild, voiceProfile, memories, addStory, ensureBackendProfile } = useNila();

  const [activeStep, setActiveStep] = useState(0);
  const [stageMessage, setStageMessage] = useState("Initiating bedtime story creation...");
  const [progressPercent, setProgressPercent] = useState(5);

  const steps = [
    `Thinking about ${selectedChild?.name || "Aarav"}`,
    "Writing story in natural spoken Tamil",
    "Bringing home memories into the story",
    "Synthesizing voice narration",
    "Getting bedtime ready",
  ];

  useEffect(() => {
    let isMounted = true;

    const executeStoryGeneration = async () => {
      let generatedStory: Story | null = null;
      const topic = request?.topic || "A bedtime adventure";
      logger.info("STORY", `[StoryCreationScreen] Initiating generation workflow for topic: "${topic}"`);

      try {
        // 1. Ensure parent and child exist on backend
        const { parentId, childId } = await ensureBackendProfile();

        // 2. Prepare contextual instructions
        let additionalInstruction = "";
        if (request?.includeLifeMemories && memories && memories.length > 0) {
          const mem = memories[0];
          additionalInstruction += ` Weave in this memory: "${mem.title} - ${mem.description}".`;
        }
        if (request?.includeFavoriteThings && selectedChild?.interests?.length) {
          additionalInstruction += ` Child's favorites: ${selectedChild.interests.join(", ")}.`;
        }
        if (request?.includeFamilyMembers) {
          additionalInstruction += ` Include loving moments with family members.`;
        }

        logger.info("STORY", `[StoryCreationScreen] Triggering StoryApi.generateStory (parentId: ${parentId}, childId: ${childId})`);
        const initialStory = await StoryApi.generateStory({
          parentId,
          childId,
          topic,
          storyType: request?.storyType || "bedtime_calm",
          mood: request?.mood || "Gentle & Sleepy",
          durationMinutes: request?.durationMinutes || 5,
          bedtimeCalmness: request?.bedtimeCalmness ?? 0.8,
          includeChildName: request?.includeChildName ?? true,
          includeFavoriteThings: request?.includeFavoriteThings ?? true,
          includeFamilyMembers: request?.includeFamilyMembers ?? false,
          includeLifeMemories: request?.includeLifeMemories ?? true,
          selectedMemoryIds: request?.selectedMemoryIds,
          realWorldFacts: false,
          additionalInstruction: additionalInstruction || undefined,
          voiceProfileId: voiceProfile?.id || undefined,
          voiceProvider: voiceProfile?.provider || undefined,
          dialect: parent?.dialect || selectedChild?.storySettings?.tamilDialect || "Chennai",
        });

        if (initialStory && initialStory.id) {
          logger.info("STORY", `[StoryCreationScreen] Initial story enqueued: ${initialStory.id}. Polling until READY...`);
          
          // 3. Poll backend status until READY
          const readyStory = await StoryApi.pollStoryUntilReady(
            initialStory.id,
            (status: StoryStatusResponse) => {
              if (!isMounted) return;
              if (status.stageMessage) {
                setStageMessage(status.stageMessage);
              }
              if (status.progressPercent) {
                setProgressPercent(status.progressPercent);
              }

              if (status.progressPercent >= 80) {
                setActiveStep(3);
              } else if (status.progressPercent >= 50) {
                setActiveStep(2);
              } else if (status.progressPercent >= 20) {
                setActiveStep(1);
              } else {
                setActiveStep(0);
              }
            }
          );

          if (readyStory) {
            logger.success("STORY", `[StoryCreationScreen] Live story fully ready: "${readyStory.title}"`);
            generatedStory = {
              ...readyStory,
              narratorName: voiceProfile?.displayName || `${parent?.name || "Dad"}'s Voice`,
              narratorStyle: `${parent?.dialect || "Chennai"} · Spoken Tamil`,
              inspiredByMemory: request?.includeLifeMemories && memories?.[0] ? memories[0].location || memories[0].title : undefined,
              isFavorite: true,
            };
          }
        }
      } catch (apiErr: any) {
        logger.error("STORY", `[StoryCreationScreen] Backend story generation failed: ${apiErr.message}`, apiErr);
        if (isMounted) {
          Alert.alert(
            "Story Generation Failed",
            apiErr.message || "Failed to generate bedtime story from server. Please try again.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }
        return;
      }

      if (!generatedStory) {
        logger.error("STORY", "[StoryCreationScreen] Backend returned no story. Aborting without fallback.");
        if (isMounted) {
          Alert.alert(
            "Story Generation Incomplete",
            "The story could not be generated on the server. Please try again.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }
        return;
      }

      if (!generatedStory.audioUrl || generatedStory.audioUrl.trim() === "") {
        logger.error("AUDIO", `[StoryCreationScreen] Generated story has NO audio URL! Story ID: ${generatedStory.id}`, generatedStory);
        if (isMounted) {
          Alert.alert(
            "Audio Stream Not Ready",
            "The story text was created, but the S3 audio stream was not produced by the voice synthesizer. Please try again.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }
        return;
      }

      logger.info("AUDIO", `[S3 AUDIO STREAM URL]: ${generatedStory.audioUrl}`);
      console.log(`[S3 AUDIO STREAM URL]: ${generatedStory.audioUrl}`);

      if (isMounted) {
        setActiveStep(steps.length - 1); // Step 4: Getting bedtime ready
        setProgressPercent(100);
        addStory(generatedStory);

        setTimeout(() => {
          if (isMounted) {
            navigation.replace("StoryReady", { story: generatedStory });
          }
        }, 1200);
      }
    };

    executeStoryGeneration();

    return () => {
      isMounted = false;
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
        <Text style={styles.subtitle}>{stageMessage}</Text>

        {/* Progress percent indicator */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressPercentText}>{progressPercent}%</Text>
        </View>

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
                    <ActivityIndicator size="small" color={NilaColors.gold} />
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    marginBottom: 24,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: NilaColors.surface,
    borderWidth: 1,
    borderColor: NilaColors.cardBorder,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: NilaColors.gold,
    borderRadius: 3,
  },
  progressPercentText: {
    color: NilaColors.gold,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 36,
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
    width: 24,
    height: 24,
    borderRadius: 12,
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
  stepText: {
    color: NilaColors.textMuted,
    fontSize: 15,
  },
  stepTextActive: {
    color: NilaColors.textPrimary,
    fontWeight: "600",
  },
});
