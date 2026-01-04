import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { usePlayerStore, Song } from '../store/playerStore';

// Mock data
const mockSongs = [
  { id: '1', name: 'Bang Bang', artist: 'Ariana Grande', image: null },
  { id: '2', name: 'The Light Is Coming', artist: 'Ariana Grande', image: null },
  { id: '3', name: 'Dangerous Woman', artist: 'Ariana Grande', image: null },
];

const getImageUrl = (item: any) => {
  if (!item) return undefined;
  
  // Check if image is an array (from API response)
  if (item.image && Array.isArray(item.image) && item.image.length > 0) {
    // Try to get the highest quality image
    const highQuality = item.image.find((img: any) => 
      img.quality === '500x500' || img.quality === '150x150' || img.quality === '250x250'
    );
    const image = highQuality || item.image[0] || item.image[item.image.length - 1];
    
    // API uses 'url' for artists, 'link' for songs - check both
    const url = image.url || image.link;
    if (url && (url.startsWith('http') || url.startsWith('https'))) {
      // Filter out placeholder images
      if (!url.includes('artist-default') && 
          !url.includes('default-music') && 
          !url.includes('default-film')) {
        return url;
      }
    }
    
    // Try all images in array if first one is placeholder
    for (const img of item.image) {
      const testUrl = img.url || img.link;
      if (testUrl && testUrl.startsWith('http') && 
          !testUrl.includes('artist-default') && 
          !testUrl.includes('default-music') &&
          !testUrl.includes('default-film')) {
        return testUrl;
      }
    }
  }
  
  // Check if image is a direct string/url
  if (typeof item.image === 'string' && item.image.length > 0 && item.image.startsWith('http')) {
    if (!item.image.includes('artist-default') && 
        !item.image.includes('default-music')) {
      return item.image;
    }
  }
  
  return undefined;
};

export default function ArtistDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const artistParam = route.params?.artist || {
    name: 'Ariana Grande',
    albums: 1,
    songs: 20,
    totalDuration: '01:25:43',
    image: null,
  };

  // Safely extract album and song counts
  let albums = 1;
  if (Array.isArray(artistParam.albums)) {
    albums = artistParam.albums.length;
  } else if (typeof artistParam.albums === 'number') {
    albums = artistParam.albums;
  }

  let songs = 20;
  if (Array.isArray(artistParam.songs)) {
    songs = artistParam.songs.length;
  } else if (typeof artistParam.songs === 'number') {
    songs = artistParam.songs;
  }

  const totalDuration = typeof artistParam.totalDuration === 'string' 
    ? artistParam.totalDuration 
    : '01:25:43';

  const artist = {
    name: artistParam.name || artistParam.title || 'Ariana Grande',
    albums,
    songs,
    totalDuration,
    image: artistParam.image,
  };

  // Get songs from artist or use mock data
  const rawSongs = Array.isArray(artistParam.songs) && artistParam.songs.length > 0
    ? artistParam.songs
    : mockSongs;

  // Convert songs to Song type format
  const convertToSong = (song: any): Song => {
    return {
      id: song.id || String(Math.random()),
      name: song.name || '',
      primaryArtists: song.primaryArtists || song.artist || artist.name,
      duration: song.duration || '180',
      image: song.image || [],
      downloadUrl: song.downloadUrl || [],
      album: song.album || { id: '', name: '' },
      year: song.year,
      url: song.url,
    };
  };

  const artistSongs: Song[] = rawSongs.map(convertToSong).slice(0, 10);

  // Get album artwork image
  const albumArtImageUrl = getImageUrl(artistParam);

  const { setCurrentSong, setShuffle, currentSong, isPlaying, togglePlayPause } = usePlayerStore();

  const handlePlay = async () => {
    if (artistSongs.length > 0) {
      await setCurrentSong(artistSongs[0], artistSongs);
      setShuffle(false);
    }
  };

  const handleShuffle = async () => {
    if (artistSongs.length > 0) {
      // Shuffle the songs array
      const shuffled = [...artistSongs].sort(() => Math.random() - 0.5);
      await setCurrentSong(shuffled[0], shuffled);
      setShuffle(true);
    }
  };

  const formatDuration = (duration: string) => {
    return duration;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Main');
            }
          }}
        >
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
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

        {/* Artist Info */}
        <View style={styles.artistInfo}>
          <Text style={styles.artistName}>{artist.name}</Text>
          <Text style={styles.artistMeta}>
            {artist.albums} Album | {artist.songs} Songs | {formatDuration(artist.totalDuration)} mins
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.shuffleButton} onPress={handleShuffle}>
            <Text style={styles.shuffleIcon}>⇄</Text>
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Text style={styles.playIcon}>▶</Text>
            <Text style={styles.playText}>Play</Text>
          </TouchableOpacity>
        </View>

        {/* Songs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Songs</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Song List */}
          {artistSongs.map((song: Song, index: number) => {
            const songImageUrl = getImageUrl(song);
            const songName = song.name || '';
            const songArtist = song.primaryArtists || artist.name;
            const isCurrentSong = currentSong?.id === song.id;

            const handleSongPlay = async (e: any) => {
              e.stopPropagation();
              // If same song is playing, toggle play/pause
              if (isCurrentSong) {
                await togglePlayPause();
              } else {
                // Otherwise, set new song and play
                await setCurrentSong(song, artistSongs);
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
          })}
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
  artistInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  artistName: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artistMeta: {
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
});

