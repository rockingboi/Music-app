# Music Player App

A music streaming app built with React Native (Expo) using the JioSaavn API.

## Features

- 🎵 **Home Screen**: Browse trending songs with pagination
- 🔍 **Search**: Search for songs, albums, and artists
- ▶️ **Full Player**: Complete playback controls with seek bar, shuffle, and repeat modes
- 📱 **Mini Player**: Persistent mini player that syncs with full player
- 📋 **Queue Management**: Add, remove, and reorder songs in queue
- 💾 **Persistence**: Queue is saved locally and restored on app restart
- 🎧 **Background Playback**: Music continues playing when app is minimized

## Tech Stack

- **React Native** (Expo) with TypeScript
- **React Navigation v6+** (Stack & Bottom Tabs)
- **Zustand** for state management
- **AsyncStorage** for local persistence
- **expo-av** for audio playback

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
- Press `a` for Android
- Press `i` for iOS
- Scan QR code with Expo Go app

## Architecture

### State Management (Zustand)

The app uses Zustand for centralized state management. The main store (`playerStore.ts`) manages:

- Current song and playback state
- Queue of songs
- Playback position and duration
- Shuffle and repeat modes
- Audio sound instance

### Key Components

1. **PlayerStore** (`src/store/playerStore.ts`)
   - Manages all playback state
   - Handles audio playback with expo-av
   - Persists queue to AsyncStorage
   - Handles song completion and auto-play next

2. **MiniPlayer** (`src/components/MiniPlayer.tsx`)
   - Persistent bottom bar showing current song
   - Syncs with full player state
   - Quick play/pause toggle

3. **PlayerScreen** (`src/screens/PlayerScreen.tsx`)
   - Full-featured player with all controls
   - Interactive seek bar
   - Shuffle and repeat mode toggles

4. **QueueScreen** (`src/screens/QueueScreen.tsx`)
   - View and manage queue
   - Remove songs from queue
   - Highlight current playing song

5. **SearchScreen** (`src/screens/SearchScreen.tsx`)
   - Search across songs, albums, artists
   - Add songs to queue
   - Play songs directly

6. **HomeScreen** (`src/screens/HomeScreen.tsx`)
   - Displays trending songs
   - Infinite scroll pagination
   - Add songs to queue

### API Integration

All API calls are centralized in `src/api/saavn.ts`:
- Search endpoints (songs, albums, artists, playlists)
- Song details
- Artist details and their songs/albums

## Trade-offs

### State Management: Zustand vs Redux Toolkit
**Chosen: Zustand**
- Simpler API, less boilerplate
- Good performance for this use case
- Easy to learn and maintain

### Storage: AsyncStorage vs MMKV
**Chosen: AsyncStorage**
- Built-in with React Native
- Sufficient for queue persistence
- No additional native dependencies

### Navigation: React Navigation vs Expo Router
**Chosen: React Navigation v6**
- More control over navigation structure
- Better for complex navigation patterns
- Standard React Native approach

### Audio: expo-av
**Chosen: expo-av**
- Built-in with Expo
- Supports background playback
- Good enough for streaming use case

## Known Limitations

1. **Seek Bar**: The seek bar uses PanResponder which works but could be improved with a dedicated slider component
2. **Queue Reordering**: Currently only supports remove, full drag-and-drop reordering not implemented
3. **Offline Downloads**: Not implemented (bonus feature)
4. **Album/Artist Details**: Search shows results but full detail screens not implemented

## Future Improvements

- [ ] Drag-and-drop queue reordering
- [ ] Better error handling and retry logic
- [ ] Loading skeletons for better UX

## Project Structure

```
src/
├── api/
│   └── saavn.ts          # API functions
├── components/
│   └── MiniPlayer.tsx    # Mini player component
├── navigation/
│   ├── BottomTabs.tsx    # Bottom tab navigator
│   └── RootNavigator.tsx # Root stack navigator
├── screens/
│   ├── HomeScreen.tsx    # Home/trending songs
│   ├── SearchScreen.tsx  # Search functionality
│   ├── PlayerScreen.tsx  # Full player screen
│   └── QueueScreen.tsx   # Queue management
├── store/
│   └── playerStore.ts    # Zustand store
└── theme/
    └── colors.ts         # Theme colors
```

## License

MIT

