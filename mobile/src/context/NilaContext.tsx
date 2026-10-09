import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ParentProfile,
  ChildProfile,
  VoiceProfile,
  LifeMemory,
  Story,
  ParentStyleProfile,
  UserSettings,
} from "../models";
import { StoryApi } from "../services/api/StoryApi";
import { ParentApi } from "../services/api/ParentApi";
import { AuthApi } from "../services/api/AuthApi";
import { MemoryApi } from "../services/api/MemoryApi";
import { VoiceApi } from "../services/api/VoiceApi";
import { logger } from "../utils/logger";

interface NilaContextType {
  parent: ParentProfile;
  setParent: React.Dispatch<React.SetStateAction<ParentProfile>>;
  childrenList: ChildProfile[];
  selectedChild: ChildProfile;
  setSelectedChild: (child: ChildProfile) => void;
  updateChild: (child: ChildProfile) => void;
  addChild: (child: Partial<ChildProfile>) => void;
  voiceProfile: VoiceProfile | null;
  setVoiceProfile: React.Dispatch<React.SetStateAction<VoiceProfile | null>>;
  deleteVoiceProfile: () => void;
  memories: LifeMemory[];
  addMemory: (memory: Omit<LifeMemory, "id" | "timesUsed" | "createdAt" | "updatedAt">) => void;
  updateMemory: (memory: LifeMemory) => void;
  deleteMemory: (id: string) => void;
  stories: Story[];
  addStory: (story: Story) => void;
  toggleFavoriteStory: (id: string) => void;
  deleteStory: (id: string) => void;
  styleProfile: ParentStyleProfile;
  updateStyleProfile: (profile: Partial<ParentStyleProfile>) => void;
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
  refreshStoriesFromBackend: () => Promise<void>;
  refreshMemoriesFromBackend: () => Promise<void>;
  refreshVoicesFromBackend: () => Promise<void>;
  ensureBackendProfile: () => Promise<{ parentId: string; childId: string }>;
}

const defaultParent: ParentProfile = {
  id: "parent-uvan-001",
  name: "Uvan",
  relationship: "father",
  language: "Tamil",
  languageCode: "ta",
  dialect: "Chennai",
  script: "Native script",
  preferredChildName: "Kanna",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultChildren: ChildProfile[] = [
  {
    id: "child-aarav-001",
    parentId: "parent-uvan-001",
    name: "Aarav",
    age: 5,
    interests: ["Trains", "Dinosaurs", "Animals", "Space"],
    personality: ["Curious", "Playful", "Gentle", "Imaginative"],
    avoidTopics: ["Monsters", "Darkness", "Loud noises"],
    bedtimeAvoidances: ["Storms / Thunder", "Loud monsters", "Witches"],
    favoriteCharacters: ["Leo the friendly lion", "Blue trains"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "child-riya-002",
    parentId: "parent-uvan-001",
    name: "Riya",
    age: 2,
    interests: ["Animals", "Drawing", "Music"],
    personality: ["Playful", "Energetic", "Funny"],
    avoidTopics: ["Loud noises"],
    bedtimeAvoidances: ["Monsters", "Darkness"],
    favoriteCharacters: ["Little bunny"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultVoice: VoiceProfile = {
  id: "voc_default_priya",
  parentId: "parent-uvan-001",
  provider: "sarvam",
  providerVoiceId: "priya",
  displayName: "Priya (Default Tamil Voice)",
  sourceAudioKey: "",
  languageCode: "ta",
  status: "ready",
  consentAccepted: true,
  accentDialect: "Tamil · Natural conversational",
  sampleDuration: "Standard voice",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultMemories: LifeMemory[] = [
  {
    id: "mem-1",
    parentId: "parent-uvan-001",
    childId: "child-aarav-001",
    title: "Sunny beach afternoon",
    category: "BEACH DAY TRIP",
    description:
      "Aarav built a giant sandcastle with a seaweed flag, then chased tiny crabs until sunset. He insisted on bringing a small jar of salty water home so the crabs wouldn't get lonely.",
    date: "May 12, 2026",
    people: ["Aarav", "Dad", "Mom"],
    location: "Marina Beach",
    emotions: ["Happy", "Peaceful"],
    useInStories: true,
    timesUsed: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mem-2",
    parentId: "parent-uvan-001",
    childId: "child-aarav-001",
    title: "Toy train rescue",
    category: "HOME ADVENTURE",
    description:
      "The blue train car got stuck in the hallway fort. Teddy helped tow it out safely after Aarav connected three wooden blocks together.",
    date: "May 08, 2026",
    people: ["Aarav", "Dad"],
    location: "Living Room",
    emotions: ["Cozy", "Silly"],
    useInStories: true,
    timesUsed: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mem-3",
    parentId: "parent-uvan-001",
    childId: "child-aarav-001",
    title: "Under the mango tree",
    category: "GRANDMA'S GARDEN",
    description:
      "Chasing fireflies in grandma's garden. Aarav tried to feed one some sweet mango juice so it would shine even brighter in the night.",
    date: "May 02, 2026",
    people: ["Aarav", "Paati", "Dad"],
    location: "Madurai Garden",
    emotions: ["Happy", "Peaceful"],
    useInStories: true,
    timesUsed: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const S3_STORY_AUDIO_1 = "https://nila-story-audio-prod-354953409985.s3.ap-south-1.amazonaws.com/stories/sty_6b0a378d8ee9_1791582797989.mp3";
const S3_STORY_AUDIO_2 = "https://nila-story-audio-prod-354953409985.s3.ap-south-1.amazonaws.com/stories/sty_0031d1d3f756_1791578804598.mp3";

const defaultStories: Story[] = [
  {
    id: "story-elephant-01",
    requestId: "req-01",
    parentId: "parent-uvan-001",
    childId: "child-aarav-001",
    title: "The Little Elephant Who Couldn't Sleep",
    languageCode: "ta",
    summary: "A sleepy little elephant counts twinkling stars above the quiet forest stream.",
    text: "கண்ணா... அந்த காட்டுல ஒரு குட்டி யானை இருந்துச்சாம். நிலா வெளிச்சத்துல நட்சத்ரங்களை எண்ண பாத்துச்சாம். அப்புறம் மெதுவா கண் அசைச்சு படுத்து தூங்கிடுச்சாம்...",
    segments: [
      { id: "s1", order: 1, text: "கண்ணா... அந்த காட்டுல ஒரு குட்டி யானை இருந்துச்சாம்." },
      { id: "s2", order: 2, text: "அது நள்ளிரவில் நட்சத்திரங்களை எண்ண ரொம்ப விரும்புச்சாம்." },
      { id: "s3", order: 3, text: "ஆனா வானத்துல ஒரு குட்டி நட்சத்திரம் மட்டும் மெல்ல கண் சிமிட்டி தூங்க சொல்லுச்சாம்." },
      { id: "s4", order: 4, text: "குட்டி யானையும் புல்வெளியில படுத்து நல்லா தூங்க ஆரம்பிச்சுச்சாம்." },
      { id: "s5", order: 5, text: "நல்லா தூங்கு கண்ணா... இனிமையான கனவுகள் வரட்டும்." },
    ],
    narrationVersion: "1.0",
    audioStatus: "ready",
    audioDurationSeconds: 131,
    audioUrl: S3_STORY_AUDIO_1,
    narratorName: "David (Dad)",
    narratorStyle: "Tamil · Chennai style",
    inspiredByMemory: "Marina Beach",
    isFavorite: true,
    createdAt: "Tonight",
  },
  {
    id: "story-train-02",
    requestId: "req-02",
    parentId: "parent-uvan-001",
    childId: "child-aarav-001",
    title: "The Train That Found Home",
    languageCode: "ta",
    summary: "A gentle blue train travels through the misty mountain valleys to find its cozy station.",
    text: "ஒரு பெரிய மலைக்கு நடுவுல ஒரு குட்டி நீல ரயில் போயிட்டு இருந்துச்சாம். சத்தம் போடாம பனிக்குள்ள மெல்ல நகர்ந்து தன் வீட்டுக்கு போய் சேர்ந்துச்சாம்...",
    segments: [],
    narrationVersion: "1.0",
    audioStatus: "ready",
    audioDurationSeconds: 108,
    audioUrl: S3_STORY_AUDIO_2,
    narratorName: "Dad's Voice",
    narratorStyle: "Tamil · Soft & sleepy",
    isFavorite: true,
    createdAt: "Yesterday",
  },
  {
    id: "story-moon-03",
    requestId: "req-03",
    parentId: "parent-uvan-001",
    childId: "child-aarav-001",
    title: "The Moon's Little Secret",
    languageCode: "ta",
    summary: "The moon shares a warm golden whisper with the sleeping birds in the treetops.",
    text: "நிலா மாமா இன்னைக்கு மேகத்துக்குப் பின்னாடி ஒளிஞ்சு விளையாடிச்சாம்...",
    segments: [],
    narrationVersion: "1.0",
    audioStatus: "ready",
    audioDurationSeconds: 131,
    audioUrl: S3_STORY_AUDIO_1,
    narratorName: "Dad's Voice",
    narratorStyle: "Tamil · Chennai style",
    isFavorite: false,
    createdAt: "Yesterday",
  },
];

const defaultStyleProfile: ParentStyleProfile = {
  id: "style-uvan-001",
  parentId: "parent-uvan-001",
  calmingLevel: 0.8,
  adventureDepth: 0.3,
  fantasyMagic: 0.7,
  pacingSpeed: 0.4,
  vocabularyLevel: 0.3,
  favoriteWords: ["Sweet dreams", "Little sprout", "Magic star", "Grandma's kitchen"],
  summaryText:
    "Stories tonight will be soft, slow-paced, set in highly imaginative magical realms, weaving in Dad's favorite phrases to guide Aarav gently to sleep.",
  updatedAt: new Date().toISOString(),
};

const defaultSettings: UserSettings = {
  sleepTimerMinutes: 30,
  autoPlayNext: false,
  highFidelityAudio: true,
  anonymizeVoice: true,
  historyRetentionDays: 30,
  driftModeDefault: true,
};

const NilaContext = createContext<NilaContextType | null>(null);

export const NilaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [parent, setParent] = useState<ParentProfile>(defaultParent);
  const [childrenList, setChildrenList] = useState<ChildProfile[]>(defaultChildren);
  const [selectedChild, setSelectedChild] = useState<ChildProfile>(defaultChildren[0]);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(defaultVoice);
  const [memories, setMemories] = useState<LifeMemory[]>(defaultMemories);
  const [stories, setStories] = useState<Story[]>(defaultStories);
  const [styleProfile, setStyleProfile] = useState<ParentStyleProfile>(defaultStyleProfile);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true); // default true for immediate browsing, can reset

  // Ensure profile is synced on backend and stories refreshed
  useEffect(() => {
    logger.info("APP", "NilaContext mounted. Initializing backend profile sync...");
    ensureBackendProfile().then(({ parentId }) => {
      if (parentId) {
        refreshStoriesFromBackend();
      }
    }).catch((e) => logger.warn("APP", "Init sync error", e));
  }, []);

  const ensureBackendProfile = async (): Promise<{ parentId: string; childId: string }> => {
    let currentParentId = parent.id;
    let currentChildId = selectedChild.id;

    try {
      logger.info("AUTH", "Ensuring parent authentication session...");
      await AuthApi.ensureAuth(parent.name || "Uvan");

      // 2. Fetch authenticated parent profile from DynamoDB
      try {
        const liveParent = await ParentApi.getProfile();
        if (liveParent?.userId) {
          currentParentId = liveParent.userId;
          setParent((prev) => ({
            ...prev,
            id: liveParent.userId,
            name: liveParent.fullName || prev.name,
            relationship: (liveParent.relationship?.toLowerCase() as any) || prev.relationship,
          }));
          logger.success("PROFILE", `Synced parent profile: ${liveParent.fullName} (${liveParent.userId})`);
        }
      } catch (parentErr) {
        logger.warn("PROFILE", "Parent profile fetch note", parentErr);
      }

      // 3. Fetch live children from DynamoDB Nila_Children_prod
      try {
        const backendChildren = await ParentApi.getChildren();
        if (backendChildren && backendChildren.length > 0) {
          setChildrenList(backendChildren);
          currentChildId = backendChildren[0].id;
          setSelectedChild(backendChildren[0]);
          logger.success("CHILD", `Synced ${backendChildren.length} children from backend. Active: ${backendChildren[0].name}`);
        } else {
          // Create initial child in DynamoDB
          logger.info("CHILD", "Creating initial child profile in backend...");
          const newChild = await ParentApi.createChild({
            name: selectedChild.name || "Aarav",
            age: selectedChild.age || 4,
            interests: selectedChild.interests || ["Trains", "Stars"],
            personality: selectedChild.personality || ["Curious", "Playful"],
            avoidTopics: selectedChild.avoidTopics || ["Monsters"],
            favoriteCharacters: selectedChild.favoriteCharacters || [],
          });
          currentChildId = newChild.id;
          setSelectedChild(newChild);
          setChildrenList([newChild]);
          logger.success("CHILD", `Created initial child: ${newChild.name} (${newChild.id})`);
        }
      } catch (childErr) {
        logger.warn("CHILD", "Children sync note", childErr);
      }

      // 4. Fetch live memories from DynamoDB Nila_Memories_prod
      try {
        const liveMemories = await MemoryApi.getMemories(currentChildId);
        if (liveMemories && liveMemories.length > 0) {
          setMemories(liveMemories);
          logger.success("MEMORY", `Synced ${liveMemories.length} life memories from backend`);
        }
      } catch (memErr) {
        logger.warn("MEMORY", "Memories sync note", memErr);
      }

      // 5. Fetch live voices from DynamoDB Nila_VoiceProfiles_prod
      try {
        const liveVoices = await VoiceApi.getVoices();
        if (liveVoices && liveVoices.length > 0) {
          setVoiceProfile(liveVoices[0]);
          logger.success("VOICE", `Synced voice profile: ${liveVoices[0].displayName} (${liveVoices[0].provider})`);
        }
      } catch (voiceErr) {
        logger.warn("VOICE", "Voice sync note", voiceErr);
      }

    } catch (err) {
      logger.warn("APP", "Profile backend sync encountered error", err);
    }

    return { parentId: currentParentId, childId: currentChildId };
  };

  const refreshStoriesFromBackend = async () => {
    try {
      const backendStories = await StoryApi.getStories();
      if (backendStories && backendStories.length > 0) {
        logger.success("STORY", `Retrieved ${backendStories.length} stories from backend`);
        setStories((prev) => {
          const combined = [...backendStories];
          for (const s of prev) {
            if (!combined.some((item) => item.id === s.id)) {
              combined.push(s);
            }
          }
          return combined;
        });
      }
    } catch (err) {
      logger.info("STORY", "Using local stories cache", err);
    }
  };

  const refreshMemoriesFromBackend = async () => {
    try {
      const liveMemories = await MemoryApi.getMemories(selectedChild?.id);
      if (liveMemories && liveMemories.length > 0) {
        logger.success("MEMORY", `Retrieved ${liveMemories.length} memories for ${selectedChild?.name}`);
        setMemories(liveMemories);
      }
    } catch (err) {
      logger.info("MEMORY", "Using local memories cache", err);
    }
  };

  const refreshVoicesFromBackend = async () => {
    try {
      const liveVoices = await VoiceApi.getVoices();
      if (liveVoices && liveVoices.length > 0) {
        logger.success("VOICE", `Retrieved ${liveVoices.length} voice profiles from backend`);
        setVoiceProfile(liveVoices[0]);
      }
    } catch (err) {
      logger.info("VOICE", "Using local voices cache", err);
    }
  };

  const handleSelectChild = (child: ChildProfile) => {
    logger.info("CHILD", `Active child selected: ${child.name} (age: ${child.age}, id: ${child.id})`);
    setSelectedChild(child);
  };

  const updateChild = (updated: ChildProfile) => {
    logger.info("CHILD", `Updating child: ${updated.name} (${updated.id})`);
    setChildrenList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedChild.id === updated.id) {
      setSelectedChild(updated);
    }
    // Sync with DynamoDB asynchronously
    ParentApi.updateChild(updated.id, {
      name: updated.name,
      age: updated.age,
      interests: updated.interests,
      fearsToAvoid: updated.avoidTopics,
    }).catch((err) => logger.warn("CHILD", "Child update sync note", err));
  };

  const addChild = (newChildData: Partial<ChildProfile>) => {
    const tempId = `child-${Date.now()}`;
    const newChild: ChildProfile = {
      id: tempId,
      parentId: parent.id,
      name: newChildData.name || "Little One",
      age: newChildData.age || 3,
      interests: newChildData.interests || ["Animals", "Stories"],
      personality: newChildData.personality || ["Curious", "Playful"],
      avoidTopics: newChildData.avoidTopics || ["Monsters"],
      bedtimeAvoidances: newChildData.bedtimeAvoidances || ["Darkness"],
      favoriteCharacters: newChildData.favoriteCharacters || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    logger.info("CHILD", `Adding new child: ${newChild.name} (age: ${newChild.age})`);
    setChildrenList((prev) => [...prev, newChild]);
    setSelectedChild(newChild);

    // Persist to DynamoDB
    ParentApi.createChild({
      name: newChild.name,
      age: newChild.age,
      interests: newChild.interests,
      fearsToAvoid: newChild.avoidTopics,
      favoriteCharacters: newChild.favoriteCharacters,
    }).then((created) => {
      logger.success("CHILD", `New child saved to backend: ${created.name} (${created.id})`);
      setChildrenList((prev) => prev.map((c) => (c.id === tempId ? created : c)));
      setSelectedChild((prev) => (prev.id === tempId ? created : prev));
    }).catch((err) => logger.warn("CHILD", "Child creation sync note", err));
  };

  const deleteVoiceProfile = () => {
    logger.info("VOICE", `Deleting current voice profile: ${voiceProfile?.displayName}`);
    if (voiceProfile?.id && voiceProfile.id !== defaultVoice.id) {
      VoiceApi.deleteVoiceProfile(voiceProfile.id, voiceProfile.provider).catch((err) =>
        logger.warn("VOICE", "Voice delete note", err)
      );
    }
    setVoiceProfile(defaultVoice);
  };

  const addMemory = (memoryData: Omit<LifeMemory, "id" | "timesUsed" | "createdAt" | "updatedAt">) => {
    const tempId = `mem-${Date.now()}`;
    const newMem: LifeMemory = {
      ...memoryData,
      id: tempId,
      timesUsed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    logger.info("MEMORY", `Adding life memory: "${newMem.title}" for ${selectedChild.name}`);
    setMemories((prev) => [newMem, ...prev]);

    // Persist to DynamoDB
    MemoryApi.createMemory({
      childId: selectedChild.id,
      title: memoryData.title,
      description: memoryData.description,
      eventDate: memoryData.date,
      tags: memoryData.emotions || (memoryData.category ? [memoryData.category] : []),
    }).then((created) => {
      logger.success("MEMORY", `Memory saved to backend: "${created.title}" (${created.id})`);
      setMemories((prev) => prev.map((m) => (m.id === tempId ? created : m)));
    }).catch((err) => logger.warn("MEMORY", "Memory creation sync note", err));
  };

  const updateMemory = (updated: LifeMemory) => {
    logger.info("MEMORY", `Updating memory: "${updated.title}" (${updated.id})`);
    setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const deleteMemory = (id: string) => {
    logger.info("MEMORY", `Deleting memory: ${id}`);
    setMemories((prev) => prev.filter((m) => m.id !== id));
    MemoryApi.deleteMemory(id).catch((err) => logger.warn("MEMORY", "Memory delete note", err));
  };

  const addStory = (story: Story) => {
    logger.success("STORY", `Story added to active collection: "${story.title}" (${story.id})`);
    setStories((prev) => [story, ...prev]);
  };

  const toggleFavoriteStory = (id: string) => {
    let nextState = true;
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          nextState = !s.isFavorite;
          return { ...s, isFavorite: nextState };
        }
        return s;
      })
    );
    logger.info("STORY", `Story ${id} favorite toggled: ${nextState}`);
    StoryApi.toggleFavorite(id, nextState).catch((err) => logger.warn("STORY", "Story favorite note", err));
  };

  const deleteStory = (id: string) => {
    logger.info("STORY", `Deleting story: ${id}`);
    setStories((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStyleProfile = (partial: Partial<ParentStyleProfile>) => {
    logger.info("PROFILE", "Updating parent story style profile", partial);
    setStyleProfile((prev) => ({ ...prev, ...partial, updatedAt: new Date().toISOString() }));
  };

  const updateSettings = (partial: Partial<UserSettings>) => {
    logger.info("PROFILE", "Updating user settings", partial);
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <NilaContext.Provider
      value={{
        parent,
        setParent,
        childrenList,
        selectedChild,
        setSelectedChild: handleSelectChild,
        updateChild,
        addChild,
        voiceProfile,
        setVoiceProfile,
        deleteVoiceProfile,
        memories,
        addMemory,
        updateMemory,
        deleteMemory,
        stories,
        addStory,
        toggleFavoriteStory,
        deleteStory,
        styleProfile,
        updateStyleProfile,
        settings,
        updateSettings,
        isOnboarded,
        setIsOnboarded,
        refreshStoriesFromBackend,
        refreshMemoriesFromBackend,
        refreshVoicesFromBackend,
        ensureBackendProfile,
      }}
    >
      {children}
    </NilaContext.Provider>
  );
};

export const useNila = (): NilaContextType => {
  const context = useContext(NilaContext);
  if (!context) {
    throw new Error("useNila must be used within a NilaProvider");
  }
  return context;
};
