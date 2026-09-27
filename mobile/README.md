# Bedtime AI — React Native Mobile App

The client mobile application for the Bedtime AI platform, built with **React Native**, **Expo**, and **TypeScript**.

---

## 📱 Features

- **Screen 1 (Parent & Child Setup)**: Profile creation with child bedtime interests, personality, and topics to avoid.
- **Screen 2 (Parent Voice Setup)**: Consent-driven voice recording, sample script reading, preview playback, and upload.
- **Screen 3 (Story Request)**: Topic input, story type, mood, duration, and bedtime calmness slider.
- **Screen 4 (Story Result & Audio Player)**: Full story narration playback with play/pause, replay, progress tracking, and emotion-tagged segments.
- **Android Emulator Loopback (`10.0.2.2`)**: Pre-configured for automatic host connectivity in emulator environments.

---

## 🛠️ How to Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend Host URL
Create a `.env` file in this folder:
```ini
# When running on Android Emulator:
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api/v1

# When connecting to deployed Render backend:
# EXPO_PUBLIC_API_BASE_URL=https://bedtime-ai-backend.onrender.com/api/v1
```

### 3. Start Expo
```bash
# Start Expo development server
npm start

# Or directly in Android Emulator:
npm run android
```
