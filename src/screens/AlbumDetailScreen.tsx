import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { usePlayerStore, Song } from '../store/playerStore';
import { getAlbumDetails, getAlbumSongs } from '../api/saavn';

// Helper function to get image URL
const getImageUrl = (item: any) => {
  if (!item) return undefined;
  
  if (item.image && Array.isArray(item.image) && item.image.length > 0) {
    const highQuality = item.image.find((img: any) => 
      img.quality === '500x500' || img.quality === '150x150' || img.quality === '250x250'
    );
    const image = highQuality || item.image[0] || item.image[item.image.length - 1];
    const url = image.url || image.link;
    if (url && (url.startsWith('http') || url.startsWith('https'))) {
      if (!url.includes('artist-default') && 
          !url.includes('default-music') && 
          !url.includes('default-film')) {
        return url;
      }
    }
    
    for (const img of item.image) {
      const testUrl = img.url || img.link;
      if (testUrl && testUrl.startsWith('http') && 
          !testUrl.includes('artist-default') && 
          !testUrl.includes('default-music')) {
        return testUrl;
      }
    }
  }
  
  if (typeof item.image === 'string' && item.image.startsWith('http')) {
    if (!item.image.includes('artist-default') && 
        !item.image.includes('default-music')) {
      return item.image;
    }
  }
  
  return undefined;
};

// Helper function to clean song names
const cleanSongName = (name: string) => {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
};

// Helper function to convert raw song data to Song type
const convertToSong = (song: any): Song => {
  return {
    id: song.id,
    name: song.name,
    primaryArtists: song.primaryArtists || song.artist,
    duration: song.duration,
    image: song.image || [],
    downloadUrl: song.downloadUrl || [],
    album: song.album,
    year: song.year,
    url: song.url,
  };
};

// Helper function to format duration
const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function AlbumDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const albumId = route.params?.albumId;
  const albumParam = route.params?.album; // Fallback album data

  const [albumDetails, setAlbumDetails] = useState<any>(albumParam || null);
  const [albumSongs, setAlbumSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const { setCurrentSong, setShuffle, currentSong, isPlaying, togglePlayPause } = usePlayerStore();

  // Fetch album details
  const fetchAlbumDetails = async (id: string) => {
    try {
      const details = await getAlbumDetails(id);
      console.log('Album Details API Response:', details);
      // Handle different response formats
      const albumData = details?.data || details?.results?.[0] || details || null;
      if (albumData) {
        setAlbumDetails(albumData);
        
        // Check if album details include songs
        if (albumData.songs && Array.isArray(albumData.songs) && albumData.songs.length > 0) {
          console.log('Found songs in album details:', albumData.songs.length);
          const convertedSongs = albumData.songs.map(convertToSong);
          setAlbumSongs(convertedSongs);
        }
      }
    } catch (error) {
      console.log('Error fetching album details:', error);
      // If API fails, use fallback album data if available
      if (albumParam) {
        setAlbumDetails(albumParam);
      }
    }
  };

  // Fetch album songs - API endpoint doesn't exist, so we'll skip this
  const fetchAlbumSongs = async (id: string) => {
    // API endpoint /api/albums/${id}/songs doesn't exist
    // Songs should come from albumParam or album details
    console.log('Skipping fetchAlbumSongs - API endpoint not available');
    
    // Use songs from albumParam if available
    if (albumParam?.songs && Array.isArray(albumParam.songs) && albumParam.songs.length > 0) {
      console.log('Using songs from albumParam:', albumParam.songs.length);
      const convertedSongs = albumParam.songs.map(convertToSong);
      setAlbumSongs(convertedSongs);
    }
  };

  useEffect(() => {
    // Always use albumParam first if available (it has all the data we need)
    if (albumParam) {
      console.log('AlbumParam received:', {
        id: albumParam.id,
        name: albumParam.name,
        songsCount: albumParam.songs?.length || 0,
        songs: albumParam.songs,
        hasSongs: !!albumParam.songs && Array.isArray(albumParam.songs)
      });
      
      setAlbumDetails(albumParam);
      
      if (albumParam.songs && Array.isArray(albumParam.songs) && albumParam.songs.length > 0) {
        console.log('Using songs from albumParam:', albumParam.songs.length);
        console.log('First song sample:', albumParam.songs[0]);
        const convertedSongs = albumParam.songs.map(convertToSong);
        console.log('Converted songs count:', convertedSongs.length);
        setAlbumSongs(convertedSongs);
      } else {
        console.log('No songs in albumParam, songs property:', albumParam.songs);
        console.log('AlbumParam keys:', Object.keys(albumParam));
      }
      
      setLoading(false);
      
      // Optionally try to fetch more details from API if albumId is available (background fetch)
      if (albumId) {
        fetchAlbumDetails(albumId).catch(() => {
          // If API fails, we already have albumParam data, so it's fine
          console.log('API fetch failed, using albumParam data');
        });
      }
    } else if (albumId) {
      // If no albumParam, try to fetch from API
      setLoading(true);
      setAlbumSongs([]);
      
      fetchAlbumDetails(albumId).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [albumId, albumParam]);

  // Handle back press
  const onBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main');
    }
  };

  // Handle shuffle press
  const onShufflePress = async () => {
    if (albumSongs.length > 0) {
      const shuffled = [...albumSongs].sort(() => Math.random() - 0.5);
      await setCurrentSong(shuffled[0], shuffled);
      setShuffle(true);
    }
  };

  // Handle play press
  const onPlayPress = async () => {
    if (albumSongs.length > 0) {
      await setCurrentSong(albumSongs[0], albumSongs);
      setShuffle(false);
    }
  };

  // Handle song play press
  const onSongPlayPress = async (song: Song) => {
    if (currentSong?.id === song.id) {
      await togglePlayPause();
    } else {
      await setCurrentSong(song, albumSongs);
      setShuffle(false);
    }
  };

  // Handle song menu press
  const onSongMenuPress = (songId: string) => {
    // Placeholder handler
  };

  // Handle see all press
  const onSeeAllPress = () => {
    // Placeholder handler
  };

  // Handle search press
  const onSearchPress = () => {
    // Placeholder handler
  };

  // Handle more options press
  const onMoreOptionsPress = () => {
    // Placeholder handler
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Use albumDetails or fallback to albumParam
  const displayAlbum = albumDetails || albumParam;
  
  if (!displayAlbum && !albumId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Album not found</Text>
      </View>
    );
  }

  const albumArtImageUrl = getImageUrl(displayAlbum);
  const albumName = displayAlbum?.name || displayAlbum?.title || 'Unknown Album';
  
  // Safely extract artist name - handle string, object, and array formats
  let artistName = '';
  if (typeof displayAlbum?.primaryArtists === 'string') {
    artistName = displayAlbum.primaryArtists;
  } else if (typeof displayAlbum?.artists === 'string') {
    artistName = displayAlbum.artists;
  } else if (Array.isArray(displayAlbum?.primaryArtists)) {
    const firstArtist = displayAlbum.primaryArtists[0];
    artistName = firstArtist?.name || firstArtist?.id || '';
  } else if (Array.isArray(displayAlbum?.artists)) {
    const firstArtist = displayAlbum.artists[0];
    artistName = firstArtist?.name || firstArtist?.id || '';
  } else if (displayAlbum?.primaryArtists && typeof displayAlbum.primaryArtists === 'object') {
    artistName = displayAlbum.primaryArtists.name || displayAlbum.primaryArtists.primary || displayAlbum.primaryArtists.all || '';
  } else if (displayAlbum?.artists && typeof displayAlbum.artists === 'object') {
    artistName = displayAlbum.artists.name || displayAlbum.artists.primary || displayAlbum.artists.all || '';
  }
  
  const totalSongs = albumSongs.length;
  const totalDuration = albumSongs.reduce((acc, song) => {
    // Duration is in seconds (string), convert to number
    const duration = parseInt(song.duration) || 0;
    return acc + duration;
  }, 0);
  const formattedDuration = formatDuration(totalDuration);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onBackPress}
        >
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={onSearchPress}>
            <Text style={styles.headerIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onMoreOptionsPress}>
            <Text style={styles.headerIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Album Artwork */}
        <View style={styles.albumArtContainer}>
          {albumArtImageUrl ? (
            <Image
              source={{ uri: albumArtImageUrl }}
              style={styles.albumArt}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.albumArt}>
              <Text style={styles.albumArtPlaceholder}>♪</Text>
            </View>
          )}
        </View>

        {/* Album Info */}
        <View style={styles.albumInfo}>
          <Text style={styles.albumName}>{albumName}</Text>
          <Text style={styles.albumMeta}>
            {artistName || 'Unknown Artist'} | {String(totalSongs)} Songs | {formattedDuration} mins
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.shuffleButton} onPress={onShufflePress}>
            <Text style={styles.shuffleIcon}>⇄</Text>
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton} onPress={onPlayPress}>
            <Text style={styles.playIcon}>▶</Text>
            <Text style={styles.playText}>Play</Text>
          </TouchableOpacity>
        </View>

        {/* Songs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Songs</Text>
            <TouchableOpacity onPress={onSeeAllPress}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Song List */}
          {albumSongs.length > 0 ? albumSongs.map((song: Song, index: number) => {
            const songImageUrl = getImageUrl(song);
            const songName = cleanSongName(song.name);
            const songArtist = song.primaryArtists || song.artist || artistName;
            const isCurrentSong = currentSong?.id === song.id;

            const handleSongPlay = async (e: any) => {
              e.stopPropagation();
              // If same song is playing, toggle play/pause
              if (isCurrentSong) {
                await togglePlayPause();
              } else {
                // Otherwise, set new song and play
                await setCurrentSong(song, albumSongs);
                setShuffle(false);
              }
            };

            return (
              <TouchableOpacity
                key={song.id || index}
                style={styles.songItem}
                onPress={() => {
                  navigation.navigate('Player');
                }}
              >
                {songImageUrl ? (
                  <Image
                    source={{ uri: songImageUrl }}
                    style={styles.songThumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.songThumbnail}>
                    <Text style={styles.songThumbnailPlaceholder}>♪</Text>
                  </View>
                )}
                <View style={styles.songInfo}>
                  <Text style={styles.songName}>{songName}</Text>
                  <Text style={styles.songArtist}>{songArtist}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.songPlayButton}
                  onPress={handleSongPlay}
                >
                  <Text style={styles.songPlayIcon}>
                    {isCurrentSong && isPlaying ? '⏸' : '▶'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.songMenuButton}>
                  <Text style={styles.songMenuIcon}>⋮</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }) : (
            <View style={styles.noSongsContainer}>
              <Text style={styles.noSongsText}>No songs found. Loading...</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    color: colors.textPrimary,
    fontSize: 24,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  albumArt: {
    width: 280,
    height: 280,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumArtPlaceholder: {
    fontSize: 80,
    color: colors.textSecondary,
  },
  albumInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  albumName: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  albumMeta: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 32,
  },
  shuffleButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shuffleIcon: {
    color: '#000',
    fontSize: 18,
  },
  shuffleText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  playIcon: {
    color: colors.primary,
    fontSize: 18,
  },
  playText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 14,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  songThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  songThumbnailPlaceholder: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  songArtist: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  songPlayButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  songPlayIcon: {
    color: colors.primary,
    fontSize: 20,
  },
  songMenuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songMenuIcon: {
    color: colors.textSecondary,
    fontSize: 20,
  },
  noSongsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noSongsText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});

