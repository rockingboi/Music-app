import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  PanResponder,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { colors } from '../theme/colors';

const cleanSongName = (name: string) => {
  if (!name) return '';
  // Remove content in parentheses and brackets
  return name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
};

const { width, height } = Dimensions.get('window');

export default function PlayerScreen() {
  const navigation = useNavigation<any>();
  const {
    currentSong,
    isPlaying,
    isLoading,
    position,
    duration,
    sound,
    shuffle,
    repeat,
    togglePlayPause,
    next,
    previous,
    setPosition,
    setShuffle,
    setRepeat,
    queue,
  } = usePlayerStore();

  const [seeking, setSeeking] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (!sound) return;

    const interval = setInterval(async () => {
      if (!seeking) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            usePlayerStore.setState({
              position: status.positionMillis || 0,
              duration: status.durationMillis || 0,
              isPlaying: status.isPlaying || false,
            });
          }
        } catch (error) {
          // Silently handle errors
        }
      }
    }, 250); // Update every 250ms for smooth progress bar

    return () => clearInterval(interval);
  }, [sound, seeking]);

  if (!currentSong) {
    return (
      <View style={styles.container}>
        <Text style={styles.noSongText}>No song selected</Text>
      </View>
    );
  }

  const imageUrl = useMemo(() => {
    if (!currentSong.image || !Array.isArray(currentSong.image) || currentSong.image.length === 0) {
      return undefined;
    }
    const highQuality = currentSong.image.find((img: any) => 
      img.quality === '500x500' || img.quality === '150x150'
    );
    const img = highQuality || currentSong.image[0];
    return (img as any)?.link || (img as any)?.url;
  }, [currentSong.image]);

  const progress = useMemo(() => {
    return duration > 0 ? (position / duration) * 100 : 0;
  }, [position, duration]);

  const formatTime = useCallback((millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const handleSeek = useCallback(async (value: number) => {
    if (!sound || duration === 0) return;
    try {
      const newPosition = Math.max(0, Math.min(value, duration));
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (error) {
      // Silently handle errors
    }
  }, [sound, duration]);

  const rewind10Seconds = useCallback(async () => {
    if (!sound || duration === 0) return;
    try {
      // Get current position from sound
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.positionMillis !== null) {
        const currentPos = status.positionMillis;
        const newPosition = Math.max(0, currentPos - 10000);
        await sound.setPositionAsync(newPosition);
        setPosition(newPosition);
      }
    } catch (error) {
      // Silently handle errors
    }
  }, [sound, duration]);

  const forward10Seconds = useCallback(async () => {
    if (!sound || duration === 0) return;
    try {
      // Get current position from sound
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.positionMillis !== null) {
        const currentPos = status.positionMillis;
        const newPosition = Math.min(duration, currentPos + 10000);
        await sound.setPositionAsync(newPosition);
        setPosition(newPosition);
      }
    } catch (error) {
      // Silently handle errors
    }
  }, [sound, duration]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setSeeking(true);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (duration > 0) {
        const progressBarWidth = width - 64;
        const x = Math.max(0, Math.min(gestureState.moveX - 32, progressBarWidth));
        const newPosition = (x / progressBarWidth) * duration;
        // Update position immediately for smooth seeking
        setPosition(newPosition);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (duration > 0) {
        const progressBarWidth = width - 64;
        const x = Math.max(0, Math.min(gestureState.moveX - 32, progressBarWidth));
        const newPosition = (x / progressBarWidth) * duration;
        handleSeek(newPosition);
      }
      setSeeking(false);
    },
  }), [duration, handleSeek]);

  const getRepeatIcon = () => {
    if (repeat === 'off') return '↻';
    if (repeat === 'one') return '↻';
    return '↻';
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
              (navigation as any).navigate('Main');
            }
          }}
        >
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerButtonCircle}
          onPress={() => setShowMenu(true)}
        >
          <Text style={styles.headerIconCircle}>⋮</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Album Art */}
        <View style={styles.albumArtContainer}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.albumArt}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.albumArt, styles.placeholderArt]}>
              <Text style={styles.placeholderText}>♪</Text>
            </View>
          )}
        </View>

        {/* Song Info */}
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {cleanSongName(currentSong.name)}
          </Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {currentSong.primaryArtists}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
          <View style={styles.progressBar} {...panResponder.panHandlers}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%` },
              ]}
            />
            <View
              style={[
                styles.progressThumb,
                { left: `${progress}%` },
              ]}
            />
          </View>
        </View>

        {/* Main Controls */}
        <View style={styles.mainControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={async () => {
              if (isNavigating) return;
              setIsNavigating(true);
              try {
                await previous();
              } catch (error) {
                console.log('Error going to previous:', error);
              } finally {
                setTimeout(() => setIsNavigating(false), 500);
              }
            }}
            disabled={isNavigating || isLoading}
          >
            <Text style={styles.controlIcon}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rewindButton}
            onPress={rewind10Seconds}
            disabled={isLoading}
          >
            <View style={styles.rewindButtonInner}>
              <Text style={styles.rewindIcon}>↺</Text>
              <Text style={styles.rewindText}>10</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <Text style={styles.playButtonIcon}>
                {isPlaying ? '⏸' : '▶'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forwardButton}
            onPress={forward10Seconds}
            disabled={isLoading}
          >
            <View style={styles.forwardButtonInner}>
              <Text style={styles.forwardIcon}>↻</Text>
              <Text style={styles.forwardText}>10</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={async () => {
              if (isNavigating) return;
              setIsNavigating(true);
              try {
                await next();
              } catch (error) {
                console.log('Error going to next:', error);
              } finally {
                setTimeout(() => setIsNavigating(false), 500);
              }
            }}
            disabled={isNavigating || isLoading}
          >
            <Text style={styles.controlIcon}>⏭</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Controls */}
        <View style={styles.secondaryControls}>
          <TouchableOpacity
            style={[styles.secondaryButton, shuffle && styles.secondaryButtonActive]}
            onPress={() => setShuffle(!shuffle)}
          >
            <Text style={[styles.secondaryIcon, shuffle && styles.secondaryIconActive]}>⇄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, repeat !== 'off' && styles.secondaryButtonActive]}
            onPress={() => {
              if (repeat === 'off') setRepeat('all');
              else if (repeat === 'all') setRepeat('one');
              else setRepeat('off');
            }}
          >
            <Text style={[styles.secondaryIcon, repeat !== 'off' && styles.secondaryIconActive]}>
              {getRepeatIcon()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              // TODO: Implement timer
            }}
          >
            <Text style={styles.secondaryIcon}>⏱</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              // TODO: Implement cast/connect
            }}
          >
            <Text style={styles.secondaryIcon}>📺</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Queue' as never)}
          >
            <Text style={styles.secondaryIcon}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lyrics Tab */}
      <TouchableOpacity
        style={styles.lyricsTab}
        onPress={() => setShowLyrics(!showLyrics)}
      >
        <Text style={styles.lyricsTabIcon}>{showLyrics ? '↓' : '↑'}</Text>
        <Text style={styles.lyricsTabText}>Lyrics</Text>
      </TouchableOpacity>

      {/* Lyrics Modal */}
      {showLyrics && (
        <View style={styles.lyricsContainer}>
          <ScrollView style={styles.lyricsContent}>
            <Text style={styles.lyricsText}>
              Lyrics not available for this song.
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '300',
  },
  headerButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconCircle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 60,
    paddingTop: 4,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 16,
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  albumArt: {
    width: width * 0.78,
    height: width * 0.78,
    borderRadius: 12,
    maxHeight: height * 0.42,
  },
  placeholderArt: {
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 60,
  },
  songInfo: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
    minHeight: 55,
  },
  songTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  artistName: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: -6,
    transform: [{ translateX: -8 }],
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  controlButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  controlIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  rewindButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  rewindButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewindIcon: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  rewindText: {
    fontSize: 9,
    color: colors.textPrimary,
    marginTop: -2,
    fontWeight: '500',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  playButtonIcon: {
    fontSize: 38,
    color: '#fff',
    marginLeft: 4,
  },
  forwardButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  forwardButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  forwardIcon: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  forwardText: {
    fontSize: 9,
    color: colors.textPrimary,
    marginTop: -2,
    fontWeight: '500',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 8,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  secondaryButtonActive: {
    backgroundColor: colors.primary,
    borderRadius: 25,
  },
  secondaryIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  secondaryIconActive: {
    color: '#000',
  },
  lyricsTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lyricsTabIcon: {
    color: colors.textPrimary,
    fontSize: 16,
    marginRight: 8,
  },
  lyricsTabText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  lyricsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  lyricsContent: {
    flex: 1,
    padding: 20,
  },
  lyricsText: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  noSongText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
