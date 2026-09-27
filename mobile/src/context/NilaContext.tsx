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
  id: "voice-dad-001",
  parentId: "parent-uvan-001",
  provider: "sarvam",
  providerVoiceId: "david-voice-clone",
  sourceAudioKey: "voices/parent-uvan.m4a",
  languageCode: "ta",
  status: "ready",
  consentAccepted: true,
  accentDialect: "Southern Indian (English & Tamil)",
  sampleDuration: "3 minutes (High Fidelity)",
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
    audioDurationSeconds: 302,
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
    audioDurationSeconds: 287,
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
    audioDurationSeconds: 312,
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

  // Try fetching stories from real backend on mount
  useEffect(() => {
    refreshStoriesFromBackend();
  }, [parent.id]);

  const refreshStoriesFromBackend = async () => {
    try {
      if (parent.id && parent.id !== "parent-uvan-001") {
        const backendStories = await StoryApi.getStories(parent.id);
        if (backendStories && backendStories.length > 0) {
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
      }
    } catch (err) {
      // Backend maybe offline, fallback silently to local mock stories
      console.log("Using cached/local stories:", err);
    }
  };

  const updateChild = (updated: ChildProfile) => {
    setChildrenList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedChild.id === updated.id) {
      setSelectedChild(updated);
    }
  };

  const addChild = (newChildData: Partial<ChildProfile>) => {
    const newChild: ChildProfile = {
      id: `child-${Date.now()}`,
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
    setChildrenList((prev) => [...prev, newChild]);
    setSelectedChild(newChild);
  };

  const deleteVoiceProfile = () => {
    setVoiceProfile(null);
  };

  const addMemory = (memoryData: Omit<LifeMemory, "id" | "timesUsed" | "createdAt" | "updatedAt">) => {
    const newMem: LifeMemory = {
      ...memoryData,
      id: `mem-${Date.now()}`,
      timesUsed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMemories((prev) => [newMem, ...prev]);
  };

  const updateMemory = (updated: LifeMemory) => {
    setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const addStory = (story: Story) => {
    setStories((prev) => [story, ...prev]);
  };

  const toggleFavoriteStory = (id: string) => {
    setStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
    );
  };

  const deleteStory = (id: string) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStyleProfile = (partial: Partial<ParentStyleProfile>) => {
    setStyleProfile((prev) => ({ ...prev, ...partial, updatedAt: new Date().toISOString() }));
  };

  const updateSettings = (partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <NilaContext.Provider
      value={{
        parent,
        setParent,
        childrenList,
        selectedChild,
        setSelectedChild,
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
