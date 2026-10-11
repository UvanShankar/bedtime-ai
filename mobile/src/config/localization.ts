export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface ReadingScript {
  id: string;
  title: string;
  native: string;
  phonetic: string;
  meaning: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🌸" },
  { code: "en", name: "English", nativeName: "English", flag: "🌍" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "✨" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🌾" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🍃" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🌴" },
];

export const DIALECTS_BY_LANGUAGE: Record<string, string[]> = {
  Tamil: [
    "Standard Tamil",
    "Chennai Dialect",
    "Madurai Slang",
    "Kongu Tamil",
    "Tirunelveli",
    "Jaffna / Eelam",
  ],
  English: [
    "Neutral & Warm",
    "Indian English",
    "British Accent",
    "American Accent",
  ],
  Hindi: [
    "Standard Hindi",
    "Delhi / Urban",
    "Awadhi / UP",
    "Bihari / Maithili",
  ],
  Telugu: [
    "Standard Telugu",
    "Hyderabad / Telangana",
    "Coastal Andhra",
    "Rayalaseema",
  ],
  Kannada: [
    "Standard Kannada",
    "Bengaluru Urban",
    "Mysuru Accent",
    "North Karnataka",
  ],
  Malayalam: [
    "Standard Malayalam",
    "Kochi / Central",
    "Malabar / North",
    "Travancore / South",
  ],
};

export const READING_SCRIPTS: Record<string, ReadingScript[]> = {
  Tamil: [
    {
      id: "ta-1",
      title: "நிலா மற்றும் குட்டி மான் (The Moon & Fawn)",
      native:
        "நிலா வானில் மெல்ல வந்து, படுக்கை அறையை தன் மென்மையான ஒளியால் நிறைத்தது. குட்டி மான் கண்ணை மூடி இனிதாக தூங்கியது.",
      phonetic:
        "Nila vaanil mella vandhu, padukkai araiyai than menmaiyaana oliyaal niraithadhu. Kutti maan kannai moodi inidhaaga thoongiyadhu.",
      meaning:
        "The moon came softly into the night sky, filling the bedroom with gentle light. The little deer closed its eyes and drifted off to sleep.",
    },
    {
      id: "ta-2",
      title: "அணிலும் நட்சத்திரங்களும் (Squirrel & Stars)",
      native:
        "கண்ணா... அழகான காட்டில் ஒரு குட்டி அணில் இருந்துச்சாம். அது வானத்தில் மின்னும் நட்சத்திரங்களை பார்த்து புன்னகைத்தது.",
      phonetic:
        "Kanna... azhagaana kaattil oru kutti anil irundhuchaam. Adhu vaanathil minnum natchathirangalai paarthu punnagaithadhu.",
      meaning:
        "My sweetheart... in a serene forest lived a little squirrel. It looked up at the twinkling stars and smiled softly.",
    },
  ],
  English: [
    {
      id: "en-1",
      title: "The Moonlit Forest",
      native:
        "The moon rose softly into the evening sky, filling the quiet bedroom with a warm, gentle glow. The little deer closed its eyes to rest.",
      phonetic:
        "The moon rose softly into the evening sky, filling the quiet bedroom with a warm, gentle glow. The little deer closed its eyes to rest.",
      meaning:
        "A peaceful, soothing passage to capture your natural bedtime storytelling tone.",
    },
    {
      id: "en-2",
      title: "Starry Mountain Trail",
      native:
        "Once upon a quiet night, high among the whispering pine trees, a friendly owl watched over all the sleeping creatures below.",
      phonetic:
        "Once upon a quiet night, high among the whispering pine trees, a friendly owl watched over all the sleeping creatures below.",
      meaning:
        "A calm, imaginative tale opening filled with comforting warmth.",
    },
  ],
  Hindi: [
    {
      id: "hi-1",
      title: "चाँद और नन्हा हिरण",
      native:
        "चाँद धीरे से रात के आसमान में आया और कमरे को अपनी मीठी और शांत रोशनी से भर दिया। नन्हा हिरण आँखें मूँद कर सो गया।",
      phonetic:
        "Chaand dheere se raat ke aasmaan mein aaya aur kamre ko apni meethi aur shaant roshni se bhar diya. Nanha hiran aankhein moond kar so gaya.",
      meaning:
        "The moon slowly entered the night sky, filling the room with sweet calm light. The little fawn closed its eyes and slept.",
    },
  ],
  Telugu: [
    {
      id: "te-1",
      title: "జాబిలి మరియు చిన్న జింక",
      native:
        "చందమామ ఆకాశంలో మెల్లగా వచ్చి, గదిని తన చల్లని వెన్నెలతో నింపింది. చిన్న జింక కళ్ళు మూసుకుని హాయిగా నిద్రపోయింది.",
      phonetic:
        "Chandamama aakaashamlo mellaga vachi, gadini tana challani vennelatho nimpindi. Chinna jinka kallu moosukuni haayiga nidrapoindi.",
      meaning:
        "The moon came gently in the sky, filling the room with cool moonlight. The little deer closed its eyes and rested peacefully.",
    },
  ],
  Kannada: [
    {
      id: "kn-1",
      title: "ಚಂದಿರ ಮತ್ತು ಜಿಂಕೆ ಮರಿ",
      native:
        "ಚಂದಿರನು ಆಕಾಶದಲ್ಲಿ ಮೆಲ್ಲನೆ ಬಂದು, ಕೋಣೆಯನ್ನು ತನ್ನ ಸೌಮ್ಯ ಬೆಳಕಿನಿಂದ ತುಂಬಿಸಿದನು. ಜಿಂಕೆ ಮರಿಯು ಕಣ್ಣು ಮುಚ್ಚಿ ನಿದ್ರಿಸಿತು.",
      phonetic:
        "Chandiranu aakaashadalli mellane bandu, koneyannu tanna saumya belakininda tumbisidanu. Jinke mariyu kannu mucchi nidrisitu.",
      meaning:
        "The moon came softly into the sky, filling the room with gentle light. The little fawn closed its eyes and slept.",
    },
  ],
  Malayalam: [
    {
      id: "ml-1",
      title: "അമ്പിളിമാമനും മാൻകുട്ടിയും",
      native:
        "അമ്പിളിമാമൻ ആകാശത്ത് മെല്ലെ വന്നു, മുറിയെ തന്റെ മൃദുവായ വെളിച്ചത്താൽ നിറച്ചു. മാൻകുട്ടി കണ്ണുകൾ അടച്ച് ഉറങ്ങി.",
      phonetic:
        "Ambili maaman aakaashathu melle vannu, muriyey thante mruduvaaya velichathaal nirachu. Maankutti kannukal adachu urangi.",
      meaning:
        "The gentle moon came softly into the sky, filling the room with sweet glow. The little deer closed its eyes and slept.",
    },
  ],
};
