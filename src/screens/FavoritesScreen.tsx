import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePlayerStore, Song } from '../store/playerStore';
import { colors } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import { loadFavorites, removeFromFavorites } from '../utils/favorites';

const cleanSongName = (name: string) => {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
};

const getImageUrl = (song: Song) => {
  if (!song) return undefined;
  
  // Check if image is an array (from API response)
  if (song.image && Array.isArray(song.image) && song.image.length > 0) {
    // Try to get the highest quality image (usually 500x500 or 150x150)
    const highQuality = song.image.find((img) => 
      img.quality === '500x500' || img.quality === '150x150' || img.quality === '250x250'
    );
    const image = highQuality || song.image[0] || song.image[song.image.length - 1];
    
    // Song type uses 'link' property
    const url = image.link;
    if (url && (url.startsWith('http') || url.startsWith('https'))) {
      // Filter out placeholder images
      if (!url.includes('artist-default') && 
          !url.includes('default-music') && 
          !url.includes('default-film')) {
        return url;
      }
    }
    
    // Try all images in array if first one is placeholder
    for (const img of song.image) {
      const testUrl = img.link;
      if (testUrl && testUrl.startsWith('http') && 
          !testUrl.includes('artist-default') && 
          !testUrl.includes('default-music') &&
          !testUrl.includes('default-film')) {
        return testUrl;
      }
    }
  }
  
  return undefined;
};

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCurrentSong, currentSong, isPlaying, togglePlayPause } = usePlayerStore();

  useEffect(() => {
    loadFavoritesList();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadFavoritesList();
    }, [])
  );

  const loadFavoritesList = async () => {
    try {
      setLoading(true);
      const favoritesList = await loadFavorites();
      setFavorites(favoritesList);
    } catch (error) {
      console.log('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (songId: string) => {
    await removeFromFavorites(songId);
    await loadFavoritesList();
  };

  const handleSongPress = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      setCurrentSong(song);
    }
  };

  const formatDuration = (milliseconds: number) => {
    if (!milliseconds) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderSong = ({ item }: { item: Song }) => {
    const imageUrl = getImageUrl(item);
    const isCurrentSong = currentSong?.id === item.id;
    const isPlayingCurrent = isCurrentSong && isPlaying;

    const artistName = typeof item.primaryArtists === 'string' 
      ? item.primaryArtists 
      : 'Unknown Artist';
    
    const albumName = typeof item.album === 'string'
      ? item.album
      : (item.album?.name || 'Unknown Album');

    return (
      <TouchableOpacity
        style={styles.songItem}
        onPress={() => handleSongPress(item)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.songImage} />
        ) : (
          <View style={[styles.songImage, styles.placeholderImage]}>
            <Feather name="music" size={20} color={colors.textSecondary} />
          </View>
        )}

        <View style={styles.songInfo}>
          <Text style={styles.songName} numberOfLines={1}>
            {cleanSongName(item.name)}
          </Text>
          <Text style={styles.songDetails} numberOfLines={1}>
            {artistName} • {albumName} • {formatDuration(typeof item.duration === 'string' ? parseInt(item.duration) || 0 : item.duration || 0)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.playButton}
          onPress={() => handleSongPress(item)}
        >
          <Feather
            name={isPlayingCurrent ? 'pause' : 'play'}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFavorite(item.id)}
        >
          <Feather name="heart" size={18} color={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Feather name="heart" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyText}>No favorites yet</Text>
        <Text style={styles.emptySubtext}>
          Add songs to favorites to see them here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderSong}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingTop: 36,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  list: {
    paddingBottom: 120,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  songImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: colors.card,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  songDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  playButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

