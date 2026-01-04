import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore, Song } from '../store/playerStore';
import { colors } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import { loadPlaylists, createPlaylist, deletePlaylist, Playlist } from '../utils/playlists';

const getImageUrl = (song: Song) => {
  if (song.image && Array.isArray(song.image) && song.image.length > 0) {
    const img = song.image[song.image.length - 1];
    return img.link || img.url;
  }
  if (typeof song.image === 'string') return song.image;
  return undefined;
};

export default function PlaylistsScreen() {
  const navigation = useNavigation<any>();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    loadPlaylistsList();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadPlaylistsList();
    }, [])
  );

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
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }
    try {
      await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateModal(false);
      await loadPlaylistsList();
    } catch (error) {
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const handleDeletePlaylist = (playlistId: string, playlistName: string) => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlistName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(playlistId);
            await loadPlaylistsList();
          },
        },
      ]
    );
  };

  const handlePlaylistPress = (playlist: Playlist) => {
    navigation.navigate('PlaylistDetail', {
      playlistId: playlist.id,
      playlist: playlist,
    });
  };

  const renderPlaylist = ({ item }: { item: Playlist }) => {
    const firstSong = item.songs[0];
    const imageUrl = firstSong ? getImageUrl(firstSong) : undefined;

    return (
      <TouchableOpacity
        style={styles.playlistItem}
        onPress={() => handlePlaylistPress(item)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.playlistImage} />
        ) : (
          <View style={[styles.playlistImage, styles.placeholderImage]}>
            <Feather name="music" size={24} color={colors.textSecondary} />
          </View>
        )}

        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.playlistMeta}>
            {item.songs.length} {item.songs.length === 1 ? 'song' : 'songs'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePlaylist(item.id, item.name)}
        >
          <Feather name="trash-2" size={18} color={colors.textSecondary} />
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Playlists</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Feather name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {playlists.length === 0 ? (
        <View style={styles.centerContainer}>
          <Feather name="list" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No playlists yet</Text>
          <Text style={styles.emptySubtext}>
            Create a playlist to organize your favorite songs
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>Create Playlist</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={renderPlaylist}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Playlist</Text>
            <TextInput
              style={styles.input}
              placeholder="Playlist name"
              placeholderTextColor={colors.textSecondary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButtonModal]}
                onPress={handleCreatePlaylist}
              >
                <Text style={styles.createButtonTextModal}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addButton: {
    padding: 8,
  },
  list: {
    paddingBottom: 120,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  playlistImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: colors.card,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
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
  deleteButton: {
    padding: 8,
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonModal: {
    backgroundColor: colors.primary,
  },
  createButtonTextModal: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

