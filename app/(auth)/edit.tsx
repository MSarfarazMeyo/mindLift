import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { useStore } from '@/lib/store';
import { showSuccess } from '@/lib/toastMessage';
import { EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@/constants/ApiUrl';
const EditProfile = () => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState(
    require('../../assets/images/FullLogo.png'),
  );
  const navigation = useNavigation();

  const userProfile = useStore((state) => state.userProfile);
  const userId = userProfile?.id;

  console.log('profileImage', profileImage);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setDataLoading(true);
        // First check if profile exists
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('id', userId);

        if (countError) throw countError;

        if (count === 0) {
          // Handle case where no profile exists
          setUserName('');
          setEmail('');
          setName('');
          return;
        }
        console.log('count', count);
        // Profile exists, fetch it
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        console.log('data', data);

        if (error) throw error;

        setUserName(data.username || '');
        setEmail(data.email || '');
        setName(data.name || '');
        if (data.profile_image_url) {
          setProfileImage({ uri: data.profile_image_url });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage({ uri: result.assets[0].uri });
    }
  };

  const uploadImageToSupabase = async (imageUri: any) => {
    try {
      const fileExt = imageUri.split('.').pop();
      const fileName = `profile_${Date.now()}.${fileExt}`;
      const fileType = `image/${fileExt}`;
      const fileData = await FileSystem.uploadAsync(
        `${supabase.storage.from('profile-images').getPublicUrl('').data.publicUrl}/${fileName}`,
        imageUri,
        {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            'Content-Type': fileType,
            Authorization: `Bearer ${EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        },
      );

      if (!fileData) {
        throw new Error('Failed to upload image');
      }
      const publicUrl = `${supabase.storage.from('profile-images').getPublicUrl('').data.publicUrl}/${fileName}`;
      console.log('Uploaded image URL:', publicUrl);

      return publicUrl;
    } catch (err) {
      console.error('Error in uploadImageToSupabase:', err);
      return null;
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Check if username is being changed and if it already exists
      if (userName) {
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', userName)
          .neq('id', userId)
          .single();

        if (existingUser) {
          Alert.alert(
            'Error',
            'This username is already taken. Please choose a different one.',
          );
          setLoading(false);
          return;
        }
      }

      let imageUrl = profileImage.uri;
      if (!imageUrl.startsWith('http')) {
        imageUrl = await uploadImageToSupabase(profileImage.uri);
        if (!imageUrl) {
          setLoading(false);
          return;
        }
      }

      console.log('imageUrl', imageUrl);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: userName,
          email: email,
          name: name,
          profile_image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      } else {
        showSuccess('', 'Profile updated successfully:');
        navigation.goBack();
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {dataLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading Profile Data...</Text>
        </View>
      ) : (
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.headerText}>Edit Profile</Text>
          </View>

          <View style={styles.profileImageContainer}>
            <Image source={profileImage} style={styles.profileImage} />
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={pickImage}
            >
              <Text style={styles.changePhotoButtonText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#2c3e50',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 30,
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  header: {
    marginTop: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  changePhotoButtonText: {
    color: '#3498db',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  changePhotoButton: {},
});
