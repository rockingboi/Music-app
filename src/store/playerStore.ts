import { create } from 'zustand';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Song = {
  id: string;
  name: string;
  primaryArtists: string;
  primaryArtistsId?: string;
  duration: string;
  year?: string;
  releaseDate?: string;
  image: { quality: string; link: string }[];
  downloadUrl: { quality: string; url: string }[];
  album?: {
    id: string;
    name: string;
  };
  url?: string;
};

type PlaybackState = {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  sound: Audio.Sound | null;
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';
};

type PlayerStore = PlaybackState & {
  setCurrentSong: (song: Song, queue?: Song[]) => void;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  addToQueue: (song: Song) => void;
  addToQueueNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: 'off' | 'one' | 'all') => void;
  loadQueue: () => Promise<void>;
  saveQueue: () => Promise<void>;
};

const QUEUE_STORAGE_KEY = '@music_player_queue';

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSong: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  sound: null,
  shuffle: false,
  repeat: 'off',

  setCurrentSong: async (song: Song, queue?: Song[]) => {
    const state = get();
    
    // Stop current playback
    if (state.sound) {
      await state.sound.unloadAsync();
    }

    const newQueue = queue || state.queue;
    const songIndex = newQueue.findIndex((s) => s.id === song.id);
    const index = songIndex >= 0 ? songIndex : newQueue.length;

    // If song not in queue, add it
    if (songIndex < 0) {
      newQueue.push(song);
    }

    set({
      currentSong: song,
      queue: newQueue,
      currentIndex: index,
      position: 0,
      isPlaying: false,
    });

    // Load and play the song
    await get().play();
    await get().saveQueue();
  },

  play: async () => {
    const state = get();
    if (!state.currentSong) return;

    try {
      set({ isLoading: true });

      // Get audio URL
      const audioUrl =
        state.currentSong.downloadUrl.find((d) => d.quality === '320kbps')
          ?.url ||
        state.currentSong.downloadUrl.find((d) => d.quality === '160kbps')
          ?.url ||
        state.currentSong.downloadUrl[0]?.url;

      if (!audioUrl) {
        console.log('No valid audio URL');
        set({ isLoading: false });
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Create sound with status update callback
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            const currentState = get();
            // Update position for smooth progress bar
            set({
              position: status.positionMillis || 0,
              duration: status.durationMillis || 0,
              isPlaying: status.isPlaying,
            });

            // Handle song completion
            if (status.didJustFinish) {
              if (currentState.repeat === 'one') {
                // Repeat current song
                setTimeout(() => {
                  get().play();
                }, 100);
              } else if (currentState.repeat === 'all' || currentState.currentIndex < currentState.queue.length - 1) {
                // Play next song
                setTimeout(() => {
                  get().next();
                }, 100);
              } else {
                // End of queue
                set({ isPlaying: false, position: 0 });
              }
            }
          }
        }
      );

      set({
        sound,
        isPlaying: true,
        isLoading: false,
      });
    } catch (error) {
      console.log('Error playing song:', error);
      set({ isLoading: false, isPlaying: false });
    }
  },

  pause: async () => {
    const state = get();
    if (state.sound) {
      await state.sound.pauseAsync();
      set({ isPlaying: false });
    }
  },

  togglePlayPause: async () => {
    const state = get();
    if (state.isPlaying) {
      await state.pause();
    } else {
      await state.play();
    }
  },

  next: async () => {
    const state = get();
    if (state.queue.length === 0) {
      console.log('Queue is empty');
      return;
    }

    let nextIndex: number;

    if (state.shuffle) {
      // Random song from queue
      nextIndex = Math.floor(Math.random() * state.queue.length);
    } else {
      nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.queue.length) {
        if (state.repeat === 'all') {
          nextIndex = 0;
        } else {
          console.log('End of queue');
          return; // End of queue
        }
      }
    }

    const nextSong = state.queue[nextIndex];
    if (!nextSong) {
      console.log('Next song not found');
      return;
    }
    console.log('Playing next song:', nextSong.name);
    await state.setCurrentSong(nextSong, state.queue);
  },

  previous: async () => {
    const state = get();
    if (state.queue.length === 0) {
      console.log('Queue is empty');
      return;
    }

    let prevIndex: number;

    if (state.shuffle) {
      // Random song from queue
      prevIndex = Math.floor(Math.random() * state.queue.length);
    } else {
      prevIndex = state.currentIndex - 1;
      if (prevIndex < 0) {
        if (state.repeat === 'all') {
          prevIndex = state.queue.length - 1;
        } else {
          console.log('Beginning of queue');
          return; // Beginning of queue
        }
      }
    }

    const prevSong = state.queue[prevIndex];
    if (!prevSong) {
      console.log('Previous song not found');
      return;
    }
    console.log('Playing previous song:', prevSong.name);
    await state.setCurrentSong(prevSong, state.queue);
  },

  addToQueue: (song: Song) => {
    const state = get();
    const newQueue = [...state.queue, song];
    set({ queue: newQueue });
    get().saveQueue();
  },

  addToQueueNext: (song: Song) => {
    const state = get();
    // Add song right after current song
    const insertIndex = state.currentIndex >= 0 ? state.currentIndex + 1 : 0;
    const newQueue = [...state.queue];
    newQueue.splice(insertIndex, 0, song);
    
    // Adjust current index if needed
    let newIndex = state.currentIndex;
    if (insertIndex <= state.currentIndex) {
      newIndex = state.currentIndex + 1;
    }
    
    set({ queue: newQueue, currentIndex: newIndex });
    get().saveQueue();
  },

  removeFromQueue: (index: number) => {
    const state = get();
    if (index < 0 || index >= state.queue.length) return;

    const newQueue = state.queue.filter((_, i) => i !== index);
    let newIndex = state.currentIndex;

    // Adjust current index if needed
    if (index < state.currentIndex) {
      newIndex = state.currentIndex - 1;
    } else if (index === state.currentIndex && newQueue.length > 0) {
      // If removing current song, play next
      if (newIndex >= newQueue.length) {
        newIndex = newQueue.length - 1;
      }
      const nextSong = newQueue[newIndex];
      get().setCurrentSong(nextSong, newQueue);
      return;
    }

    set({ queue: newQueue, currentIndex: newIndex });
    get().saveQueue();
  },

  reorderQueue: (fromIndex: number, toIndex: number) => {
    const state = get();
    const newQueue = [...state.queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);

    // Update current index
    let newIndex = state.currentIndex;
    if (fromIndex === state.currentIndex) {
      newIndex = toIndex;
    } else if (
      fromIndex < state.currentIndex &&
      toIndex >= state.currentIndex
    ) {
      newIndex = state.currentIndex - 1;
    } else if (
      fromIndex > state.currentIndex &&
      toIndex <= state.currentIndex
    ) {
      newIndex = state.currentIndex + 1;
    }

    set({ queue: newQueue, currentIndex: newIndex });
    get().saveQueue();
  },

  setPosition: (position: number) => {
    set({ position });
  },

  setDuration: (duration: number) => {
    set({ duration });
  },

  setShuffle: (shuffle: boolean) => {
    set({ shuffle });
  },

  setRepeat: (repeat: 'off' | 'one' | 'all') => {
    set({ repeat });
  },

  loadQueue: async () => {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ queue: parsed.queue || [], currentIndex: parsed.currentIndex || -1 });
      }
    } catch (error) {
      console.log('Error loading queue:', error);
    }
  },

  saveQueue: async () => {
    try {
      const state = get();
      await AsyncStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify({
          queue: state.queue,
          currentIndex: state.currentIndex,
        })
      );
    } catch (error) {
      console.log('Error saving queue:', error);
    }
  },
}));

