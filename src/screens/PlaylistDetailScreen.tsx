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
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePlayerStore, Song } from '../store/playerStore';
import { colors } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import { loadPlaylists, removeSongFromPlaylist, Playlist } from '../utils/playlists';

const cleanSongName = (name: string) => {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
};

const getImageUrl = (song: Song) => {
  if (song.image && Array.isArray(song.image) && song.image.length > 0) {
    const img = song.image[song.image.length - 1];
    return img.link;
  }
  return undefined;
};

export default function PlaylistDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const playlistId = route.params?.playlistId;
  const playlistParam = route.params?.playlist;

  const [playlist, setPlaylist] = useState<Playlist | null>(playlistParam || null);
  const [loading, setLoading] = useState(true);
  const { setCurrentSong, currentSong, isPlaying, togglePlayPause, queue, currentIndex } = usePlayerStore();

  useEffect(() => {
    loadPlaylistData();
  }, [playlistId]);

  const loadPlaylistData = async () => {
    try {
      setLoading(true);
      if (playlistParam) {
        setPlaylist(playlistParam);
        setLoading(false);
        return;
      }

      if (playlistId) {
        const playlists = await loadPlaylists();
        const foundPlaylist = playlists.find((p) => p.id === playlistId);
        if (foundPlaylist) {
          setPlaylist(foundPlaylist);
        }
      }
    } catch (error) {
      console.log('Error loading playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPlaylist = () => {
    if (!playlist || playlist.songs.length === 0) return;
    
    // Set first song and play
    setCurrentSong(playlist.songs[0], playlist.songs);
  };

  const handleShufflePlaylist = () => {
    if (!playlist || playlist.songs.length === 0) return;
    
    // Shuffle songs
    const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
    setCurrentSong(shuffled[0], shuffled);
  };

  const handleSongPress = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      // Play song from playlist context
      setCurrentSong(song, playlist?.songs || []);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!playlist) return;
    await removeSongFromPlaylist(playlist.id, songId);
    await loadPlaylistData();
  };

  const formatDuration = (milliseconds: number) => {
    if (!milliseconds) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!playlist) return 0;
    return playlist.songs.reduce((total, song) => {
      const duration = typeof song.duration === 'string' 
        ? parseInt(song.duration) || 0 
        : song.duration || 0;
      return total + duration;
    }, 0);
  };

  const formatTotalDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderSong = ({ item, index }: { item: Song; index: number }) => {
    const imageUrl = getImageUrl(item);
    const isCurrentSong = currentSong?.id === item.id;
    const isPlayingCurrent = isCurrentSong && isPlaying;

    const artistName = typeof item.primaryArtists === 'string' 
      ? item.primaryArtists 
      : 'Unknown Artist';
    
    const albumName = typeof item.album === 'string'
      ? item.album
      : item.album?.name || 'Unknown Album';

    return (
      <TouchableOpacity
        style={styles.songItem}
        onPress={() => handleSongPress(item)}
      >
        <View style={styles.songNumber}>
          <Text style={styles.songNumberText}>{index + 1}</Text>
        </View>

        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.songImage} />
        ) : (
          <View style={[styles.songImage, styles.placeholderImage]}>
            <Feather name="music" size={20} color={colors.textSecondary} />
          </View>
        )}

        <View style={styles.songInfo}>
          <Text style={[styles.songName, isCurrentSong && styles.currentSongName]} numberOfLines={1}>
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
          onPress={() => handleRemoveSong(item.id)}
        >
          <Feather name="x" size={18} color={colors.textSecondary} />
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

  if (!playlist) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Playlist not found</Text>
      </View>
    );
  }

  const firstSong = playlist.songs[0];
  const playlistImageUrl = firstSong ? getImageUrl(firstSong) : undefined;
  const totalDuration = getTotalDuration();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              (navigation as any).navigate('Main');
            }
          }}
        >
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Feather name="search" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Feather name="more-vertical" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Playlist Info */}
      <View style={styles.playlistInfo}>
        {playlistImageUrl ? (
          <Image
            source={{ uri: playlistImageUrl }}
            style={styles.playlistImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.playlistImage, styles.placeholderPlaylistImage]}>
            <Feather name="music" size={48} color={colors.textSecondary} />
          </View>
        )}

        <Text style={styles.playlistName} numberOfLines={2}>
          {playlist.name}
        </Text>
        <Text style={styles.playlistMeta}>
          {playlist.songs.length} {playlist.songs.length === 1 ? 'Song' : 'Songs'} • {formatTotalDuration(totalDuration)}
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.shuffleButton]}
            onPress={handleShufflePlaylist}
          >
            <Feather name="shuffle" size={20} color={colors.textPrimary} />
            <Text style={styles.shuffleButtonText}>Shuffle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.playActionButton]}
            onPress={handlePlayPlaylist}
          >
            <Feather name="play" size={20} color="#000" />
            <Text style={styles.playActionButtonText}>Play</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Songs List */}
      <View style={styles.songsSection}>
        <View style={styles.songsHeader}>
          <Text style={styles.songsTitle}>Songs</Text>
        </View>

        {playlist.songs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="music" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No songs in this playlist</Text>
            <Text style={styles.emptySubtext}>
              Add songs to this playlist to see them here
            </Text>
          </View>
        ) : (
          <FlatList
            data={playlist.songs}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => renderSong({ item, index })}
            contentContainerStyle={styles.songsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
  },
  backButton: {
    padding: 8,
  },
  headerButton: {
    padding: 8,
  },
  playlistInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  playlistImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  placeholderPlaylistImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  playlistMeta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  shuffleButton: {
    backgroundColor: colors.card,
  },
  shuffleButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  playActionButton: {
    backgroundColor: colors.primary,
  },
  playActionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  songsSection: {
    flex: 1,
  },
  songsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  songsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  songsList: {
    paddingBottom: 120,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  songNumber: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  songNumberText: {
    fontSize: 14,
    color: colors.textSecondary,
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
  currentSongName: {
    color: colors.primary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

