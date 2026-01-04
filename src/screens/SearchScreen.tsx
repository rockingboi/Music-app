import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../store/playerStore';
import { searchSongs, searchAlbums, searchArtists } from '../api/saavn';
import { colors } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import { downloadSong, isDownloaded, deleteDownloadedSong } from '../utils/downloads';

const cleanSongName = (name: string) => {
  if (!name) return '';
  // Remove content in parentheses and brackets
  return name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
};

type SearchResult = {
  id: string;
  name: string;
  primaryArtists?: string;
  image: { quality: string; link: string }[];
  downloadUrl?: { quality: string; url: string }[];
  type?: string;
  duration?: string | number;
};

type Tab = 'songs' | 'albums' | 'artists';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('songs');
  const [songs, setSongs] = useState<SearchResult[]>([]);
  const [albums, setAlbums] = useState<SearchResult[]>([]);
  const [artists, setArtists] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  const { setCurrentSong, addToQueue } = usePlayerStore();

  useEffect(() => {
    // Check downloaded status for songs
    const checkDownloads = async () => {
      const downloaded = new Set<string>();
      for (const song of songs) {
        if (await isDownloaded(song.id)) {
          downloaded.add(song.id);
        }
      }
      setDownloadedIds(downloaded);
    };
    if (songs.length > 0) {
      checkDownloads();
    }
  }, [songs]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const [songsData, albumsData, artistsData] = await Promise.all([
        searchSongs(query),
        searchAlbums(query),
        searchArtists(query),
      ]);

      setSongs(songsData?.results || []);
      setAlbums(albumsData?.results || []);
      setArtists(artistsData?.results || []);
    } catch (error) {
      console.log('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSongPress = (song: SearchResult) => {
    if (song.downloadUrl) {
      setCurrentSong(song as any);
    }
  };

  const handleAddToQueue = (song: SearchResult) => {
    if (song.downloadUrl) {
      addToQueue(song as any);
    }
  };

  const handleDownload = async (song: SearchResult) => {
    if (!song.downloadUrl || song.downloadUrl.length === 0) {
      Alert.alert('Error', 'Download URL not available');
      return;
    }

    const isDownloadedSong = downloadedIds.has(song.id);
    
    if (isDownloadedSong) {
      // Delete download
      const deleted = await deleteDownloadedSong(song.id);
      if (deleted) {
        setDownloadedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(song.id);
          return newSet;
        });
        Alert.alert('Success', 'Song deleted from downloads');
      }
    } else {
      // Download song
      setDownloadingIds((prev) => new Set(prev).add(song.id));
      try {
        // Convert SearchResult to Song format
        const songToDownload: any = {
          ...song,
          duration: song.duration || '0',
          primaryArtists: song.primaryArtists || '',
        };
        
        const localPath = await downloadSong(songToDownload);
        if (localPath) {
          setDownloadedIds((prev) => new Set(prev).add(song.id));
          Alert.alert('Success', 'Song downloaded successfully');
        } else {
          Alert.alert('Error', 'Failed to download song');
        }
      } catch (error) {
        console.log('Download error:', error);
        Alert.alert('Error', 'Failed to download song');
      } finally {
        setDownloadingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(song.id);
          return newSet;
        });
      }
    }
  };

  const getImageUrl = (item: SearchResult) => {
    if (!item) return undefined;
    
    // Check if image is an array (from API response)
    if (item.image && Array.isArray(item.image) && item.image.length > 0) {
      // Try to get the highest quality image (usually 500x500 or 150x150)
      const highQuality = item.image.find((img) => 
        img.quality === '500x500' || img.quality === '150x150' || img.quality === '250x250'
      );
      const image = highQuality || item.image[0] || item.image[item.image.length - 1];
      
      // API uses 'link' for songs
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
      for (const img of item.image) {
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

  const renderSong = ({ item }: { item: SearchResult }) => {
    const imageUrl = getImageUrl(item);
    const isDownloadedSong = downloadedIds.has(item.id);
    const isDownloading = downloadingIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleSongPress(item)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>♪</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {cleanSongName(item.name)}
          </Text>
          {item.primaryArtists && (
            <Text style={styles.artist} numberOfLines={1}>
              {item.primaryArtists}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDownload(item);
          }}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather
              name={isDownloadedSong ? 'check-circle' : 'download'}
              size={20}
              color={isDownloadedSong ? colors.primary : colors.textPrimary}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            handleAddToQueue(item);
          }}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderAlbum = ({ item }: { item: SearchResult }) => {
    const imageUrl =
      item.image && item.image.length > 0
        ? item.image[item.image.length - 1].link
        : undefined;

    return (
      <TouchableOpacity style={styles.item}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderArtist = ({ item }: { item: SearchResult }) => {
    const imageUrl =
      item.image && item.image.length > 0
        ? item.image[item.image.length - 1].link
        : undefined;

    return (
      <TouchableOpacity style={styles.item}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getCurrentData = () => {
    if (activeTab === 'songs') return songs;
    if (activeTab === 'albums') return albums;
    return artists;
  };

  const renderCurrentList = () => {
    if (activeTab === 'songs') return renderSong;
    if (activeTab === 'albums') return renderAlbum;
    return renderArtist;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs, albums, artists..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText} numberOfLines={1}>
              Search
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'songs' && styles.activeTab]}
            onPress={() => setActiveTab('songs')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'songs' && styles.activeTabText,
              ]}
              numberOfLines={1}
            >
              Songs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'albums' && styles.activeTab]}
            onPress={() => setActiveTab('albums')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'albums' && styles.activeTabText,
              ]}
              numberOfLines={1}
            >
              Albums
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'artists' && styles.activeTab]}
            onPress={() => setActiveTab('artists')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'artists' && styles.activeTabText,
              ]}
              numberOfLines={1}
            >
              Artists
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : hasSearched && getCurrentData().length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyEmoji}>😞</Text>
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        ) : (
          <FlatList
            data={getCurrentData()}
            keyExtractor={(item) => item.id}
            renderItem={renderCurrentList()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.card,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 14,
    minHeight: 44,
    maxHeight: 44,
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    maxHeight: 44,
  },
  searchButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 140,
    paddingTop: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    minHeight: 60,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: colors.card,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  placeholderText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  artist: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  downloadButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 140,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
    color: colors.primary,
  },
  emptyText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});
