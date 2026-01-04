# Music Player App

A comprehensive music streaming app built with React Native (Expo) using the JioSaavn API. Features include music playback, queue management, favorites, playlists, search, theme switching, and offline downloads.

## 🎵 Features

### Core Features
- 🎵 **Home Screen**: Browse trending songs, artists, albums with pagination, sorting, and filtering
- 🔍 **Search**: Search for songs, albums, and artists with real-time results and image display
- ▶️ **Full Player**: Complete playback controls with seek bar, shuffle, and repeat modes
- 📱 **Mini Player**: Persistent mini player that syncs with full player, positioned above bottom tabs
- 📋 **Queue Management**: Add, remove, and reorder songs in queue with local persistence
- ❤️ **Favorites**: Add/remove favorite songs with local storage and persistent list view
- 📁 **Playlists**: Create, manage, and play custom playlists with full playback controls
- 🎨 **Theme System**: Light/Dark theme with real-time switching using Context API
- 💾 **Offline Downloads**: Download songs for offline playback with file system management
- 🎧 **Background Playback**: Music continues playing when app is minimized

### Screens

#### 1. **HomeScreen** (`src/screens/HomeScreen.tsx`)
Main screen with multiple tabs and comprehensive features:
- **Suggested Tab**: Shows trending songs, recently played, artists, and most played songs in horizontal scrollable sections
- **Songs Tab**: 
  - Complete song list with play/pause controls directly on list items
  - Multiple sorting options: Name, Artist, Album, Year, Date Added, Date Modified, Composer
  - Sort order: Ascending/Descending
  - Song details display: Song title, Artist name, Album name, and Duration
  - Three-dot menu for each song with options: Play Next, Add to Queue, Add to Playlist, Favorite, Download, Share, Delete, etc.
  - Inline play/pause functionality - play songs without navigating to player screen
- **Artists Tab**: 
  - Grid/list view of artists with circular images
  - Shows album count and song count for each artist
  - Filters artists to show only those with 2+ songs and 2+ albums
  - Tap to view artist details, long-press for options menu
  - "See All" functionality to view all artists
- **Albums Tab**: 
  - Grid view displaying album covers, titles, artists, years, and song counts
  - Three-dot menu for album options
  - Tap to view album details with all songs
- **Queue Tab**: 
  - View and manage current playback queue
  - Reorder songs (move up/down)
  - Remove songs from queue
  - Shows current playing song highlight

**Features:**
- Song name cleaning (removes parentheses and brackets)
- High-quality image URL extraction and optimization
- Performance optimizations (parallel data loading, background loading)
- Filtering and sorting algorithms
- Context menus with multiple options
- Integration with player store, favorites, playlists, and downloads

#### 2. **PlayerScreen** (`src/screens/PlayerScreen.tsx`)
Full-screen music player with comprehensive controls:
- Large album artwork display
- Song information: Title, Artist name, Album name
- Interactive seek bar with PanResponder for smooth dragging
- Progress tracking with real-time updates (250ms interval)
- Time display (current position / total duration)
- Main controls:
  - Previous song button
  - 10-second rewind button (optimized for fast response)
  - Play/Pause button (shows loading indicator)
  - 10-second forward button (optimized for fast response)
  - Next song button
- Secondary controls:
  - Shuffle mode toggle (on/off)
  - Repeat mode toggle (off/one/all)
  - Timer button (placeholder)
  - Cast/Connect button (placeholder)
  - Queue button (navigate to queue screen)
- Lyrics tab (expandable/collapsible)
- Header with back button and menu button
- Optimized for APK builds (fixed padding instead of SafeAreaView)
- Background audio session management
- Handles song completion and auto-play next
- Debounced navigation to prevent rapid clicks

#### 3. **SearchScreen** (`src/screens/SearchScreen.tsx`)
Advanced search functionality:
- Real-time search for songs, albums, and artists
- Tabs to filter search results (Songs, Albums, Artists)
- High-quality image display for all results
- Download button for songs in search results
- Empty state with visual indicator when no results found
- Optimized layout for phone screens
- Search input with submit button

#### 4. **FavoritesScreen** (`src/screens/FavoritesScreen.tsx`)
Favorite songs management:
- List view of all favorite songs
- Displays song image, name, artist, album, and duration
- Play/pause button for each song (inline playback)
- Remove from favorites button
- Empty state when no favorites
- Persistent storage using AsyncStorage
- Optimized for APK (fixed padding for headers)
- Auto-refresh on screen focus

#### 5. **PlaylistsScreen** (`src/screens/PlaylistsScreen.tsx`)
Playlist management:
- List view of all created playlists
- Shows playlist name and metadata (song count, duration)
- Create new playlist button (+ icon)
- Delete playlist functionality
- Empty state with create playlist prompt
- Navigation to playlist detail screen
- Persistent storage using AsyncStorage

#### 6. **PlaylistDetailScreen** (`src/screens/PlaylistDetailScreen.tsx`)
Individual playlist view and playback:
- Playlist header with name, song count, and total duration
- Shuffle and Play buttons for playlist playback
- List of all songs in playlist
- Song details: thumbnail, name, artist
- Play/pause button for each song
- Remove song from playlist functionality
- Full playback controls integration
- Navigation to player screen
- Persistent updates

#### 7. **QueueScreen** (`src/screens/QueueScreen.tsx`)
Playback queue management:
- List view of all songs in queue
- Shows current playing song highlight
- Reorder functionality (move up/down buttons)
- Remove songs from queue
- Empty state indicator
- Real-time queue updates
- Persistent queue storage

#### 8. **SettingsScreen** (`src/screens/SettingsScreen.tsx`)
App settings and configuration:
- Theme toggle (Light/Dark mode) with real-time updates
- Account section (placeholder for login/signup)
- Playback settings
- Downloads section
- General settings
- About section
- Professional icon design using Feather icons
- Settings organized in sections

#### 9. **ArtistDetailScreen** (`src/screens/ArtistDetailScreen.tsx`)
Detailed artist information:
- Large artist/album artwork display
- Artist name and metadata (album count, song count, total duration)
- Shuffle and Play buttons for artist's songs
- Songs section with "See All" option
- List of artist's songs with thumbnails
- Play/pause button for each song (inline playback with toggle)
- Three-dot menu for each song
- Navigation back button and header icons
- Integration with player store for playback
- Optimized for APK builds

#### 10. **AlbumDetailScreen** (`src/screens/AlbumDetailScreen.tsx`)
Detailed album information:
- Large album artwork display
- Album name, artist name, and metadata (song count, duration)
- Shuffle and Play buttons for album songs
- List of album songs with thumbnails
- Play/pause button for each song
- Three-dot menu for each song
- Navigation back button
- Similar design to ArtistDetailScreen
- Workaround for non-functional album songs API endpoint

#### 11. **SeeAllScreen** (`src/screens/SeeAllScreen.tsx`)
View all items from a category:
- Songs displayed in 2-column grid
- Artists displayed with circular images in list
- Expandable artist cards with details
- Filtering logic (artists with 2+ songs and 2+ albums)
- Navigation back functionality
- Image optimization

## 🛠️ Tech Stack

### Core Technologies
- **React Native** (Expo SDK 54)
- **TypeScript** for type safety
- **React Navigation v7** (Stack & Bottom Tabs) for navigation
- **Zustand** for state management
- **AsyncStorage** for local persistence
- **Expo AV** for audio playback
- **Expo File System** for file downloads

### Dependencies

#### Core
```json
{
  "expo": "~54.0.30",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "typescript": "~5.9.2"
}
```

#### Navigation
- `@react-navigation/native`: "^7.1.26"
- `@react-navigation/native-stack`: "^7.9.0"
- `@react-navigation/bottom-tabs`: "^7.9.0"
- `react-native-screens`: "~4.16.0"
- `react-native-safe-area-context`: "~5.6.0"

#### State Management & Storage
- `zustand`: "^5.0.9"
- `@react-native-async-storage/async-storage`: "^2.2.0"

#### Audio & Media
- `expo-av`: "~16.0.8" - Audio playback and streaming
- `expo-status-bar`: "~3.0.9" - Status bar management

**Note:** `expo-file-system` is bundled with Expo SDK and used for downloads functionality (file operations, download directory management)

#### UI & Icons
- `@expo/vector-icons`: "^15.0.3"

## 📦 Project Structure

```
music-player/
├── App.tsx                 # Main app component with ThemeProvider
├── index.ts               # App entry point
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
│
├── src/
│   ├── api/
│   │   └── saavn.ts      # JioSaavn API integration
│   │
│   ├── components/
│   │   ├── MiniPlayer.tsx           # Persistent mini player
│   │   ├── ArtistOptionsModal.tsx   # Artist options bottom sheet
│   │   └── PlaylistSelectionModal.tsx # Playlist selection modal
│   │
│   ├── context/
│   │   └── ThemeContext.tsx         # Theme Context API
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx        # Stack navigator
│   │   └── BottomTabs.tsx           # Bottom tab navigator
│   │
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Main home screen
│   │   ├── PlayerScreen.tsx         # Full player screen
│   │   ├── SearchScreen.tsx         # Search screen
│   │   ├── FavoritesScreen.tsx      # Favorites screen
│   │   ├── PlaylistsScreen.tsx      # Playlists list screen
│   │   ├── PlaylistDetailScreen.tsx # Playlist detail screen
│   │   ├── QueueScreen.tsx          # Queue screen
│   │   ├── SettingsScreen.tsx       # Settings screen
│   │   ├── ArtistDetailScreen.tsx   # Artist detail screen
│   │   ├── AlbumDetailScreen.tsx    # Album detail screen
│   │   └── SeeAllScreen.tsx         # See all screen
│   │
│   ├── store/
│   │   ├── playerStore.ts           # Player state (Zustand)
│   │   └── themeStore.ts            # Theme state (Zustand)
│   │
│   ├── theme/
│   │   └── colors.ts                # Color definitions
│   │
│   └── utils/
│       ├── favorites.ts             # Favorites utilities
│       ├── playlists.ts             # Playlists utilities
│       └── downloads.ts             # Download utilities
│
└── assets/               # App icons and images
    ├── icon.png
    ├── adaptive-icon.png
    ├── splash-icon.png
    └── favicon.png
```

## 🎯 Key Functionality

### Player Features

#### Playback Controls
- **Play/Pause**: Toggle playback state with loading indicators
- **Previous/Next Song**: Navigate through queue with shuffle and repeat support
- **10-Second Forward/Backward**: Skip forward or backward by 10 seconds (optimized for fast response using position state directly)
- **Seek Bar**: Interactive progress bar with PanResponder for smooth dragging
- **Progress Tracking**: Real-time position updates every 250ms for smooth UI

#### Playback Modes
- **Shuffle Mode**: Randomize song order in queue (on/off toggle)
- **Repeat Mode**: Three modes available
  - `off`: Play queue once and stop
  - `one`: Repeat current song
  - `all`: Repeat entire queue
- **Auto-Play Next**: Automatically plays next song when current song completes
- **Background Playback**: Music continues when app is minimized or screen is off

#### Audio Management
- **Audio Session**: Configured for background playback
- **Progress Update Interval**: 250ms for smooth progress bar updates
- **Status Updates**: Real-time playback status synchronization
- **Error Handling**: Graceful error handling for audio playback issues
- **Loading States**: Visual feedback during song loading

### Queue Management

#### Queue Operations
- **Add to Queue**: Add songs to the end of playback queue
- **Add to Queue Next**: Add songs immediately after current song (priority)
- **Remove from Queue**: Remove any song from queue by index
- **Reorder Queue**: Move songs up or down in queue (change playback order)
- **Current Song Highlight**: Visual indicator for currently playing song
- **Queue Persistence**: Queue saved to AsyncStorage automatically
- **Queue Restoration**: Queue restored on app restart

#### Queue State
- Queue stored in Zustand store for global access
- Real-time synchronization across all screens
- Queue updates trigger UI updates automatically
- Queue length displayed in UI

### Favorites

#### Favorite Operations
- **Add to Favorites**: Add any song to favorites list
- **Remove from Favorites**: Remove song from favorites
- **Toggle Favorite**: Quick toggle favorite status
- **Check Favorite Status**: Verify if song is favorited
- **Favorites List View**: Display all favorite songs with details
- **Favorites Persistence**: All favorites saved to AsyncStorage
- **Favorites Restoration**: Favorites restored on app restart

#### Favorites Storage
- Storage key: `@music_player_favorites`
- JSON array of Song objects
- Async operations for all favorite operations
- Real-time UI updates

### Playlists

#### Playlist Operations
- **Create Playlist**: Create new playlist with custom name
- **Add Song to Playlist**: Add songs to existing playlists
- **Remove Song from Playlist**: Remove songs from playlists
- **Delete Playlist**: Remove entire playlist
- **Rename Playlist**: Change playlist name
- **Play Playlist**: Play all songs in playlist with full controls
- **Playlist Persistence**: All playlists saved to AsyncStorage
- **Playlist Restoration**: Playlists restored on app restart

#### Playlist Structure
- Each playlist contains: id, name, songs array, createdAt, updatedAt
- Songs stored as Song objects within playlist
- Metadata tracking (song count, total duration)
- Playlist selection modal for adding songs

### Search

#### Search Features
- **Multi-Type Search**: Search across songs, albums, and artists
- **Real-Time Results**: Search results update as you type
- **Image Display**: High-quality images for all search results
- **Download from Search**: Download songs directly from search results
- **Tab Filtering**: Filter results by type (Songs/Albums/Artists)
- **Empty States**: Visual feedback when no results found
- **Search Pagination**: Support for paginated search results

#### Search API Integration
- Integrated with JioSaavn search API
- Query encoding for special characters
- Error handling for failed searches
- Image URL optimization

### Downloads

#### Download Operations
- **Download Songs**: Download songs for offline playback
- **Check Download Status**: Verify if song is downloaded
- **Delete Downloads**: Remove downloaded songs
- **Get Downloaded Songs**: List all downloaded songs
- **Download Directory Management**: Automatic directory creation and management
- **Download Metadata**: Store download information in AsyncStorage

#### Download Features
- File system integration using expo-file-system
- Download progress tracking
- Offline playback support
- Storage management
- Download status indicators in UI

### Theme System

#### Theme Features
- **Light/Dark Mode**: Two theme options
- **Real-Time Switching**: Theme changes apply immediately
- **Theme Persistence**: Theme preference saved to AsyncStorage
- **Context API Implementation**: React Context for theme distribution
- **Dynamic Color Updates**: All colors update based on theme
- **Theme Toggle**: Easy toggle between themes in settings

#### Theme Implementation
- Theme stored in Zustand store (`themeStore.ts`)
- Theme provided via Context API (`ThemeContext.tsx`)
- Colors defined for light and dark themes
- All components use theme-aware colors
- Settings screen has theme toggle with icon changes

#### Color Scheme
- **Light Theme**: White background (#FFFFFF), dark text (#000000), light cards (#F5F5F5)
- **Dark Theme**: Dark background (#0F1115), light text (#FFFFFF), dark cards (#181A20)
- **Primary Color**: Orange (#F28B38) for both themes
- **Divider Colors**: Theme-aware divider colors

### Navigation

#### Navigation Structure
- **Stack Navigation**: Root navigator for screen hierarchy
- **Bottom Tab Navigation**: Main navigation (Home, Favorites, Playlists, Settings)
- **Custom Tab Bar**: Custom-designed tab bar with icons and labels
- **Deep Linking**: Support for deep linking to screens
- **Navigation Guards**: Can go back checks before navigation

#### Navigation Features
- Screen navigation between all app screens
- Back button handling
- Tab switching with visual feedback
- Active tab highlighting
- Navigation state management

### HomeScreen Features

#### Tabs
- **Suggested Tab**: Trending content with horizontal scrollable sections
- **Songs Tab**: Full song list with sorting and filtering
- **Artists Tab**: Artist grid/list with filtering
- **Albums Tab**: Album grid view
- **Queue Tab**: Queue management interface

#### Sorting Options (Songs Tab)
- **Sort By**: Name, Artist, Album, Year, Date Added, Date Modified, Composer
- **Sort Order**: Ascending or Descending
- **Sort Modal**: Easy-to-use modal for selecting sort options
- **Real-Time Sorting**: Songs re-sorted immediately on selection

#### Song Options Menu
Each song has a three-dot menu with options:
- **Play Next**: Add song to queue next
- **Add to Queue**: Add song to end of queue
- **Add to Playlist**: Add song to existing or new playlist
- **Favorite**: Add/remove from favorites
- **Download**: Download song for offline playback
- **Share**: Share song (placeholder)
- **Delete**: Delete from device (placeholder)
- **Set as Ringtone**: Set as ringtone (placeholder)
- **Go to Album**: Navigate to album (placeholder)
- **Go to Artist**: Navigate to artist (placeholder)

#### Performance Optimizations
- Parallel data loading for initial screen load
- Background loading for artists and albums
- Deferred loading to improve startup time
- Batch processing of API calls
- Image URL optimization
- Memoization of expensive operations

##  Architecture

### State Management

#### Player Store (`src/store/playerStore.ts`)
Manages all playback state using Zustand:

**State:**
- `currentSong`: Currently playing song (Song | null)
- `queue`: Array of songs in playback queue
- `currentIndex`: Index of current song in queue
- `isPlaying`: Playback state (boolean)
- `isLoading`: Loading state (boolean)
- `position`: Current playback position in milliseconds
- `duration`: Total song duration in milliseconds
- `sound`: Audio.Sound instance for playback
- `shuffle`: Shuffle mode (boolean)
- `repeat`: Repeat mode ('off' | 'one' | 'all')

**Functions:**
- `setCurrentSong(song, queue?)`: Set current song and load/play it
- `play()`: Start playback
- `pause()`: Pause playback
- `togglePlayPause()`: Toggle between play and pause
- `next()`: Play next song (respects shuffle and repeat)
- `previous()`: Play previous song (respects shuffle and repeat)
- `addToQueue(song)`: Add song to end of queue
- `addToQueueNext(song)`: Add song after current song
- `removeFromQueue(index)`: Remove song from queue
- `reorderQueue(fromIndex, toIndex)`: Move song in queue
- `setPosition(position)`: Set playback position
- `setDuration(duration)`: Set song duration
- `setShuffle(shuffle)`: Toggle shuffle mode
- `setRepeat(repeat)`: Set repeat mode
- `loadQueue()`: Load queue from AsyncStorage
- `saveQueue()`: Save queue to AsyncStorage

**Features:**
- Automatic queue persistence
- Shuffle algorithm implementation
- Repeat mode handling
- Audio session configuration
- Progress update intervals (250ms)
- Error handling and recovery
- Optimized 10-second skip (uses position state directly)

#### Theme Store (`src/store/themeStore.ts`)
Manages theme state using Zustand.

**State:**
- `theme`: Current theme ('light' | 'dark')

**Methods:**
- `setTheme(theme)`: Set theme and save to AsyncStorage
- `toggleTheme()`: Toggle between light and dark
- `loadTheme()`: Load theme from AsyncStorage

#### Theme Context (`src/context/ThemeContext.tsx`)
Provides theme to all components using React Context API.

**Exports:**
- `ThemeProvider`: Context provider component
- `useTheme()`: Hook to access theme and colors
- `Theme`: Type definition ('light' | 'dark')

**Provides:**
- `theme`: Current theme
- `colors`: Color object based on theme (background, card, primary, textPrimary, textSecondary, divider)
- `toggleTheme()`: Toggle theme function
- `setTheme(theme)`: Set theme function

**Colors:**
- Light theme: White background, dark text
- Dark theme: Dark background (#0F1115), light text

### API Integration

#### JioSaavn API (`src/api/saavn.ts`)
Base URL: `https://saavn.sumit.co/`

**API Functions:**

1. **`searchSongs(query, page)`**
   - Search for songs with query string
   - Supports pagination (default page: 1)
   - Returns array of Song objects
   - Includes image URLs, artist info, album info

2. **`searchAlbums(query, page)`**
   - Search for albums with query string
   - Supports pagination
   - Returns array of Album objects
   - Includes album artwork, artist info, year

3. **`searchArtists(query, page)`**
   - Search for artists with query string
   - Supports pagination
   - Returns array of Artist objects
   - Includes artist images, metadata

4. **`searchPlaylists(query, page)`**
   - Search for playlists with query string
   - Supports pagination
   - Returns array of Playlist objects

5. **`getSongDetails(id)`**
   - Get detailed information for a song
   - Returns complete Song object with all metadata
   - Includes download URLs, high-quality images

6. **`getArtistDetails(id)`**
   - Get detailed information for an artist
   - Returns Artist object with metadata
   - Includes image URLs, album count, song count

7. **`getArtistSongs(id)`**
   - Get all songs by an artist
   - Returns array of Song objects
   - Used for artist detail screen and album song workaround

8. **`getArtistAlbums(id)`**
   - Get all albums by an artist
   - Returns array of Album objects
   - Includes album metadata and artwork

9. **`getAlbumDetails(id)`**
   - Get detailed information for an album
   - Returns Album object with metadata
   - Note: API endpoint may return errors

10. **`getAlbumSongs(id)`**
    - Get all songs in an album
    - **Note: This API endpoint is not functional** - returns "route not found" error
    - Workaround: Filter artist songs by album ID/name

**API Features:**
- Query encoding for special characters
- Error handling with try-catch blocks
- JSON response parsing
- Data normalization
- Image URL extraction and optimization

### Utilities

#### Favorites (`src/utils/favorites.ts`)
Manages favorite songs using AsyncStorage.

**Functions:**
- `loadFavorites()`: Load all favorites from AsyncStorage
- `saveFavorites(favorites)`: Save favorites array to AsyncStorage
- `addToFavorites(song)`: Add song to favorites (checks for duplicates)
- `removeFromFavorites(songId)`: Remove song from favorites by ID
- `isFavorite(songId)`: Check if song is in favorites
- `toggleFavorite(song)`: Toggle favorite status (add if not, remove if exists)

**Storage:**
- Key: `@music_player_favorites`
- Format: JSON array of Song objects
- All operations are async
- Error handling included

#### Playlists (`src/utils/playlists.ts`)
Manages playlists using AsyncStorage.

**Functions:**
- `loadPlaylists()`: Load all playlists from AsyncStorage
- `savePlaylists(playlists)`: Save playlists array to AsyncStorage
- `createPlaylist(name)`: Create new playlist with unique ID and timestamp
- `addSongToPlaylist(playlistId, song)`: Add song to playlist (checks for duplicates)
- `removeSongFromPlaylist(playlistId, songId)`: Remove song from playlist
- `deletePlaylist(playlistId)`: Delete entire playlist
- `renamePlaylist(playlistId, newName)`: Rename playlist

**Playlist Structure:**
```typescript
{
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
  updatedAt: number;
}
```

**Storage:**
- Key: `@music_player_playlists`
- Format: JSON array of Playlist objects
- All operations are async
- Timestamp tracking for created/updated dates

#### Downloads (`src/utils/downloads.ts`)
Manages song downloads using expo-file-system and AsyncStorage.

**Functions:**
- `ensureDownloadDirExists()`: Create download directory if it doesn't exist
- `downloadSong(song)`: Download song file from URL and save to file system
- `deleteDownloadedSong(songId)`: Delete downloaded song file and metadata
- `getDownloadedSongs()`: Get list of all downloaded songs with metadata
- `isDownloaded(songId)`: Check if song is downloaded

**Download Features:**
- File system integration
- Download directory management
- Metadata storage in AsyncStorage
- Download status tracking
- Error handling for failed downloads
- File path management

**Storage:**
- Files: File system directory
- Metadata: AsyncStorage with download information
- Key: `@music_player_downloads`

## UI/UX Features

### Design Elements
-  **Responsive Design**: Layouts adapt to different screen sizes
-  **Safe Area Handling**: Proper handling for notches and status bars (fixed padding for APK compatibility)
-  **Professional Icons**: Feather icons throughout the app
-  **Smooth Animations**: Transitions and state changes
-  **Loading States**: Activity indicators during data loading
-  **Empty States**: Visual feedback when lists are empty
-  **Error Handling**: User-friendly error messages
-  **Image Fallbacks**: Placeholder images when images fail to load
-  **Clean Song Names**: Removes parentheses and brackets from song titles
-  **Duration Formatting**: Formats duration as MM:SS
-  **Image URL Optimization**: Prioritizes high-quality images (500x500, 150x150)
-  **Professional Typography**: Consistent font sizes and weights
-  **Color Consistency**: Theme-aware colors throughout
-  **Touch Feedback**: Active opacity for buttons
-  **Scroll Optimization**: Optimized scrolling performance

### Layout Optimizations
- Fixed padding for APK compatibility (instead of SafeAreaView in some screens)
- Header padding adjusted for screen bounds
- Optimized spacing and margins
- Grid and list layouts for different content types
- Horizontal scrollable sections
- Vertical scrollable lists

### User Experience
- Inline play/pause on song lists (no navigation required)
- Quick access to favorite songs
- Easy playlist creation and management
- Intuitive navigation
- Clear visual feedback
- Context menus for quick actions
- Search with real-time results

## 🔧 Configuration

### App Configuration (`app.json`)
- **Package Name**: `com.musicplayer.app`
- **Version**: `1.0.0`
- **Orientation**: Portrait
- **Permissions**: Internet, Wake Lock
- **Background Modes**: Audio playback
- **EAS Project ID**: Configured for EAS Build

### EAS Configuration (`eas.json`)
- **Preview profile**: APK build for testing
- **Production profile**: APK build for production
- **Development profile**: Development client build
- **Build Type**: APK for Android preview and production

## 📝 Scripts

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web"
}
```

## 🔐 Permissions

### Android
- `INTERNET`: For API calls and streaming
- `WAKE_LOCK`: For background playback
- File system access for downloads
- Storage permissions for downloads

### iOS
- `UIBackgroundModes`: Audio playback background mode
- Network access for API calls
- File system access for downloads

## 📊 Data Storage

All data is stored locally using AsyncStorage and File System:

### AsyncStorage Keys
- **Queue**: `@music_player_queue` - Stores playback queue
- **Favorites**: `@music_player_favorites` - Stores favorite songs
- **Playlists**: `@music_player_playlists` - Stores user playlists
- **Theme**: `@music_player_theme` - Stores theme preference
- **Downloads**: `@music_player_downloads` - Stores download metadata

### File System
- **Downloads Directory**: Created automatically for downloaded songs
- **Downloaded Files**: MP3/audio files stored in file system
- **Metadata**: Download information stored in AsyncStorage

### Data Format
- All data stored as JSON strings
- Automatic serialization/deserialization
- Error handling for corrupted data
- Default values for missing data

##  Known Issues / Limitations

1. **Album Songs API Endpoint**: The `/api/albums/${id}/songs` endpoint returns "route not found" error. Workaround implemented: Filter artist songs by album ID/name.

2. **Artist Image Loading**: Some artists may not have complete image data in the API response. Filtering logic applied to show only artists with valid images.

3. **Artist Filtering**: Artists are filtered to show only those with 2+ songs and 2+ albums for better data quality.

4. **APK Layout**: Some screens use fixed padding instead of SafeAreaView for better APK compatibility. This is intentional.

5. **Performance**: Initial app load may take a few seconds due to data fetching. Optimizations include parallel loading and background loading.

6. **Offline Playback**: Downloaded songs play from local file system. Download functionality requires internet connection.

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Expo Go app (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rockingboi/Music-app.git
   cd Music-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

## 📱 Building APK

### Using EAS Build (Recommended)

1. **Install EAS CLI** (if not installed)
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   npx eas-cli login
   ```

3. **Configure build** (already done - eas.json exists)
   ```bash
   npx eas-cli build:configure
   ```

4. **Build APK**
   ```bash
   # For preview/testing
   npx eas-cli build --platform android --profile preview
   
   # For production
   npx eas-cli build --platform android --profile production
   ```

5. **Download APK**
   - Build will take ~10-20 minutes
   - Download link will be provided after build completes
   - Install on Android device

### Build Profiles

- **preview**: Builds APK for testing (buildType: "apk")
- **production**: Builds APK for production (buildType: "apk")
- **development**: Development client build

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private.

## 👤 Author

**Puneet Sharma**
- GitHub: [@rockingboi](https://github.com/rockingboi)
- Project: [Music-app](https://github.com/rockingboi/Music-app)

## 🙏 Acknowledgments

- JioSaavn API for music data
- Expo team for the amazing framework
- React Navigation for navigation solution
- Zustand for state management
- All open-source contributors
## 📱 Android App APK Download

👉 Click below to download the Android APK:

🔗 [Download APK](https://expo.dev/artifacts/eas/427xYqECGUJgpwXLK5dzZA.apk)

⚠️ Note:
- This is a release APK
- Allow "Install from unknown sources" on your Android device


**Built with ❤️ using React Native and Expo**
