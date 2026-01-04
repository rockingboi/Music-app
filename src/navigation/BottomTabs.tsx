import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import PlaylistsScreen from '../screens/PlaylistsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MiniPlayer from '../components/MiniPlayer';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

type TabItemProps = {
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
};

const TabItem = ({ label, icon, isActive, onPress }: TabItemProps) => (
  <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.7}>
    <Feather
      name={icon as any}
      size={20}
      color={isActive ? colors.primary : colors.textSecondary}
    />
    <Text style={[styles.label, isActive && styles.activeLabel]}>
      {label}
    </Text>
  </TouchableOpacity>
);

function CustomTabBar({ state, descriptors, navigation }: any) {
  const currentRoute = state.routes[state.index]?.name || '';
  
  return (
    <View style={styles.container}>
      <TabItem
        label="Home"
        icon="home"
        isActive={currentRoute === 'Home'}
        onPress={() => {
          const route = state.routes[0];
          if (route.name && currentRoute !== 'Home') {
            navigation.jumpTo(route.name);
          }
        }}
      />
      <TabItem
        label="Favorites"
        icon="heart"
        isActive={currentRoute === 'Favorites'}
        onPress={() => {
          const route = state.routes[1];
          if (route.name && currentRoute !== 'Favorites') {
            navigation.jumpTo(route.name);
          }
        }}
      />
      <TabItem
        label="Playlists"
        icon="list"
        isActive={currentRoute === 'Playlists'}
        onPress={() => {
          const route = state.routes[2];
          if (route.name && currentRoute !== 'Playlists') {
            navigation.jumpTo(route.name);
          }
        }}
      />
      <TabItem
        label="Settings"
        icon="settings"
        isActive={currentRoute === 'Settings'}
        onPress={() => {
          const route = state.routes[3];
          if (route.name && currentRoute !== 'Settings') {
            navigation.jumpTo(route.name);
          }
        }}
      />
    </View>
  );
}

export default function BottomTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none', // Hide default tab bar
          },
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Favorites" component={FavoritesScreen} />
        <Tab.Screen name="Playlists" component={PlaylistsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    paddingTop: 8,
    paddingBottom: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeLabel: {
    color: colors.primary,
  },
});
