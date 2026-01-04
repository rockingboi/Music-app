import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../store/playerStore';

const DOWNLOADS_STORAGE_KEY = '@music_player_downloads';
const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`;

export type DownloadedSong = {
  song: Song;
  localPath: string;
  downloadedAt: number;
};

export const downloadSong = async (song: Song): Promise<string | null> => {
  try {
    // Ensure downloads directory exists
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
    }

    // Get audio URL
    const audioUrl =
      song.downloadUrl.find((d) => d.quality === '320kbps')?.url ||
      song.downloadUrl.find((d) => d.quality === '160kbps')?.url ||
      song.downloadUrl[0]?.url;

    if (!audioUrl) {
      console.log('No valid audio URL for download');
      return null;
    }

    // Generate file name
    const fileName = `${song.id}.mp3`;
    const fileUri = `${DOWNLOADS_DIR}${fileName}`;

    // Download file
    const downloadResumable = FileSystem.createDownloadResumable(
      audioUrl,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        console.log(`Download progress: ${(progress * 100).toFixed(0)}%`);
      }
    );

    const result = await downloadResumable.downloadAsync();
    
    if (result?.uri) {
      // Save to downloads list
      const downloads = await getDownloadedSongs();
      const downloadedSong: DownloadedSong = {
        song,
        localPath: result.uri,
        downloadedAt: Date.now(),
      };
      
      // Check if already exists
      const existingIndex = downloads.findIndex((d) => d.song.id === song.id);
      if (existingIndex >= 0) {
        downloads[existingIndex] = downloadedSong;
      } else {
        downloads.push(downloadedSong);
      }
      
      await AsyncStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(downloads));
      return result.uri;
    }

    return null;
  } catch (error) {
    console.log('Error downloading song:', error);
    return null;
  }
};

export const getDownloadedSongs = async (): Promise<DownloadedSong[]> => {
  try {
    const stored = await AsyncStorage.getItem(DOWNLOADS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.log('Error loading downloads:', error);
    return [];
  }
};

export const isDownloaded = async (songId: string): Promise<boolean> => {
  try {
    const downloads = await getDownloadedSongs();
    return downloads.some((d) => d.song.id === songId);
  } catch (error) {
    console.log('Error checking download status:', error);
    return false;
  }
};

export const deleteDownloadedSong = async (songId: string): Promise<boolean> => {
  try {
    const downloads = await getDownloadedSongs();
    const download = downloads.find((d) => d.song.id === songId);
    
    if (download) {
      // Delete file
      const fileInfo = await FileSystem.getInfoAsync(download.localPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(download.localPath);
      }
      
      // Remove from list
      const filtered = downloads.filter((d) => d.song.id !== songId);
      await AsyncStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('Error deleting downloaded song:', error);
    return false;
  }
};

