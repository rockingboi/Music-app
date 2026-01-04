import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePlayerStore, Song } from '../store/playerStore';
import { colors } from '../theme/colors';
import { searchArtists, getArtistDetails, getArtistSongs, getArtistAlbums } from '../api/saavn';

const cleanSongName = (name: string) => {
  if (!name) return '';
  // Remove content in parentheses and brackets
  return name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
};

type RouteParams = {
  title: string;
  data: any[];
  type: 'songs' | 'artists';
};

export default function SeeAllScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { setCurrentSong } = usePlayerStore();
  const { title, data, type } = route.params as RouteParams;
  
  const [allArtists, setAllArtists] = useState<any[]>(data || []);
  const [loading, setLoading] = useState(type === 'artists' && (!data || data.length === 0));
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [artistDetails, setArtistDetails] = useState<{ [key: string]: { songs: any[], albums: any[] } }>({});

  useEffect(() => {
    if (type === 'artists' && (!data || data.length === 0)) {
      loadAllArtists();
    }
  }, [type]);

  const loadAllArtists = async () => {
    try {
      setLoading(true);
      const queries = [
        'arijit singh', 'the weeknd', 'ariana grande', 'taylor swift', 'ed sheeran', 
        'pritam', 'atif aslam', 'shreya ghoshal', 'neha kakkar', 'diljit dosanjh',
        'ar rahman', 'sonu nigam', 'kumar sanu', 'udit narayan',
        'lata mangeshkar', 'asha bhosle', 'kishore kumar', 'mohammed rafi',
        'justin bieber', 'drake', 'eminem', 'billie eilish', 'post malone',
        'dua lipa', 'selena gomez', 'bruno mars', 'coldplay', 'imagine dragons',
        'alan walker', 'martin garrix', 'david guetta', 'calvin harris'
      ];
      
      const seenIds = new Set<string>();
      const allArtists: any[] = [];
      
      // First, get all artist search results quickly
      const searchPromises = queries.map(async (query) => {
        try {
          const artistsData = await searchArtists(query);
          return artistsData?.results || [];
        } catch (err) {
          return [];
        }
      });
      
      const allSearchResults = await Promise.all(searchPromises);
      const uniqueArtists = [];
      for (const results of allSearchResults) {
        for (const artist of results) {
          if (artist.id && !seenIds.has(artist.id)) {
            uniqueArtists.push(artist);
            seenIds.add(artist.id);
            if (uniqueArtists.length >= 40) break; // Limit initial search
          }
        }
        if (uniqueArtists.length >= 40) break;
      }
      
      // Process artists in batches with songs/albums check
      const batchSize = 5;
      for (let i = 0; i < uniqueArtists.length; i += batchSize) {
        const batch = uniqueArtists.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (artist) => {
          try {
            const [details, songsData, albumsData] = await Promise.all([
              getArtistDetails(artist.id).catch(() => null),
              getArtistSongs(artist.id).catch(() => ({ results: [], songs: [] })),
              getArtistAlbums(artist.id).catch(() => ({ results: [], albums: [] }))
            ]);
            
            const artistDetails = details || artist;
            const songs = songsData?.results || songsData?.songs || [];
            const albums = albumsData?.results || albumsData?.albums || [];
            
            // Only include artists with at least 2 songs AND 2 albums
            if (songs.length >= 2 && albums.length >= 2) {
              // Merge images
              const allImages = [];
              if (artistDetails.image && Array.isArray(artistDetails.image)) {
                allImages.push(...artistDetails.image);
              }
              if (artist.image && Array.isArray(artist.image)) {
                allImages.push(...artist.image);
              }
              
              const uniqueImages = allImages.filter((img, index, self) => 
                index === self.findIndex((i) => 
                  (i.url || i.link) === (img.url || img.link)
                )
              );
              
              return {
                id: artistDetails.id || artist.id,
                name: artistDetails.name || artistDetails.title || artist.name,
                image: uniqueImages.length > 0 ? uniqueImages : (artistDetails.image || artist.image || []),
                songs: songs.slice(0, 10),
                albums: albums.slice(0, 10),
                ...artistDetails,
                ...artist
              };
            }
            return null;
          } catch (err) {
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validArtists = batchResults.filter(a => a !== null);
        allArtists.push(...validArtists);
        
        if (allArtists.length >= 30) break; // Limit total artists
      }
      
      // Final filter: only artists with >= 2 songs AND >= 2 albums
      const filteredArtists = allArtists.filter(artist => 
        (artist.songs?.length || 0) >= 2 && (artist.albums?.length || 0) >= 2
      );
      
      setAllArtists(filteredArtists);
    } catch (err) {
      console.log('Error loading artists:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadArtistData = async (artistId: string) => {
    if (artistDetails[artistId]) return; // Already loaded
    
    try {
      const [songsData, albumsData] = await Promise.all([
        getArtistSongs(artistId).catch(() => ({ results: [] })),
        getArtistAlbums(artistId).catch(() => ({ results: [] }))
      ]);
      
      setArtistDetails({
        ...artistDetails,
        [artistId]: {
          songs: songsData?.results || songsData?.songs || [],
          albums: albumsData?.results || albumsData?.albums || []
        }
      });
    } catch (err) {
      console.log(`Error loading data for artist ${artistId}:`, err);
    }
  };

  const toggleArtist = (artistId: string) => {
    if (expandedArtist === artistId) {
      setExpandedArtist(null);
    } else {
      setExpandedArtist(artistId);
      loadArtistData(artistId);
    }
  };

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
      
      // Try all images in array
      for (const img of item.image) {
        const testUrl = img.url || img.link;
        if (testUrl && testUrl.startsWith('http') && 
            !testUrl.includes('artist-default') && 
            !testUrl.includes('default-music')) {
          return testUrl;
        }
      }
    }
    
    // Check if image is a direct string/url
    if (typeof item.image === 'string' && item.image.length > 0 && item.image.startsWith('http')) {
      return item.image;
    }
    
    // Check for thumbnail or other image properties
    if (item.thumbnail && typeof item.thumbnail === 'string' && item.thumbnail.startsWith('http')) {
      return item.thumbnail;
    }
    
    return undefined;
  };

  const onSongPress = (song: Song) => {
    setCurrentSong(song, data);
    navigation.navigate('Player');
  };

  const renderSongItem = ({ item }: { item: Song }) => {
    const imageUrl = getImageUrl(item);

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onSongPress(item)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>♪</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.songName} numberOfLines={1}>
            {cleanSongName(item.name)}
          </Text>
          {item.primaryArtists && (
            <Text style={styles.artist} numberOfLines={1}>
              {item.primaryArtists}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderArtistItem = ({ item }: { item: any }) => {
    const imageUrl = getImageUrl(item);
    const isExpanded = expandedArtist === item.id;
    const details = artistDetails[item.id];
    const songs = details?.songs || [];
    const albums = details?.albums || [];

    return (
      <View style={styles.artistItemContainer}>
        <TouchableOpacity 
          style={styles.artistItem}
          onPress={() => toggleArtist(item.id)}
        >
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.artistImage} 
              resizeMode="cover"
              onError={(e) => {
                console.log('Image failed to load:', imageUrl, item.name);
              }}
            />
          ) : (
            <View style={[styles.artistImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>⚫</Text>
            </View>
          )}
          <View style={styles.artistInfo}>
            <Text style={styles.artistName} numberOfLines={1}>
              {item.name || item.title}
            </Text>
            {isExpanded && (
              <Text style={styles.expandIcon}>▼</Text>
            )}
            {!isExpanded && (
              <Text style={styles.expandIcon}>▶</Text>
            )}
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.artistDetails}>
            {/* Songs Section */}
            {songs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Songs ({songs.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {songs.slice(0, 10).map((song: any, index: number) => {
                    const songImageUrl = getImageUrl(song);
                    return (
                      <TouchableOpacity
                        key={`${song.id || index}`}
                        style={styles.songCard}
                        onPress={() => {
                          if (song.id) {
                            setCurrentSong(song as Song, songs);
                            navigation.navigate('Player');
                          }
                        }}
                      >
                        {songImageUrl ? (
                          <Image source={{ uri: songImageUrl }} style={styles.songCardImage} resizeMode="cover" />
                        ) : (
                          <View style={[styles.songCardImage, styles.placeholderImage]}>
                            <Text style={styles.placeholderTextSmall}>♪</Text>
                          </View>
                        )}
                        <Text style={styles.songCardName} numberOfLines={1}>
                          {cleanSongName(song.name || song.title)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            
            {/* Albums Section */}
            {albums.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Albums ({albums.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {albums.slice(0, 10).map((album: any, index: number) => {
                    const albumImageUrl = getImageUrl(album);
                    return (
                      <TouchableOpacity
                        key={`${album.id || index}`}
                        style={styles.albumCard}
                      >
                        {albumImageUrl ? (
                          <Image source={{ uri: albumImageUrl }} style={styles.albumCardImage} resizeMode="cover" />
                        ) : (
                          <View style={[styles.albumCardImage, styles.placeholderImage]}>
                            <Text style={styles.placeholderTextSmall}>♪</Text>
                          </View>
                        )}
                        <Text style={styles.albumCardName} numberOfLines={1}>
                          {album.name || album.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            
            {songs.length === 0 && albums.length === 0 && (
              <Text style={styles.loadingText}>Loading songs and albums...</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Main');
            }
          }} 
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading artists...</Text>
        </View>
      ) : type === 'songs' ? (
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.id || index}`}
          renderItem={renderSongItem}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      ) : (
        <FlatList
          data={allArtists}
          keyExtractor={(item, index) => `${item.id || index}`}
          renderItem={renderArtistItem}
          contentContainerStyle={styles.list}
        />
      )}
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    padding: 8,
    minWidth: 60,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  item: {
    width: '48%',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  placeholderImage: {
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    color: colors.textSecondary,
  },
  info: {
    marginTop: 4,
  },
  songName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  artist: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  artistItemContainer: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  artistInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  artistName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  expandIcon: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: 8,
  },
  artistDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  songCard: {
    width: 120,
    marginRight: 12,
  },
  songCardImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 6,
  },
  songCardName: {
    color: colors.textPrimary,
    fontSize: 12,
    textAlign: 'center',
  },
  albumCard: {
    width: 120,
    marginRight: 12,
  },
  albumCardImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 6,
  },
  albumCardName: {
    color: colors.textPrimary,
    fontSize: 12,
    textAlign: 'center',
  },
  placeholderTextSmall: {
    fontSize: 30,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
});

