import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors } from '../theme/colors';
import PlaylistSelectionModal from './PlaylistSelectionModal';
import { Song } from '../store/playerStore';

interface ArtistOptionsModalProps {
  visible: boolean;
  artist: {
    name?: string;
    title?: string;
    albums?: number | any[];
    songs?: number | Song[];
    image?: any;
  } | null;
  onClose: () => void;
}

export default function ArtistOptionsModal({
  visible,
  artist,
  onClose,
}: ArtistOptionsModalProps) {
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<Song | null>(null);

  if (!artist) return null;

  // Safely extract album and song counts
  let albums = 1;
  if (Array.isArray(artist.albums)) {
    albums = artist.albums.length;
  } else if (typeof artist.albums === 'number') {
    albums = artist.albums;
  }

  let songs = 0;
  if (Array.isArray(artist.songs)) {
    songs = artist.songs.length;
  } else if (typeof artist.songs === 'number') {
    songs = artist.songs;
  }

  const artistName = artist.name || artist.title || '';

  const getImageUrl = (artist: any) => {
    if (!artist) return undefined;
    if (artist.image && Array.isArray(artist.image) && artist.image.length > 0) {
      const image = artist.image[0] || artist.image[artist.image.length - 1];
      return image.url || image.link;
    }
    return undefined;
  };

  const imageUrl = getImageUrl(artist);

  const handleOptionPress = (option: string) => {
    if (option === 'Add to Playlist') {
      // For artists, we'll add the first song or show a message
      // In a real app, you might want to add all songs
      const artistSongs = Array.isArray(artist.songs) ? artist.songs : [];
      if (artistSongs.length > 0 && typeof artistSongs[0] === 'object') {
        setSelectedSongForPlaylist(artistSongs[0] as Song);
        setShowPlaylistModal(true);
      } else {
        // If no songs available, just close
        onClose();
      }
    } else {
      // Placeholder handler for other options
      console.log(`${option} pressed for ${artistName}`);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Artist Info */}
            <View style={styles.artistInfo}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.artistImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.artistImage, styles.placeholderImage]}>
                  <Text style={styles.placeholderText}>♪</Text>
                </View>
              )}
              <View style={styles.artistDetails}>
                <Text style={styles.artistName}>{artistName}</Text>
                <Text style={styles.artistMeta}>
                  {String(albums)} {albums === 1 ? 'Album' : 'Albums'} | {String(songs)} {songs === 1 ? 'Song' : 'Songs'}
                </Text>
              </View>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress('Play')}
              >
                <Text style={styles.optionIcon}>▶</Text>
                <Text style={styles.optionText}>Play</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress('Play Next')}
              >
                <Text style={styles.optionIcon}>→</Text>
                <Text style={styles.optionText}>Play Next</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress('Add to Playing Queue')}
              >
                <Text style={styles.optionIcon}>+</Text>
                <Text style={styles.optionText}>Add to Playing Queue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress('Add to Playlist')}
              >
                <Text style={styles.optionIcon}>+</Text>
                <Text style={styles.optionText}>Add to Playlist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress('Share')}
              >
                <Text style={styles.optionIcon}>↗</Text>
                <Text style={styles.optionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Playlist Selection Modal for adding artist songs */}
      <PlaylistSelectionModal
        visible={showPlaylistModal}
        song={selectedSongForPlaylist}
        onClose={() => {
          setShowPlaylistModal(false);
          setSelectedSongForPlaylist(null);
          onClose();
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  artistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: colors.divider,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  artistDetails: {
    flex: 1,
  },
  artistName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  artistMeta: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionIcon: {
    color: colors.textPrimary,
    fontSize: 20,
    marginRight: 16,
    width: 24,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
});

