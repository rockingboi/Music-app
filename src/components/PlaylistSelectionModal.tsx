import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import { loadPlaylists, createPlaylist, addSongToPlaylist, Playlist } from '../utils/playlists';
import { Song } from '../store/playerStore';

type PlaylistSelectionModalProps = {
  visible: boolean;
  song: Song | null;
  onClose: () => void;
  onPlaylistCreated?: () => void;
};

export default function PlaylistSelectionModal({
  visible,
  song,
  onClose,
  onPlaylistCreated,
}: PlaylistSelectionModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPlaylistsList();
    }
  }, [visible]);

  const loadPlaylistsList = async () => {
    try {
      setLoading(true);
      const playlistsList = await loadPlaylists();
      setPlaylists(playlistsList);
    } catch (error) {
      console.log('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!song) return;
    try {
      setCreating(true);
      const newPlaylist = await createPlaylist(`My Playlist ${playlists.length + 1}`);
      await addSongToPlaylist(newPlaylist.id, song);
      await loadPlaylistsList();
      if (onPlaylistCreated) {
        onPlaylistCreated();
      }
    } catch (error) {
      console.log('Error creating playlist:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectPlaylist = async (playlist: Playlist) => {
    if (!song) return;
    try {
      await addSongToPlaylist(playlist.id, song);
      onClose();
    } catch (error) {
      console.log('Error adding song to playlist:', error);
    }
  };

  const renderPlaylist = ({ item }: { item: Playlist }) => {
    const isSongInPlaylist = song ? item.songs.some((s) => s.id === song.id) : false;

    return (
      <TouchableOpacity
        style={styles.playlistItem}
        onPress={() => handleSelectPlaylist(item)}
        disabled={isSongInPlaylist}
      >
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.playlistMeta}>
            {item.songs.length} {item.songs.length === 1 ? 'song' : 'songs'}
          </Text>
        </View>
        {isSongInPlaylist ? (
          <Feather name="check" size={20} color={colors.primary} />
        ) : (
          <Feather name="plus" size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Playlist</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreatePlaylist}
                disabled={creating}
              >
                <Feather name="plus-circle" size={20} color={colors.primary} />
                <Text style={styles.createButtonText}>
                  {creating ? 'Creating...' : 'Create New Playlist'}
                </Text>
              </TouchableOpacity>

              {playlists.length === 0 ? (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyText}>No playlists yet</Text>
                  <Text style={styles.emptySubtext}>
                    Create a playlist to get started
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={playlists}
                  keyExtractor={(item) => item.id}
                  renderItem={renderPlaylist}
                  style={styles.list}
                />
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    gap: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  list: {
    maxHeight: 400,
  },
  playlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  playlistMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

