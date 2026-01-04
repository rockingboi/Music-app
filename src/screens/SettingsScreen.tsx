import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const { theme, colors, toggleTheme } = useTheme();

  const handleOptionPress = (option: string) => {
    if (option === 'Theme') {
      toggleTheme();
    } else {
      // Placeholder handlers for other settings options
      console.log(`${option} pressed`);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    section: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionText: {
      fontSize: 16,
      color: colors.textPrimary,
      marginLeft: 12,
    },
    logoutText: {
      color: colors.primary,
    },
    themeValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    themeValueText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Login')}
          >
            <View style={styles.optionLeft}>
              <Feather name="user" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Login / Sign Up</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Profile')}
          >
            <View style={styles.optionLeft}>
              <Feather name="user" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Profile</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Account Settings')}
          >
            <View style={styles.optionLeft}>
              <Feather name="settings" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Account Settings</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Playback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Audio Quality')}
          >
            <View style={styles.optionLeft}>
              <Feather name="music" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Audio Quality</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Crossfade')}
          >
            <View style={styles.optionLeft}>
              <Feather name="layers" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Crossfade</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Normalize Volume')}
          >
            <View style={styles.optionLeft}>
              <Feather name="volume-2" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Normalize Volume</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Equalizer')}
          >
            <View style={styles.optionLeft}>
              <Feather name="sliders" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Equalizer</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Downloads Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloads</Text>
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Download Settings')}
          >
            <View style={styles.optionLeft}>
              <Feather name="download" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Download Settings</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Storage')}
          >
            <View style={styles.optionLeft}>
              <Feather name="hard-drive" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Storage</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Downloaded Music')}
          >
            <View style={styles.optionLeft}>
              <Feather name="folder" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Downloaded Music</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Notifications')}
          >
            <View style={styles.optionLeft}>
              <Feather name="bell" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Notifications</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Language')}
          >
            <View style={styles.optionLeft}>
              <Feather name="globe" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Language</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Theme')}
          >
            <View style={styles.optionLeft}>
              <Feather 
                name={theme === 'dark' ? 'moon' : 'sun'} 
                size={20} 
                color={colors.textPrimary} 
              />
              <Text style={styles.optionText}>Theme</Text>
            </View>
            <View style={styles.themeValue}>
              <Text style={styles.themeValueText}>
                {theme === 'dark' ? 'Dark' : 'Light'}
              </Text>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Privacy')}
          >
            <View style={styles.optionLeft}>
              <Feather name="lock" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Privacy</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Help & Support')}
          >
            <View style={styles.optionLeft}>
              <Feather name="help-circle" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Help & Support</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('About')}
          >
            <View style={styles.optionLeft}>
              <Feather name="info" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>About</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Terms & Conditions')}
          >
            <View style={styles.optionLeft}>
              <Feather name="file-text" size={20} color={colors.textPrimary} />
              <Text style={styles.optionText}>Terms & Conditions</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Logout')}
          >
            <View style={styles.optionLeft}>
              <Feather name="log-out" size={20} color={colors.primary} />
              <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
