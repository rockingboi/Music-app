import TrackPlayer from 'react-native-track-player';
import service from './src/player/service';

TrackPlayer.registerPlaybackService(() => service);
