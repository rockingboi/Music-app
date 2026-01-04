import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { usePlayerStore, Song } from '../store/playerStore';
import { colors } from '../theme/colors';

const cleanSongName = (name: string) => {
  if (!name) return '';
  // Remove content in parentheses and brackets
  return name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
};

export default function QueueScreen() {
  const { queue, currentIndex, currentSong, setCurrentSong, removeFromQueue, reorderQueue } =
    usePlayerStore();

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderQueue(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < queue.length - 1) {
      reorderQueue(index, index + 1);
    }
  };

  const renderItem = ({ item, index }: { item: Song; index: number }) => {
    const isCurrent = index === currentIndex;
    const imageUrl =
      item.image && item.image.length > 0
        ? item.image[item.image.length - 1].link
        : undefined;

    return (
      <TouchableOpacity
        style={[styles.item, isCurrent && styles.currentItem]}
        onPress={() => setCurrentSong(item, queue)}
      >
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        )}

        <View style={styles.info}>
          <Text
            style={[styles.songName, isCurrent && styles.currentSongName]}
            numberOfLines={1}
          >
            {cleanSongName(item.name)}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {item.primaryArtists}
          </Text>
        </View>

        <View style={styles.controls}>
          {/* Move Up Button */}
          <TouchableOpacity
            style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
            onPress={() => handleMoveUp(index)}
            disabled={index === 0}
          >
            <Text style={[styles.reorderButtonText, index === 0 && styles.reorderButtonTextDisabled]}>↑</Text>
          </TouchableOpacity>

          {/* Move Down Button */}
          <TouchableOpacity
            style={[styles.reorderButton, index === queue.length - 1 && styles.reorderButtonDisabled]}
            onPress={() => handleMoveDown(index)}
            disabled={index === queue.length - 1}
          >
            <Text style={[styles.reorderButtonText, index === queue.length - 1 && styles.reorderButtonTextDisabled]}>↓</Text>
          </TouchableOpacity>

          {/* Remove Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFromQueue(index)}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (queue.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Queue is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Queue ({queue.length})</Text>
      <FlatList
        data={queue}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    paddingTop: 12,
  },
  list: {
    paddingBottom: 100,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  currentItem: {
    backgroundColor: colors.card,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  songName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  currentSongName: {
    color: colors.primary,
  },
  artist: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: colors.card,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  reorderButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reorderButtonTextDisabled: {
    color: colors.textSecondary,
  },
  removeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  removeButtonText: {
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});

