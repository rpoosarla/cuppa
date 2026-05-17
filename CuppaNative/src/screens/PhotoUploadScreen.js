import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';
import PremiumButton from '../components/PremiumButton';
import { ChevronLeft, Camera, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { db, storage } from '../config/firebase';

const PhotoUploadScreen = ({ navigation }) => {
  const { user, userData, updateUserData: updateContextData } = useContext(AuthContext);
  const [photos, setPhotos] = useState(Array(10).fill(null));
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    if (userData && userData.photos) {
      const existingPhotos = userData.photos;
      const newPhotos = [...existingPhotos, ...Array(10 - existingPhotos.length).fill(null)];
      setPhotos(newPhotos);
    }
  }, [userData]);

  const pickImage = async (index) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is needed.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
    if (!result.canceled) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      setPhotos(newPhotos);
    }
  };

  const removeImage = (index) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
  };

  const handleSave = async () => {
    if (!user) return;
    const actualPhotos = photos.filter(p => p !== null);
    if (actualPhotos.length === 0) {
      Alert.alert('Required', 'Please upload at least one photo.');
      return;
    }
    setIsSaving(true);
    setUploadStatus('Saving photos...');
    try {
      const uploadPromises = photos.map(async (uri, i) => {
        if (!uri) return null;
        if (uri.startsWith('http')) return uri;
        try {
          const fileName = `photo_${Date.now()}_${i}`;
          const storageRef = storage.ref(`users/${user.uid}/${fileName}`);
          await storageRef.putFile(uri);
          return await storageRef.getDownloadURL();
        } catch (e) {
          console.error(`Photo ${i} upload failed:`, e);
          return null;
        }
      });
      const uploadedPhotos = (await Promise.all(uploadPromises)).filter(url => url !== null);
      await db.collection('users').doc(user.uid).update({ photos: uploadedPhotos });
      if (updateContextData) updateContextData({ photos: uploadedPhotos });
      Alert.alert('Success', 'Photos updated!');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save.");
    } finally {
      setIsSaving(false);
      setUploadStatus('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
          <ChevronLeft color={COLORS.navy} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Profile Photos</Text>
        <View style={{ width: 38 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.photoGrid}>
          {photos.map((uri, i) => (
            <View key={i} style={styles.photoContainer}>
              <TouchableOpacity style={styles.photoTile} onPress={() => pickImage(i)}>
                {uri ? <Image source={{ uri }} style={styles.photo} /> : <Camera color={COLORS.textMuted} size={28} />}
              </TouchableOpacity>
              {uri && (
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                  <X color={COLORS.white} size={14} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        <PremiumButton title={isSaving ? "Saving..." : "Save Changes"} onPress={handleSave} disabled={isSaving} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 15, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.navy },
  scrollContent: { padding: 20 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 20 },
  photoContainer: { width: '30%', aspectRatio: 0.8, marginBottom: 5, position: 'relative' },
  photoTile: { width: '100%', height: '100%', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.danger, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
});

export default PhotoUploadScreen;
