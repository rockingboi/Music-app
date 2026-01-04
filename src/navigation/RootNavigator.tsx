import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import PlayerScreen from '../screens/PlayerScreen';
import QueueScreen from '../screens/QueueScreen';
import SearchScreen from '../screens/SearchScreen';
import SeeAllScreen from '../screens/SeeAllScreen';
import ArtistDetailScreen from '../screens/ArtistDetailScreen';
import AlbumDetailScreen from '../screens/AlbumDetailScreen';
import PlaylistDetailScreen from '../screens/PlaylistDetailScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={BottomTabs} />
        <Stack.Screen name="Player" component={PlayerScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Queue" component={QueueScreen} />
        <Stack.Screen name="SeeAll" component={SeeAllScreen} />
        <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
        <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
        <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
