import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { colors } from '../theme/colors';

const cleanSongName = (name: string) => {
  if (!name) return '';
  // Remove content in parentheses and brackets
  return name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
};

const getImageUrl = (song: any) => {
  if (!song) return undefined;
  
  if (song.image && Array.isArray(song.image) && song.image.length > 0) {
    const highQuality = song.image.find((img: any) => 
      img.quality === '500x500' || img.quality === '150x150' || img.quality === '250x250'
    );
    const image = highQuality || song.image[0] || song.image[song.image.length - 1];
    const url = image.url || image.link;
    if (url && (url.startsWith('http') || url.startsWith('https'))) {
      if (!url.includes('artist-default') && 
          !url.includes('default-music') && 
          !url.includes('default-film')) {
        return url;
      }
    }
    
    for (const img of song.image) {
      const testUrl = img.url || img.link;
      if (testUrl && testUrl.startsWith('http') && 
          !testUrl.includes('artist-default') && 
          !testUrl.includes('default-music')) {
        return testUrl;
      }
    }
  }
  
  if (typeof song.image === 'string' && song.image.startsWith('http')) {
    return song.image;
  }
  
  return undefined;
};

export default function MiniPlayer() {
  const navigation = useNavigation<any>();
  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    position,
    duration,
    next,
    previous,
    isLoading,
  } = usePlayerStore();

  // Don't show if no song is selected
  if (!currentSong) {
    return null;
  }

  const imageUrl = getImageUrl(currentSong);
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const onPress = () => {
    navigation.navigate('Player');
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Content Row: Image, Song Name, Previous, Play/Pause, Next */}
      <View style={styles.content}>
        {/* Song Image */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>♪</Text>
          </View>
        )}

        {/* Song Name */}
        <TouchableOpacity
          style={styles.info}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.songName} numberOfLines={1}>
            {cleanSongName(currentSong.name)}
          </Text>
        </TouchableOpacity>

        {/* Previous Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={async (e) => {
            e.stopPropagation();
            await previous();
          }}
          disabled={isLoading}
        >
          <Text style={styles.controlIcon}>⏮</Text>
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          disabled={isLoading}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={async (e) => {
            e.stopPropagation();
            await next();
          }}
          disabled={isLoading}
        >
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    position: 'absolute',
    bottom: 60, // Exactly above tabs (tab bar height is 60)
    left: 0,
    right: 0,
    zIndex: 1000,
    margin: 0,
    padding: 0,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 2,
    backgroundColor: colors.divider,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  image: {
    width: 45,
    height: 45,
    borderRadius: 4,
    backgroundColor: colors.divider,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  info: {
    flex: 1,
    marginRight: 4,
  },
  songName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '400',
  },
  controlButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 16,
    color: '#000',
  },
});

