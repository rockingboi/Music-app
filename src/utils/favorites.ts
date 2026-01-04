import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../store/playerStore';

const FAVORITES_STORAGE_KEY = '@music_player_favorites';

export const loadFavorites = async (): Promise<Song[]> => {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.log('Error loading favorites:', error);
    return [];
  }
};

export const saveFavorites = async (favorites: Song[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.log('Error saving favorites:', error);
  }
};

export const addToFavorites = async (song: Song): Promise<boolean> => {
  try {
    const favorites = await loadFavorites();
    const exists = favorites.some((fav) => fav.id === song.id);
    if (!exists) {
      favorites.push(song);
      await saveFavorites(favorites);
      return true;
    }
    return false;
  } catch (error) {
    console.log('Error adding to favorites:', error);
    return false;
  }
};

export const removeFromFavorites = async (songId: string): Promise<boolean> => {
  try {
    const favorites = await loadFavorites();
    const filtered = favorites.filter((fav) => fav.id !== songId);
    await saveFavorites(filtered);
    return true;
  } catch (error) {
    console.log('Error removing from favorites:', error);
    return false;
  }
};

export const isFavorite = async (songId: string): Promise<boolean> => {
  try {
    const favorites = await loadFavorites();
    return favorites.some((fav) => fav.id === songId);
  } catch (error) {
    console.log('Error checking favorite:', error);
    return false;
  }
};

export const toggleFavorite = async (song: Song): Promise<boolean> => {
  try {
    const isFav = await isFavorite(song.id);
    if (isFav) {
      await removeFromFavorites(song.id);
      return false;
    } else {
      await addToFavorites(song);
      return true;
    }
  } catch (error) {
    console.log('Error toggling favorite:', error);
    return false;
  }
};

