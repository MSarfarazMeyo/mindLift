import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '../../../lib/store';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  scheduleDailyReminder,
  scheduleWeeklyReport,
} from '../../../lib/notifications';
import { useTheme } from '@react-navigation/native';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Purchases from 'react-native-purchases';
import SubscriptionButton from '@/components/SubscriptionButton';
import { firstLoginStorage, loginEmailStorage } from '@/lib/utils';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const deleteAccount = useStore((state) => state.deleteAccount);
  const journalEntries = useStore((state) => state.journalEntries);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(status === 'granted');
      }
    };

    const loadReminderTime = async () => {
      const savedTime = await AsyncStorage.getItem('reminderTime');
      if (savedTime) setReminderTime(new Date(savedTime));
    };

    checkPermissions();
    loadReminderTime();
  }, []);

  // Fix for handleNotificationsToggle function
  const handleNotificationsToggle = async (value: boolean) => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Notifications are not available on web.');
      return;
    }

    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotificationsEnabled(true);
        // Fix: Pass correct parameters to scheduleDailyReminder
        if (dailyReminders) {
          await scheduleDailyReminder(
            true,
            reminderTime.getHours(),
            reminderTime.getMinutes(),
          );
        }
        // Fix: Pass correct parameters to scheduleWeeklyReport
        if (weeklyReports) {
          await scheduleWeeklyReport(true, 7, 19, 0); // Sunday at 7 PM
        }
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotificationsEnabled(false);
    }
  };

  // Fix for handleDailyRemindersToggle function
  const handleDailyRemindersToggle = async (value: boolean) => {
    setDailyReminders(value);
    if (notificationsEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      // Fix: Pass correct parameters
      if (value) {
        await scheduleDailyReminder(
          true,
          reminderTime.getHours(),
          reminderTime.getMinutes(),
        );
      }
      if (weeklyReports) {
        await scheduleWeeklyReport(true, 7, 19, 0); // Sunday at 7 PM
      }
    } else {
      console.log('working');
    }
  };

  const handleExportJournals = async () => {
    try {
      if (!journalEntries || journalEntries.length === 0) {
        Alert.alert('No Data', 'You have no journal entries to export.');
        return;
      }

      const textData = journalEntries
        .map((entry, index) => {
          const date = new Date(entry.date).toLocaleDateString();
          return (
            `Entry ${index + 1} - ${date}\n` +
            `Mood: ${entry.mood || 'Not specified'}\n` +
            `Sleep: ${entry.sleep || 'Not specified'}\n` +
            `Activities: ${entry.activities || 'Not specified'}\n` +
            `Notes: ${entry.notes || 'No notes'}\n` +
            `${'='.repeat(50)}\n`
          );
        })
        .join('\n');

      const header = `My Journal Entries\nExported on: ${new Date().toLocaleDateString()}\n${'='.repeat(50)}\n\n`;
      const fullContent = header + textData;

      const fileName = `my_journal_${new Date().toISOString().split('T')[0]}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, fullContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Export Complete', `Journal entries saved to: ${fileName}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Unable to export journal entries.');
    }
  };

  // Fix for handleWeeklyReportsToggle function
  const handleWeeklyReportsToggle = async (value: boolean) => {
    setWeeklyReports(value);
    if (notificationsEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (dailyReminders) {
        await scheduleDailyReminder(
          true,
          reminderTime.getHours(),
          reminderTime.getMinutes(),
        );
      }
      // Fix: Pass correct parameters
      if (value) {
        await scheduleWeeklyReport(true, 7, 19, 0); // Sunday at 7 PM
      }
    }
  };

  // Fix for handleReminderTimeChange function
  const handleReminderTimeChange = (
    event: DateTimePickerEvent,
    selectedTime: Date | undefined,
  ) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setReminderTime(selectedTime);
      AsyncStorage.setItem('reminderTime', selectedTime.toISOString());
      if (notificationsEnabled && dailyReminders) {
        Notifications.cancelAllScheduledNotificationsAsync().then(() => {
          // Fix: Pass correct parameters
          scheduleDailyReminder(
            true,
            selectedTime.getHours(),
            selectedTime.getMinutes(),
          );
        });
      }
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data including mood entries, journal entries, and achievements.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'I understand, delete my account',
          style: 'destructive',
          onPress: () => {
            // Second confirmation for critical action
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete all your data. Type "DELETE" to confirm.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Confirm Deletion',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setIsDeletingAccount(true);

                      const { success, error } = await deleteAccount();

                      if (!success) {
                        Alert.alert(
                          'Deletion Failed',
                          error ||
                            'Failed to delete account. Please try again or contact support.',
                        );
                        return;
                      }

                      // Clear localStorage on_boarded key
                      await AsyncStorage.removeItem('on_boarded');

                      Alert.alert(
                        'Account Deleted',
                        'Your account has been permanently deleted.',
                        [
                          {
                            text: 'OK',
                            onPress: () => router.replace('/onboard'),
                          },
                        ],
                      );
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      Alert.alert(
                        'Deletion Error',
                        'An unexpected error occurred. Please try again or contact support.',
                      );
                    } finally {
                      setIsDeletingAccount(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Show loading indicator
            setIsLoggingOut(true);

            // Use the store's reset function to clear state and sign out
            const resetState = useStore.getState().reset;
            const { success, error } = await resetState();

            if (!success) {
              console.error('Error during logout:', error);
              Alert.alert(
                'Logout Error',
                'An error occurred while logging out. Please try again.',
              );
              return;
            }

            // You can optionally clear specific AsyncStorage items not handled by the store reset
            // For example:
            // await AsyncStorage.removeItem('specific-setting');

            // Navigate to login screen
            await Purchases.logOut();

            router.replace('/onboard');

            await firstLoginStorage('remove');
            await loginEmailStorage('remove');
            await AsyncStorage.removeItem('on_boarded');
          } catch (error) {
            Alert.alert(
              'Logout Error',
              'An unexpected error occurred. Please try again.',
            );
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleSupport = () => {
    Alert.alert('Contact Support', 'How would you like to contact us?', [
      {
        text: 'Email',
        onPress: () => {
          Alert.alert('Support Email', 'support@mindlift.com');
        },
      },
      {
        text: 'Chat',
        onPress: () => {
          Alert.alert('Live Chat', 'Live chat support is coming soon!');
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Enable Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive app notifications
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#95a5a6', true: '#3498db' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Daily Reminders</Text>
            <Text style={styles.settingDescription}>
              Get daily mood check-in reminders
            </Text>
          </View>
          <Switch
            value={dailyReminders}
            onValueChange={handleDailyRemindersToggle}
            trackColor={{ false: '#95a5a6', true: '#3498db' }}
            // disabled={!notificationsEnabled}
          />
        </View>

        {dailyReminders && notificationsEnabled && (
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowTimePicker(true)}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Reminder Time</Text>
              <Text style={styles.settingDescription}>
                {reminderTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
          </TouchableOpacity>
        )}

        {showTimePicker && (
          <DateTimePicker
            value={reminderTime}
            mode="time"
            display="default"
            onChange={handleReminderTimeChange}
          />
        )}

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleExportJournals}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Export Journal Entries</Text>
            <Text style={styles.settingDescription}>
              Download your journal data as a file
            </Text>
          </View>
          <Ionicons name="download" size={24} color="#3498db" />
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Weekly Reports</Text>
            <Text style={styles.settingDescription}>
              Receive weekly progress summaries on Sundays
            </Text>
          </View>
          <Switch
            value={weeklyReports}
            onValueChange={handleWeeklyReportsToggle}
            trackColor={{ false: '#95a5a6', true: '#3498db' }}
            // disabled={!notificationsEnabled}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(auth)/edit')}
        >
          <View style={styles.menuItemContent}>
            <Ionicons name="person" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(auth)/reset-password')}
        >
          <View style={styles.menuItemContent}>
            <Ionicons name="key" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={
            () =>
              Linking.openURL(
                'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
              )
            // router.push('/(auth)/termsofUse')
          }
        >
          <View style={styles.menuItemContent}>
            <MaterialIcons name="policy" size={24} color="#3498db" />

            <Text style={styles.menuItemText}>Terms of Use</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
        </TouchableOpacity>
        <SubscriptionButton />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert('Help Center', 'Help Center content is coming soon!')
          }
        >
          <View style={styles.menuItemContent}>
            <Ionicons name="help-circle" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Help Center</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Live Chat', 'Live Chat is coming soon!')}
        >
          <View style={styles.menuItemContent}>
            <Entypo name="chat" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Live Chat</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSupport}>
          <View style={styles.menuItemContent}>
            <Ionicons name="mail" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Contact Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(auth)/resources')}
        >
          <View style={styles.menuItemContent}>
            <Ionicons name="information-circle" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Resources</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Linking.openURL(
              'https://www.privacypolicies.com/live/ffb87454-127b-499f-bc46-7d143e29a918',
            )
          }
        >
          <View style={styles.menuItemContent}>
            <Ionicons name="document-text" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#95a5a6" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.dangerSectionTitle}>Danger Zone</Text>

        <TouchableOpacity
          disabled={isDeletingAccount}
          style={[
            styles.deleteAccountButton,
            isDeletingAccount && styles.deleteAccountButtonDisabled,
          ]}
          onPress={handleDeleteAccount}
        >
          <View style={styles.menuItemContent}>
            {isDeletingAccount ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="trash" size={24} color="#ffffff" />
            )}
            <Text style={styles.deleteAccountButtonText}>
              {isDeletingAccount ? 'Deleting Account...' : 'Delete Account'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={isLoggingOut}
          style={[
            styles.logoutButton,
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.logoutButtonText}>Log Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  deleteAccountButton: {
    backgroundColor: '#e74c3c',
    marginVertical: 10,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAccountButtonDisabled: {
    backgroundColor: '#c0392b',
    opacity: 0.7,
  },
  deleteAccountButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  header: {
    padding: 20,
    backgroundColor: '#3498db',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
  },
  logoutButton: {
    marginVertical: 20,
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  logoutButtonDisabled: {
    backgroundColor: '#ff3b3080', // 50% opacity
  },

  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
