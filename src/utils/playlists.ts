import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../store/playerStore';

export type Playlist = {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
  updatedAt: number;
};

const PLAYLISTS_STORAGE_KEY = '@music_player_playlists';

export const loadPlaylists = async (): Promise<Playlist[]> => {
  try {
    const stored = await AsyncStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.log('Error loading playlists:', error);
    return [];
  }
};

export const savePlaylists = async (playlists: Playlist[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
  } catch (error) {
    console.log('Error saving playlists:', error);
  }
};

export const createPlaylist = async (name: string): Promise<Playlist> => {
  try {
    const playlists = await loadPlaylists();
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      songs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    playlists.push(newPlaylist);
    await savePlaylists(playlists);
    return newPlaylist;
  } catch (error) {
    console.log('Error creating playlist:', error);
    throw error;
  }
};

export const addSongToPlaylist = async (playlistId: string, song: Song): Promise<boolean> => {
  try {
    const playlists = await loadPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) {
      // Check if song already exists
      const exists = playlist.songs.some((s) => s.id === song.id);
      if (!exists) {
        playlist.songs.push(song);
        playlist.updatedAt = Date.now();
        await savePlaylists(playlists);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.log('Error adding song to playlist:', error);
    return false;
  }
};

export const removeSongFromPlaylist = async (playlistId: string, songId: string): Promise<boolean> => {
  try {
    const playlists = await loadPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) {
      playlist.songs = playlist.songs.filter((s) => s.id !== songId);
      playlist.updatedAt = Date.now();
      await savePlaylists(playlists);
      return true;
    }
    return false;
  } catch (error) {
    console.log('Error removing song from playlist:', error);
    return false;
  }
};

export const deletePlaylist = async (playlistId: string): Promise<boolean> => {
  try {
    const playlists = await loadPlaylists();
    const filtered = playlists.filter((p) => p.id !== playlistId);
    await savePlaylists(filtered);
    return true;
  } catch (error) {
    console.log('Error deleting playlist:', error);
    return false;
  }
};

export const renamePlaylist = async (playlistId: string, newName: string): Promise<boolean> => {
  try {
    const playlists = await loadPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) {
      playlist.name = newName;
      playlist.updatedAt = Date.now();
      await savePlaylists(playlists);
      return true;
    }
    return false;
  } catch (error) {
    console.log('Error renaming playlist:', error);
    return false;
  }
};

