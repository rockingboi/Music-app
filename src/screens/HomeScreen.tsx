import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { searchSongs, searchArtists, searchAlbums, getArtistDetails, getArtistSongs, getArtistAlbums, getAlbumDetails, getAlbumSongs } from '../api/saavn';
import { usePlayerStore, Song } from '../store/playerStore';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ArtistOptionsModal from '../components/ArtistOptionsModal';
import PlaylistSelectionModal from '../components/PlaylistSelectionModal';
import { toggleFavorite, isFavorite } from '../utils/favorites';
import { Feather } from '@expo/vector-icons';
import { downloadSong, isDownloaded, deleteDownloadedSong } from '../utils/downloads';

type TabType = 'suggested' | 'songs' | 'artists' | 'albums' | 'queue';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { setCurrentSong, addToQueue, addToQueueNext, currentSong, isPlaying, togglePlayPause, queue, currentIndex, removeFromQueue, reorderQueue } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<TabType>('suggested');
  const [suggestedSongs, setSuggestedSongs] = useState<Song[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [mostPlayed, setMostPlayed] = useState<Song[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'name' | 'artist' | 'album' | 'year' | 'dateAdded' | 'dateModified' | 'composer'>('name');
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showSongMenu, setShowSongMenu] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
  const [showArtistOptions, setShowArtistOptions] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [songFavoriteStatus, setSongFavoriteStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (selectedSong) {
        const status = await isFavorite(selectedSong.id);
        setSongFavoriteStatus((prev) => ({
          ...prev,
          [selectedSong.id]: status,
        }));
      }
    };
    checkFavoriteStatus();
  }, [selectedSong]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all initial data in parallel including artists
      const [suggestedData, recentData, mostPlayedData, allSongsData] = await Promise.all([
        searchSongs('trending'),
        searchSongs('popular'),
        searchSongs('hits'),
        searchSongs('trending')
      ]);

      // Load suggested songs
      const suggested = suggestedData?.results?.slice(0, 10) || [];
      setSuggestedSongs(suggested);

      // Load recent songs (using popular songs as recent)
      const recent = recentData?.results?.slice(0, 10) || [];
      setRecentSongs(recent);

      // Load most played (using trending as most played)
      const mostPlayedList = mostPlayedData?.results?.slice(0, 10) || [];
      setMostPlayed(mostPlayedList);

      // Load all songs for Songs tab
      const songs = allSongsData?.results || [];
      setAllSongs(songs);
      
      setLoading(false);
      
      // Load artists and albums in background after initial render
      setTimeout(() => {
        Promise.all([
          loadArtistsInBackground(),
          fetchAlbums()
        ]);
      }, 500);
    } catch (error) {
      console.log('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadArtistsInBackground = async () => {
    // Load artists with their images, songs, and albums (optimized)
    let artistsList = [];
    try {
      // Search for popular artists (reduced list for faster loading)
      const queries = [
        'arijit singh', 'the weeknd', 'ariana grande', 'taylor swift', 'ed sheeran', 
        'pritam', 'atif aslam', 'shreya ghoshal', 'neha kakkar', 'diljit dosanjh',
        'ar rahman', 'sonu nigam', 'justin bieber', 'drake', 'eminem'
      ];
      
      const seenIds = new Set<string>();
      const allArtists: any[] = [];
      
      // First, get all artist IDs quickly
      const artistPromises = queries.slice(0, 10).map(async (query) => {
        try {
          const artistsData = await searchArtists(query);
          return artistsData?.results?.[0] || null;
        } catch (err) {
          return null;
        }
      });
      
      const searchResults = await Promise.all(artistPromises);
      const validArtists = searchResults.filter(a => a && a.id && !seenIds.has(a.id));
      
      // Now fetch details, songs, and albums in parallel batches
      const batchSize = 3; // Process 3 artists at a time
      for (let i = 0; i < validArtists.length; i += batchSize) {
        const batch = validArtists.slice(i, i + batchSize);
        
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
              
              const images = uniqueImages.length > 0 ? uniqueImages : (artistDetails.image || artist.image || []);
              
              if (images.length > 0) {
                seenIds.add(artist.id);
                return {
                  id: artistDetails.id || artist.id,
                  name: artistDetails.name || artistDetails.title || artist.name,
                  image: images,
                  songs: songs.slice(0, 10),
                  albums: albums.slice(0, 10),
                  ...artistDetails
                };
              }
            }
            return null;
          } catch (err) {
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validBatchArtists = batchResults.filter(a => a !== null);
        allArtists.push(...validBatchArtists);
        
        // Stop if we have enough artists
        if (allArtists.length >= 15) break;
      }
      
      // Filter to only artists with >= 2 songs AND >= 2 albums
      artistsList = allArtists.filter(artist => 
        (artist.songs?.length || 0) >= 2 && (artist.albums?.length || 0) >= 2
      );
      
      console.log(`Loaded ${artistsList.length} artists with >= 2 songs and >= 2 albums`);
    } catch (err) {
      console.log('Error loading artists:', err);
    }
    setArtists(artistsList);
  };

  // Fetch albums from artists API with song counts
  const fetchAlbums = async () => {
    try {
      // First, get some popular artists to fetch their albums
      const artistQueries = [
        'arijit singh', 'the weeknd', 'ariana grande', 'taylor swift', 'ed sheeran',
        'pritam', 'atif aslam', 'shreya ghoshal', 'neha kakkar', 'diljit dosanjh'
      ];
      
      const allAlbums: any[] = [];
      const seenAlbumIds = new Set<string>();
      
      // Fetch albums from multiple artists
      for (const query of artistQueries.slice(0, 8)) {
        try {
          // Search for artist
          const artistData = await searchArtists(query);
          const artist = artistData?.results?.[0];
          
          if (artist && artist.id) {
            // Get albums for this artist
            const albumsData = await getArtistAlbums(artist.id);
            const artistAlbums = albumsData?.results || albumsData?.albums || [];
            
            // Get all artist songs first to filter by album
            let allArtistSongs: any[] = [];
            try {
              const artistSongsData = await getArtistSongs(artist.id);
              allArtistSongs = artistSongsData?.results || artistSongsData?.songs || artistSongsData?.data || [];
              console.log(`Artist ${artist.name}: Found ${allArtistSongs.length} total songs`);
            } catch (err) {
              console.log(`Could not fetch songs for artist ${artist.name}`);
            }
            
            // For each album, filter songs from artist songs
            const batchSize = 3;
            for (let i = 0; i < artistAlbums.length && i < 5; i += batchSize) {
              const batch = artistAlbums.slice(i, i + batchSize);
              
              const albumPromises = batch.map(async (album: any) => {
                try {
                  // Skip if we've already seen this album
                  if (album.id && seenAlbumIds.has(album.id)) {
                    return null;
                  }
                  
                  // Filter artist songs by album ID or album name
                  let songs: any[] = [];
                  const albumId = album.id || album.albumId;
                  const albumName = album.name || album.title;
                  
                  if (allArtistSongs.length > 0 && albumId) {
                    songs = allArtistSongs.filter((song: any) => {
                      const songAlbumId = song.album?.id || song.albumId;
                      const songAlbumName = song.album?.name || song.albumName;
                      
                      // Match by ID (preferred) or name (case insensitive)
                      const idMatch = albumId && songAlbumId && String(songAlbumId) === String(albumId);
                      const nameMatch = albumName && songAlbumName && 
                                       songAlbumName.toLowerCase().trim() === albumName.toLowerCase().trim();
                      
                      return idMatch || nameMatch;
                    });
                    
                    console.log(`Album ${albumName || albumId} (ID: ${albumId}): Filtered ${songs.length} songs from ${allArtistSongs.length} artist songs`);
                    if (songs.length === 0 && allArtistSongs.length > 0) {
                      // Debug: show first few songs' album info
                      console.log('Sample song album info:', {
                        firstSong: allArtistSongs[0]?.name,
                        firstSongAlbumId: allArtistSongs[0]?.album?.id,
                        firstSongAlbumName: allArtistSongs[0]?.album?.name,
                        targetAlbumId: albumId,
                        targetAlbumName: albumName
                      });
                    }
                  } else {
                    console.log(`Album ${albumName || albumId}: No artist songs available or no album ID`);
                  }
                  
                  const songCount = songs.length || album.songCount || 0;
                  
                  // Mark album as seen
                  if (album.id) {
                    seenAlbumIds.add(album.id);
                  }
                  
                  return {
                    ...album,
                    songCount: songCount,
                    songs: songs, // Now we have actual songs!
                    primaryArtists: artist.name || album.primaryArtists || album.artists,
                  };
                } catch (err) {
                  return null;
                }
              });
              
              const batchResults = await Promise.all(albumPromises);
              const validAlbums = batchResults.filter(a => a !== null);
              allAlbums.push(...validAlbums);
              
              // Stop if we have enough albums
              if (allAlbums.length >= 50) break;
            }
          }
          
          if (allAlbums.length >= 50) break;
        } catch (err) {
          console.log(`Error fetching albums for ${query}:`, err);
        }
      }
      
      console.log(`Loaded ${allAlbums.length} albums with song counts`);
      setAlbums(allAlbums);
    } catch (error) {
      console.log('Error fetching albums:', error);
    }
  };

  // Handle album press - navigate to album detail
  const onAlbumPress = (album: any) => {
    // Pass both album ID and album data for fallback
    navigation.navigate('AlbumDetail', { 
      albumId: album.id,
      album: album // Pass full album object as fallback
    });
  };

  // Handle album menu press
  const onAlbumMenuPress = (albumId: string) => {
    // Placeholder handler
  };

  // Handle sort press for albums
  const onSortPress = () => {
    // Use existing sort mechanism
    setShowSortModal(true);
  };

  // Handle tab change
  const onTabChange = (tabName: TabType) => {
    setActiveTab(tabName);
  };

  const formatDuration = (durationStr: string) => {
    try {
      const seconds = parseInt(durationStr);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } catch {
      return '00:00';
    }
  };

  const cleanSongName = (name: string) => {
    if (!name) return '';
    // Remove content in parentheses and brackets
    return name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
  };

  const onSongPress = (song: Song) => {
    setCurrentSong(song);
    navigation.navigate('Player');
  };

  const onPlayPress = (song: Song, e: any) => {
    e.stopPropagation();
    setCurrentSong(song);
    navigation.navigate('Player');
  };

  const handleAddToBlacklist = async (song: Song) => {
    try {
      const blacklistKey = '@blacklist_songs';
      const existingBlacklist = await AsyncStorage.getItem(blacklistKey);
      const blacklist = existingBlacklist ? JSON.parse(existingBlacklist) : [];
      
      if (!blacklist.includes(song.id)) {
        blacklist.push(song.id);
        await AsyncStorage.setItem(blacklistKey, JSON.stringify(blacklist));
        Alert.alert('Success', `${cleanSongName(song.name)} has been added to blacklist`);
      } else {
        Alert.alert('Info', 'This song is already in blacklist');
      }
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      Alert.alert('Error', 'Failed to add song to blacklist');
    }
  };

  const handleShare = async (song: Song) => {
    try {
      const songName = cleanSongName(song.name);
      const shareMessage = `Check out this song: ${songName} by ${song.primaryArtists}`;
      
      await Share.share({
        message: shareMessage,
        title: songName,
      });
    } catch (error) {
      console.error('Error sharing song:', error);
    }
  };

  const handleDeleteFromDevice = (song: Song) => {
    Alert.alert(
      'Delete Song',
      `Are you sure you want to delete "${cleanSongName(song.name)}" from device?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove from all local lists
              setAllSongs((prev) => prev.filter((s) => s.id !== song.id));
              setSuggestedSongs((prev) => prev.filter((s) => s.id !== song.id));
              setRecentSongs((prev) => prev.filter((s) => s.id !== song.id));
              setMostPlayed((prev) => prev.filter((s) => s.id !== song.id));
              
              Alert.alert('Success', 'Song deleted from device');
            } catch (error) {
              console.error('Error deleting song:', error);
              Alert.alert('Error', 'Failed to delete song');
            }
          },
        },
      ]
    );
  };

  const getImageUrl = (item: any) => {
    if (!item) return undefined;
    
    // Check if image is an array (from API response)
    if (item.image && Array.isArray(item.image) && item.image.length > 0) {
      // Try to get the highest quality image (usually 500x500 or 150x150)
      const highQuality = item.image.find((img: any) => 
        img.quality === '500x500' || img.quality === '150x150'
      );
      const image = highQuality || item.image[item.image.length - 1];
      
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
    
    // Check for other possible image field names
    const possibleFields = ['imageUrl', 'thumbnail', 'cover', 'artwork', 'picture', 'photo', 'avatar'];
    for (const field of possibleFields) {
      if (item[field]) {
        const url = typeof item[field] === 'string' 
          ? item[field] 
          : (item[field].url || item[field].link);
        if (url && (url.startsWith('http') || url.startsWith('https'))) {
          return url;
        }
      }
    }
    
    return undefined;
  };

  const renderSongCard = (song: Song) => {
    const imageUrl = getImageUrl(song);
    const durationStr = typeof song.duration === 'string' 
      ? song.duration 
      : String(song.duration || '0');
    const formattedDuration = formatDuration(durationStr);
    const artistName = song.primaryArtists || 'Unknown Artist';

    return (
      <TouchableOpacity
        style={styles.songCard}
        onPress={() => onSongPress(song)}
      >
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.songImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.songImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>♪</Text>
          </View>
        )}
        <Text style={styles.songTitle} numberOfLines={1}>
          {cleanSongName(song.name)}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {artistName}
        </Text>
        <Text style={styles.songTime}>
          {formattedDuration}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderArtistCard = (artist: any) => {
    const imageUrl = getImageUrl(artist);

    return (
      <TouchableOpacity style={styles.artistCard}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.artistImage}
            resizeMode="cover"
            onError={() => {
              console.log('Image failed to load:', imageUrl);
            }}
          />
        ) : (
          <View style={[styles.artistImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>⚫</Text>
          </View>
        )}
        <Text style={styles.artistName} numberOfLines={1}>
          {artist.name || artist.title}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render horizontal section using ScrollView instead of FlatList
  const renderHorizontalSection = (
    title: string,
    data: any[],
    renderItem: (item: any, index: number) => React.ReactElement,
    type: 'songs' | 'artists' = 'songs'
  ) => {
    if (data.length === 0) return null;

    const handleSeeAll = () => {
      navigation.navigate('SeeAll', {
        title: title,
        data: data,
        type: type,
      });
    };

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity onPress={handleSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {data.map((item, index) => (
            <View key={`${item.id || index}-${title}`}>
              {renderItem(item, index)}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Sort songs based on selected criteria
  const sortSongs = (songs: Song[]) => {
    return [...songs].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = cleanSongName(a.name).localeCompare(cleanSongName(b.name));
          break;
        case 'artist':
          comparison = (a.primaryArtists || '').localeCompare(b.primaryArtists || '');
          break;
        case 'album':
          comparison = (a.album?.name || '').localeCompare(b.album?.name || '');
          break;
        case 'year':
          const yearA = parseInt(a.year || '0');
          const yearB = parseInt(b.year || '0');
          comparison = yearA - yearB;
          break;
        case 'dateAdded':
          // Use year as fallback for dateAdded
          const dateA = a.year || '0';
          const dateB = b.year || '0';
          comparison = dateA.localeCompare(dateB);
          break;
        case 'dateModified':
          // Use year as fallback for dateModified
          const modDateA = a.year || '0';
          const modDateB = b.year || '0';
          comparison = modDateA.localeCompare(modDateB);
          break;
        case 'composer':
          // Use primaryArtists as composer fallback
          comparison = (a.primaryArtists || '').localeCompare(b.primaryArtists || '');
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Render songs list view with proper formatting
  const renderSongsList = () => {
    const sortedSongs = sortSongs(allSongs);

    const getSortLabel = () => {
      switch (sortBy) {
        case 'name':
          return sortOrder === 'asc' ? 'Ascending' : 'Descending';
        case 'artist':
          return 'Artist';
        case 'album':
          return 'Album';
        case 'year':
          return 'Year';
        case 'dateAdded':
          return 'Date Added';
        case 'dateModified':
          return 'Date Modified';
        case 'composer':
          return 'Composer';
        default:
          return 'Ascending';
      }
    };

    return (
      <View style={styles.songsContainer}>
        {/* Header with count and sort */}
        <View style={styles.songsHeader}>
          <Text style={styles.songCount}>{allSongs.length} songs</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Text style={styles.sortText}>{getSortLabel()}</Text>
            <Text style={styles.sortIcon}>⇅</Text>
          </TouchableOpacity>
        </View>

        {/* Sort Options Modal */}
        <Modal
          visible={showSortModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSortModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSortModal(false)}
          >
            <View style={styles.sortModal} onStartShouldSetResponder={() => true}>
              <Text style={styles.sortModalTitle}>Sort By</Text>
              
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => {
                  setSortBy('name');
                  setSortOrder('asc');
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.sortOptionText}>Ascending</Text>
                {(sortBy === 'name' && sortOrder === 'asc') && (
                  <View style={styles.sortOptionSelected} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => {
                  setSortBy('name');
                  setSortOrder('desc');
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.sortOptionText}>Descending</Text>
                {(sortBy === 'name' && sortOrder === 'desc') && (
                  <View style={styles.sortOptionSelected} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => {
                  setSortBy('artist');
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.sortOptionText}>Artist</Text>
                {sortBy === 'artist' && (
                  <View style={styles.sortOptionSelected} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => {
                  setSortBy('album');
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.sortOptionText}>Album</Text>
                {sortBy === 'album' && (
                  <View style={styles.sortOptionSelected} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => {
                  setSortBy('year');
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.sortOptionText}>Year</Text>
                {sortBy === 'year' && (
                  <View style={styles.sortOptionSelected} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => {
                  setSortBy('dateAdded');
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.sortOptionText}>Date Added</Text>
                {sortBy === 'dateAdded' && (
                  <View style={styles.sortOptionSelected} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => {
                  setSortBy('dateModified');
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.sortOptionText}>Date Modified</Text>
                {sortBy === 'dateModified' && (
                  <View style={styles.sortOptionSelected} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => {
                  setSortBy('composer');
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.sortOptionText}>Composer</Text>
                {sortBy === 'composer' && (
                  <View style={styles.sortOptionSelected} />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Song Context Menu Modal */}
        <Modal
          visible={showSongMenu}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSongMenu(false)}
          statusBarTranslucent={true}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowSongMenu(false)}
          >
            <View
              style={styles.songMenuContainer}
              onStartShouldSetResponder={() => true}
            >
              {selectedSong && (
                <>
                  {/* Song Info Header */}
                  <View style={styles.songMenuHeader}>
                    {getImageUrl(selectedSong) && (
                      <Image
                        source={{ uri: getImageUrl(selectedSong)! }}
                        style={styles.songMenuImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.songMenuInfo}>
                      <Text style={styles.songMenuTitle} numberOfLines={1}>
                        {cleanSongName(selectedSong.name)}
                      </Text>
                      <Text style={styles.songMenuArtist} numberOfLines={1}>
                        {selectedSong.primaryArtists}
                      </Text>
                      <Text style={styles.songMenuDuration}>
                        {formatDuration(selectedSong.duration)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.songMenuFavorite}
                      onPress={async () => {
                        if (selectedSong) {
                          const newStatus = await toggleFavorite(selectedSong);
                          setSongFavoriteStatus((prev) => ({
                            ...prev,
                            [selectedSong.id]: newStatus,
                          }));
                        }
                      }}
                    >
                      <Feather
                        name="heart"
                        size={24}
                        color={songFavoriteStatus[selectedSong?.id || ''] ? colors.primary : colors.textSecondary}
                        fill={songFavoriteStatus[selectedSong?.id || ''] ? colors.primary : 'none'}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Menu Options */}
                  <ScrollView style={styles.songMenuOptions} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => {
                        addToQueueNext(selectedSong);
                        setShowSongMenu(false);
                      }}
                    >
                      <View style={styles.menuOptionIcon}>
                        <Text style={styles.menuIconText}>→</Text>
                      </View>
                      <Text style={styles.menuOptionText}>Play Next</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => {
                        addToQueue(selectedSong);
                        setShowSongMenu(false);
                      }}
                    >
                      <View style={styles.menuOptionIcon}>
                        <Text style={styles.menuIconText}>☰+</Text>
                      </View>
                      <Text style={styles.menuOptionText}>Add to Playing Queue</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => {
                        setShowSongMenu(false);
                        setShowPlaylistModal(true);
                      }}
                    >
                      <View style={styles.menuOptionIcon}>
                        <Text style={styles.menuIconText}>+</Text>
                      </View>
                      <Text style={styles.menuOptionText}>Add to Playlist</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => {
                        // TODO: Navigate to album
                        setShowSongMenu(false);
                      }}
                    >
                      <View style={styles.menuOptionIcon}>
                        <Text style={styles.menuIconText}>▶</Text>
                      </View>
                      <Text style={styles.menuOptionText}>Go to Album</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => {
                        // TODO: Navigate to artist
                        setShowSongMenu(false);
                      }}
                    >
                      <View style={styles.menuOptionIcon}>
                        <Text style={styles.menuIconText}>⚫</Text>
                      </View>
                      <Text style={styles.menuOptionText}>Go to Artist</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => {
                        // TODO: Show details
                        setShowSongMenu(false);
                      }}
                    >
                      <View style={styles.menuOptionIcon}>
                        <Text style={styles.menuIconText}>i</Text>
                      </View>
                      <Text style={styles.menuOptionText}>Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={async () => {
                        if (!selectedSong) return;
                        
                        try {
                          const isDownloadedSong = await isDownloaded(selectedSong.id);
                          
                          if (isDownloadedSong) {
                            // Delete download
                            const deleted = await deleteDownloadedSong(selectedSong.id);
                            if (deleted) {
                              Alert.alert('Success', 'Song deleted from downloads');
                            }
                          } else {
                            // Download song
                            if (!selectedSong.downloadUrl || selectedSong.downloadUrl.length === 0) {
                              Alert.alert('Error', 'Download URL not available');
                              setShowSongMenu(false);
                              return;
                            }
                            
                            const localPath = await downloadSong(selectedSong);
                            if (localPath) {
                              Alert.alert('Success', 'Song downloaded successfully');
                            } else {
                              Alert.alert('Error', 'Failed to download song');
                            }
                          }
                        } catch (error) {
                          console.log('Download error:', error);
                          Alert.alert('Error', 'Failed to download song');
                        }
                        setShowSongMenu(false);
                      }}
                    >
                      <View style={styles.menuOptionIcon}>
                        <Text style={styles.menuIconText}>⬇</Text>
                      </View>
                      <Text style={styles.menuOptionText}>Download</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => {
                        // TODO: Set as ringtone
                        setShowSongMenu(false);
                      }}
                    >
                      <View style={styles.menuOptionIcon}>
                        <Text style={styles.menuIconText}>☎</Text>
                      </View>
                      <Text style={styles.menuOptionText}>Set as Ringtone</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => {
                        if (selectedSong) {
                          handleAddToBlacklist(selectedSong);
                        }
                        setShowSongMenu(false);
                      }}
                    >
                      <View style={styles.menuOptionIcon}>
                        <Text style={styles.menuIconText}>×</Text>
                      </View>
                      <Text style={styles.menuOptionText}>Add to Blacklist</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => {
                        if (selectedSong) {
                          handleShare(selectedSong);
                        }
                        setShowSongMenu(false);
                      }}
                    >
                      <View style={styles.menuOptionIcon}>
                        <Text style={styles.menuIconText}>↗</Text>
                      </View>
                      <Text style={styles.menuOptionText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => {
                        if (selectedSong) {
                          handleDeleteFromDevice(selectedSong);
                        }
                        setShowSongMenu(false);
                      }}
                    >
                      <View style={styles.menuOptionIcon}>
                        <Text style={styles.menuIconText}>⌫</Text>
                      </View>
                      <Text style={styles.menuOptionText}>Delete from Device</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Songs List */}
        <ScrollView
          style={styles.songsList}
          contentContainerStyle={styles.songsListContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedSongs.map((song, index) => {
            const imageUrl = getImageUrl(song);

            return (
              <View
                key={`${song.id || index}`}
                style={styles.songListItem}
              >
                <TouchableOpacity
                  style={styles.songListItemContent}
                  onPress={() => onSongPress(song)}
                  activeOpacity={0.7}
                >
                  {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
                      style={styles.songListImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.songListImage, styles.placeholderImage]}>
                      <Text style={styles.placeholderText}>♪</Text>
                    </View>
                  )}

                  <View style={styles.songListInfo}>
                    <Text style={styles.songListTitle} numberOfLines={1}>
                      {cleanSongName(song.name)}
                    </Text>
                    <Text style={styles.songListDetails} numberOfLines={1}>
                      {song.primaryArtists}{song.album?.name ? ` • ${song.album.name}` : ''} • {formatDuration(song.duration)}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.songListActions}>
                  <TouchableOpacity
                    style={styles.songPlayButton}
                    onPress={async () => {
                      // If same song is playing, toggle play/pause
                      if (currentSong?.id === song.id) {
                        await togglePlayPause();
                      } else {
                        // Otherwise, set new song and play
                        await setCurrentSong(song);
                      }
                    }}
                  >
                    <Text style={styles.songPlayIcon}>
                      {currentSong?.id === song.id && isPlaying ? '⏸' : '▶'}
          </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.songMenuButton}
                    onPress={() => {
                      console.log('Three dots clicked for song:', song.name);
                      setSelectedSong(song);
                      setShowSongMenu(true);
                      console.log('Menu should be visible now');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.songMenuIcon}>⋮</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const getTabData = () => {
    switch (activeTab) {
      case 'suggested':
        return suggestedSongs;
      case 'songs':
        return allSongs;
      case 'artists':
        return artists;
      case 'albums':
        return albums;
      default:
        return [];
    }
  };

  // Render list view for albums
  const renderListView = (data: any[]) => {
    return (
      <View style={styles.tabContent}>
        {data.map((item, index) => {
    const imageUrl =
      item.image && item.image.length > 0
        ? item.image[item.image.length - 1].link
        : undefined;

    return (
      <TouchableOpacity
              key={`${item.id || index}`}
              style={styles.listItem}
              onPress={() => activeTab === 'albums' && onSongPress(item)}
      >
        {imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.listImage} />
              )}
              <View style={styles.listInfo}>
                <Text style={styles.listTitle} numberOfLines={1}>
                  {cleanSongName(item.name || item.title)}
                </Text>
                {item.primaryArtists && (
                  <Text style={styles.listArtist} numberOfLines={1}>
            {item.primaryArtists}
          </Text>
                )}
        </View>
      </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render grid view for artists
  const renderArtistsList = () => {
    // Mock data for artists list
    const mockArtists = [
      { id: '1', name: 'Ariana Grande', albums: 1, songs: 20, image: null },
      { id: '2', name: 'The Weeknd', albums: 1, songs: 16, image: null },
      { id: '3', name: 'Acidrap', albums: 2, songs: 28, image: null },
      { id: '4', name: 'Ania Szarmarch', albums: 1, songs: 12, image: null },
      { id: '5', name: 'Troye Sivan', albums: 1, songs: 14, image: null },
      { id: '6', name: 'Ryan Jones', albums: 2, songs: 24, image: null },
    ];

    const artistsToShow = artists.length > 0 ? artists : mockArtists;
    const artistCount = artistsToShow.length;

    return (
      <View style={styles.artistsListContainer}>
        {/* Header with count and sort */}
        <View style={styles.artistsListHeader}>
          <Text style={styles.artistsCount}>{artistCount} artists</Text>
          <TouchableOpacity
            style={styles.artistsSortButton}
            onPress={() => {
              // UI only - no logic
            }}
          >
            <Text style={styles.artistsSortText}>Date Added</Text>
            <Text style={styles.artistsSortIcon}>⇅</Text>
          </TouchableOpacity>
      </View>

        {/* Artists List */}
        <ScrollView
          style={styles.artistsListScroll}
          contentContainerStyle={styles.artistsListContent}
          showsVerticalScrollIndicator={false}
        >
          {artistsToShow.map((artist, index) => {
            const imageUrl = getImageUrl(artist);
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

            return (
              <TouchableOpacity
                key={artist.id || index}
                style={styles.artistListItem}
                onPress={() => {
                  navigation.navigate('ArtistDetail', { artist });
                }}
                onLongPress={() => {
                  setSelectedArtist(artist);
                  setShowArtistOptions(true);
                }}
              >
                {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
                    style={styles.artistListImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.artistListImage, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>⚫</Text>
                  </View>
                )}
                <View style={styles.artistListInfo}>
                  <Text style={styles.artistListName}>{artist.name || artist.title || ''}</Text>
                  <Text style={styles.artistListMeta}>
                    {String(albums)} {albums === 1 ? 'Album' : 'Albums'} | {String(songs)} {songs === 1 ? 'Song' : 'Songs'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.artistListOptions}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedArtist(artist);
                    setShowArtistOptions(true);
                  }}
                >
                  <Text style={styles.artistListOptionsIcon}>⋮</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderGridView = (data: any[]) => {
    return (
      <View style={styles.gridContainer}>
        {data.map((item, index) => (
          <View key={`${item.id || index}`} style={styles.gridItem}>
            {renderArtistCard(item)}
          </View>
        ))}
      </View>
    );
  };

  // Render albums grid
  const renderAlbumsGrid = () => {
    const albumsToShow = albums.length > 0 ? albums : [];
    const albumCount = albumsToShow.length;

    return (
      <View style={styles.albumsListContainer}>
        {/* Header with count and sort */}
        <View style={styles.albumsListHeader}>
          <Text style={styles.albumsCount}>{albumCount} albums</Text>
          <TouchableOpacity
            style={styles.albumsSortButton}
            onPress={onSortPress}
          >
            <Text style={styles.albumsSortText}>Date Modified</Text>
            <Text style={styles.albumsSortIcon}>⇅</Text>
          </TouchableOpacity>
        </View>

        {/* Albums Grid */}
        <ScrollView
          style={styles.albumsListScroll}
          contentContainerStyle={styles.albumsGridContent}
          showsVerticalScrollIndicator={false}
        >
          {albumsToShow.map((album, index) => {
            const imageUrl = getImageUrl(album);
            const albumName = album.name || album.title || '';
            
            // Safely extract artist name - handle string, object, and array formats
            let artistName = '';
            if (typeof album.primaryArtists === 'string') {
              artistName = album.primaryArtists;
            } else if (typeof album.artists === 'string') {
              artistName = album.artists;
            } else if (Array.isArray(album.primaryArtists)) {
              // Handle array of artist objects
              const firstArtist = album.primaryArtists[0];
              artistName = firstArtist?.name || firstArtist?.id || '';
            } else if (Array.isArray(album.artists)) {
              // Handle array of artist objects
              const firstArtist = album.artists[0];
              artistName = firstArtist?.name || firstArtist?.id || '';
            } else if (album.primaryArtists && typeof album.primaryArtists === 'object') {
              // Handle object format with keys like {primary, featured, all} or {id, name, role, image, type, url}
              artistName = album.primaryArtists.name || album.primaryArtists.primary || album.primaryArtists.all || album.primaryArtists.featured || '';
            } else if (album.artists && typeof album.artists === 'object') {
              // Handle object format with keys like {id, name, role, image, type, url}
              artistName = album.artists.name || album.artists.primary || album.artists.all || album.artists.featured || '';
            }
            
            // Safely extract year - ensure it's a string
            let year = '';
            if (typeof album.year === 'string' || typeof album.year === 'number') {
              year = String(album.year);
            } else if (album.year && typeof album.year === 'object') {
              year = album.year.toString() || '';
            }
            
            // Safely extract song count
            let songCount = 0;
            if (typeof album.songCount === 'number') {
              songCount = album.songCount;
            } else if (Array.isArray(album.songs)) {
              songCount = album.songs.length;
            } else if (typeof album.songCount === 'string') {
              songCount = parseInt(album.songCount) || 0;
  }

  return (
              <View key={album.id || index} style={styles.albumGridItem}>
                <TouchableOpacity
                  style={styles.albumCard}
                  onPress={() => onAlbumPress(album)}
                >
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.albumGridImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.albumGridImage, styles.placeholderImage]}>
                      <Text style={styles.placeholderText}>♪</Text>
                    </View>
                  )}
                  <View style={styles.albumGridBottom}>
                    <View style={styles.albumGridInfo}>
                      <Text style={styles.albumGridName} numberOfLines={1}>
                        {albumName}
          </Text>
                      <Text style={styles.albumGridArtist} numberOfLines={1}>
                        {artistName ? `${artistName}${year ? ` | ${year}` : ''}` : ''}
                      </Text>
                      <Text style={styles.albumGridMeta}>
                        {String(songCount)} {songCount === 1 ? 'song' : 'songs'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.albumGridOptions}
                      onPress={(e) => {
                        e.stopPropagation();
                        onAlbumMenuPress(album.id);
                      }}
                    >
                      <Text style={styles.albumGridOptionsIcon}>⋮</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Render queue list
  const renderQueueList = () => {
    if (queue.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Queue is empty</Text>
        </View>
      );
    }

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

    return (
      <View style={styles.tabContent}>
        {queue.map((item, index) => {
          const isCurrent = index === currentIndex;
          const imageUrl =
            item.image && item.image.length > 0
              ? item.image[item.image.length - 1].link
              : undefined;

          return (
            <TouchableOpacity
              key={`${item.id}-${index}`}
              style={[styles.queueItem, isCurrent && styles.queueCurrentItem]}
              onPress={() => setCurrentSong(item, queue)}
            >
              {imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.queueImage} />
              )}

              <View style={styles.queueInfo}>
                <Text
                  style={[styles.queueSongName, isCurrent && styles.queueCurrentSongName]}
            numberOfLines={1}
          >
                  {cleanSongName(item.name)}
                </Text>
                <Text style={styles.queueArtist} numberOfLines={1}>
            {item.primaryArtists}
          </Text>
        </View>

              <View style={styles.queueControls}>
                {/* Move Up Button */}
                <TouchableOpacity
                  style={[styles.queueReorderButton, index === 0 && styles.queueReorderButtonDisabled]}
                  onPress={() => handleMoveUp(index)}
                  disabled={index === 0}
                >
                  <Text style={[styles.queueReorderButtonText, index === 0 && styles.queueReorderButtonTextDisabled]}>↑</Text>
                </TouchableOpacity>

                {/* Move Down Button */}
                <TouchableOpacity
                  style={[styles.queueReorderButton, index === queue.length - 1 && styles.queueReorderButtonDisabled]}
                  onPress={() => handleMoveDown(index)}
                  disabled={index === queue.length - 1}
                >
                  <Text style={[styles.queueReorderButtonText, index === queue.length - 1 && styles.queueReorderButtonTextDisabled]}>↓</Text>
                </TouchableOpacity>

                {/* Remove Button */}
                <TouchableOpacity
                  style={styles.queueRemoveButton}
                  onPress={() => removeFromQueue(index)}
                >
                  <Text style={styles.queueRemoveButtonText}>×</Text>
                </TouchableOpacity>
              </View>
      </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'songs') {
      return renderSongsList();
    }

    if (activeTab === 'artists') {
      return renderArtistsList();
    }

    if (activeTab === 'albums') {
      return renderAlbumsGrid();
    }

    if (activeTab === 'queue') {
      return renderQueueList();
    }

    const data = getTabData();
    return renderListView(data);
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>♪</Text>
          <Text style={styles.headerTitle}>Mume</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={styles.searchButton}
        >
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'suggested' && styles.activeTab]}
          onPress={() => setActiveTab('suggested')}
        >
      <Text
            style={[
              styles.tabText,
              activeTab === 'suggested' && styles.activeTabText,
            ]}
          >
            Suggested
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'songs' && styles.activeTab]}
          onPress={() => setActiveTab('songs')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'songs' && styles.activeTabText,
            ]}
      >
        Songs
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
          >
            Artists
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
          >
            Albums
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'queue' && styles.activeTab]}
          onPress={() => setActiveTab('queue')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'queue' && styles.activeTabText,
            ]}
          >
            Queue
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'suggested' && (
          <>
            {renderHorizontalSection('Recently Played', recentSongs, renderSongCard, 'songs')}
            {renderHorizontalSection('Artists', artists, renderArtistCard, 'artists')}
            {renderHorizontalSection('Most Played', mostPlayed, renderSongCard, 'songs')}
          </>
        )}

        {activeTab !== 'suggested' && renderTabContent()}
      </ScrollView>

      {/* Artist Options Modal */}
      <ArtistOptionsModal
        visible={showArtistOptions}
        artist={selectedArtist}
        onClose={() => {
          setShowArtistOptions(false);
          setSelectedArtist(null);
        }}
      />

      {/* Playlist Selection Modal */}
      <PlaylistSelectionModal
        visible={showPlaylistModal}
        song={selectedSong}
        onClose={() => {
          setShowPlaylistModal(false);
          setSelectedSong(null);
        }}
      />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
    color: colors.primary,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  searchButton: {
    padding: 8,
  },
  searchIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  tabsContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  songCard: {
    width: 140,
    marginRight: 12,
  },
  songImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  songTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: 2,
  },
  songArtist: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  songTime: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  artistCard: {
    alignItems: 'center',
    marginRight: 16,
  },
  artistImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  artistName: {
    color: colors.textPrimary,
    fontSize: 12,
    textAlign: 'center',
  },
  songsContainer: {
    flex: 1,
  },
  songsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  songCount: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  sortIcon: {
    color: colors.primary,
    fontSize: 16,
  },
  songsList: {
    flex: 1,
  },
  songsListContent: {
    paddingBottom: 100,
  },
  songListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  songListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  songListImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  songListInfo: {
    flex: 1,
  },
  songListTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songListDetails: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  songListActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  songPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songPlayIcon: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  songMenuButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songMenuIcon: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  gridItem: {
    width: '50%',
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  listImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  listArtist: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  placeholderImage: {
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModal: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  sortModalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sortOptionText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  sortOptionSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  songMenuContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
    zIndex: 1001,
  },
  songMenuHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    alignItems: 'center',
  },
  songMenuImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  songMenuInfo: {
    flex: 1,
  },
  songMenuTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  songMenuArtist: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  songMenuDuration: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  songMenuFavorite: {
    padding: 8,
  },
  songMenuFavoriteIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  songMenuOptions: {
    paddingTop: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  menuOptionText: {
    color: colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  artistsListContainer: {
    flex: 1,
  },
  artistsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  artistsCount: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  artistsSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artistsSortText: {
    color: colors.primary,
    fontSize: 14,
  },
  artistsSortIcon: {
    color: colors.primary,
    fontSize: 16,
  },
  artistsListScroll: {
    flex: 1,
  },
  artistsListContent: {
    paddingBottom: 120,
  },
  artistListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  artistListImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: colors.card,
  },
  artistListInfo: {
    flex: 1,
  },
  artistListName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artistListMeta: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  artistListOptions: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistListOptionsIcon: {
    color: colors.textSecondary,
    fontSize: 20,
  },
  albumsListContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  albumsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  albumsCount: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  albumsSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  albumsSortText: {
    color: colors.primary,
    fontSize: 14,
  },
  albumsSortIcon: {
    color: colors.primary,
    fontSize: 16,
  },
  albumsListScroll: {
    flex: 1,
  },
  albumsGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 120,
  },
  albumGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  albumCard: {
    width: '100%',
  },
  albumGridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  albumGridBottom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  albumGridInfo: {
    flex: 1,
    marginRight: 8,
  },
  albumGridName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  albumGridArtist: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  albumGridMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  albumGridOptions: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  albumGridOptionsIcon: {
    color: colors.textPrimary,
    fontSize: 18,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  queueCurrentItem: {
    backgroundColor: colors.card,
  },
  queueImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  queueInfo: {
    flex: 1,
  },
  queueSongName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  queueCurrentSongName: {
    color: colors.primary,
  },
  queueArtist: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  queueControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  queueReorderButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: colors.card,
  },
  queueReorderButtonDisabled: {
    opacity: 0.3,
  },
  queueReorderButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  queueReorderButtonTextDisabled: {
    color: colors.textSecondary,
  },
  queueRemoveButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  queueRemoveButtonText: {
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
