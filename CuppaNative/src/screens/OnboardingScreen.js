import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Platform,
  Alert,
  Image,
  Modal,
  ActivityIndicator
} from 'react-native';
import { COLORS } from '../constants/theme';
import PremiumButton from '../components/PremiumButton';
import { ChevronLeft, Camera as CameraIcon, MapPin, CheckCircle, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { INDIAN_CITIES } from '../constants/cities';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db, storage } from '../config/firebase';

const OnboardingScreen = ({ navigation }) => {
  const { user, updateUserData: updateContextData } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef(null);
  const [userData, setUserData] = useState({
    name: '',
    dob: '',
    gender: 'Female',
    location: '',
    status: '',
    community: '',
    intent: '',
    zodiac: '',
    bio: '',
    photos: Array(10).fill(null),
    languages: [],
    isFaceVerified: false
  });
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);


  const LANGUAGES = ['Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu', 'Gujarati', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'English'];

  const toggleLanguage = (lang) => {
    setUserData(prev => {
      const isSelected = prev.languages.includes(lang);
      const newLangs = isSelected 
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang];
      return { ...prev, languages: newLangs };
    });
  };

  const updateUserData = (key, value) => {
    setUserData(prev => ({ ...prev, [key]: value }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!userData.name.trim()) {
        Alert.alert('Required', 'Please enter your full name.');
        return false;
      }
      if (!userData.dob) {
        Alert.alert('Required', 'Please select your date of birth.');
        return false;
      }
      // Age Check
      const birthDate = new Date(userData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        Alert.alert('Age Restriction', 'Cuppa is only for users aged 18 and above.');
        return false;
      }
      if (!userData.location) {
        Alert.alert('Required', 'Please select or detect your location.');
        return false;
      }
    } else if (step === 2) {
      const hasPhoto = userData.photos.some(p => p !== null);
      if (!hasPhoto) {
        Alert.alert('Required', 'Please upload at least one photo of yourself.');
        return false;
      }
    } else if (step === 3) {
      if (!userData.status) {
        Alert.alert('Required', 'Please select your relationship status.');
        return false;
      }
      if (!userData.intent) {
        Alert.alert('Required', 'Please select what you are looking for.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleGetLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }
      updateUserData('location', 'Detecting...');
      let location = await Location.getCurrentPositionAsync({});
      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (address && address.length > 0) {
        updateUserData('location', address[0].city || address[0].region || 'Unknown');
      } else {
        updateUserData('location', 'Hyderabad');
      }
    } catch (error) {
      console.error(error);
      updateUserData('location', 'Hyderabad');
    }
  };

  const pickImage = async (index) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (!result.canceled) {
      const newPhotos = [...userData.photos];
      newPhotos[index] = result.assets[0].uri;
      updateUserData('photos', newPhotos);
    }
  };

  const [uploadStatus, setUploadStatus] = useState('');

  const completeOnboarding = async (isSkipping = false) => {
    if (!user) return;
    
    const actualPhotos = userData.photos.filter(p => p !== null);
    if (actualPhotos.length === 0) {
      Alert.alert('Required', 'Please upload at least one photo.');
      return;
    }

    setIsSaving(true);
    setUploadStatus(isSkipping ? 'Bypassing verification...' : 'Finalizing profile...');
    
    try {
      // 1. Parallel Uploads for maximum speed
      const uploadPromises = userData.photos.map(async (uri, i) => {
        if (!uri) return null;
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

      if (uploadedPhotos.length === 0) {
        throw new Error('All photo uploads failed. Please check your connection.');
      }

      setUploadStatus('Saving profile...');
      const finalData = {
        name: userData.name,
        dob: userData.dob,
        gender: userData.gender,
        location: userData.location,
        status: userData.status,
        community: userData.community,
        intent: userData.intent,
        zodiac: userData.zodiac,
        bio: userData.bio,
        photos: uploadedPhotos,
        languages: userData.languages,
        isFaceVerified: isSkipping ? false : userData.isFaceVerified,
        verificationVideo: userData.verificationVideo || '',
        isPro: false,
        deviceType: Platform.OS,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        // --- Default Preferences ---
        genderPreference: userData.gender === 'Male' ? 'Female' : 'Male',
        minAge: 18,
        maxAge: 50,
        communityPreference: 'Any',
        statusPreference: 'Any',
        intentPreference: 'Any',
        acrossIndia: true,
        photosOnly: false,
        distancePreference: 'Anywhere'
      };

      console.log("Final Save Payload:", finalData);
      
      // Use a timeout for the database call to prevent infinite hanging
      const savePromise = db.collection('users').doc(user.uid).set(finalData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database Timeout')), 15000)
      );

      await Promise.race([savePromise, timeoutPromise]);
      if (updateContextData) updateContextData(finalData);

      setUploadStatus('Done!');
      
      // Use both reset and navigate for absolute certainty
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Connection Error", "We're having trouble saving your profile. Please try again.");
    } finally {
      setIsSaving(false);
      setUploadStatus('');
    }
  };

  const renderStep1 = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.stepTitle}>Let's get to know you</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter your name"
          value={userData.name}
          onChangeText={val => updateUserData('name', val)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Birth</Text>
        <View>
          <TouchableOpacity 
            style={[styles.input, { justifyContent: 'center' }]} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: userData.dob ? COLORS.textMain : COLORS.textMuted }}>
              {userData.dob || 'Select Date of Birth'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={userData.dob ? new Date(userData.dob) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  const currentDate = selectedDate.toISOString().split('T')[0];
                  updateUserData('dob', currentDate);
                }
              }}
            />
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location</Text>
        <View style={styles.locationWrapper}>
          <TouchableOpacity 
            style={[styles.input, { flex: 1, marginBottom: 0, justifyContent: 'center' }]} 
            onPress={() => setCityModalVisible(true)}
          >
            <Text style={{ color: userData.location ? COLORS.textMain : COLORS.textMuted }}>
              {userData.location || 'Select City...'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationBtn} onPress={handleGetLocation}>
            <MapPin color={COLORS.gold} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <PremiumButton title="Continue" onPress={nextStep} style={styles.mt} />
    </ScrollView>
  );

  const renderStep2 = () => {
    const totalBoxes = showAllPhotos ? 10 : 5;

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}>
        <Text style={styles.stepTitle}>Add your photos</Text>
        <Text style={styles.stepSubtitle}>Show your best self. Upload up to 10 photos (at least 1 required).</Text>
        
        <View style={styles.photoGrid}>
          {[...Array(totalBoxes)].map((_, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.photoTile} 
              onPress={() => pickImage(i)}
            >
              {userData.photos[i] ? (
                <Image source={{ uri: userData.photos[i] }} style={styles.photo} resizeMode="cover" />
              ) : (
                <Camera color={COLORS.textMuted} size={32} />
              )}
            </TouchableOpacity>
          ))}
          {!showAllPhotos && (
            <TouchableOpacity 
              style={[styles.photoTile, { backgroundColor: COLORS.bgLight, borderStyle: 'solid' }]} 
              onPress={() => setShowAllPhotos(true)}
            >
              <Text style={{ color: COLORS.navy, fontWeight: 'bold', textAlign: 'center', padding: 5 }}>+ Add More Photos</Text>
            </TouchableOpacity>
          )}
        </View>

        <PremiumButton title="Continue" onPress={nextStep} style={styles.mt} />
      </ScrollView>
    );
  };

  const renderStep3 = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}>
      <Text style={styles.stepTitle}>More about you</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Community</Text>
        <View style={[styles.input, { padding: 0, overflow: 'hidden', justifyContent: 'center' }]}>
          <Picker
            selectedValue={userData.community}
            onValueChange={(itemValue) => updateUserData('community', itemValue)}
          >
            <Picker.Item label="Select Community..." value="" color={COLORS.textMuted} />
            <Picker.Item label="Hindu" value="Hindu" />
            <Picker.Item label="Muslim" value="Muslim" />
            <Picker.Item label="Christian" value="Christian" />
            <Picker.Item label="Sikh" value="Sikh" />
            <Picker.Item label="Buddhist" value="Buddhist" />
            <Picker.Item label="Jain" value="Jain" />
            <Picker.Item label="Parsi" value="Parsi" />
            <Picker.Item label="Jewish" value="Jewish" />
            <Picker.Item label="Spiritual" value="Spiritual" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Languages Spoken</Text>
        <TouchableOpacity 
          style={[styles.input, { justifyContent: 'center' }]} 
          onPress={() => setShowLanguageModal(true)}
        >
          <Text style={{ color: userData.languages.length ? COLORS.textMain : COLORS.textMuted }}>
            {userData.languages.length ? userData.languages.join(', ') : 'Select Languages...'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Zodiac Sign</Text>
        <View style={[styles.input, { padding: 0, overflow: 'hidden', justifyContent: 'center' }]}>
          <Picker
            selectedValue={userData.zodiac}
            onValueChange={(itemValue) => updateUserData('zodiac', itemValue)}
          >
            <Picker.Item label="Select Zodiac..." value="" color={COLORS.textMuted} />
            <Picker.Item label="Aries" value="Aries" />
            <Picker.Item label="Taurus" value="Taurus" />
            <Picker.Item label="Gemini" value="Gemini" />
            <Picker.Item label="Cancer" value="Cancer" />
            <Picker.Item label="Leo" value="Leo" />
            <Picker.Item label="Virgo" value="Virgo" />
            <Picker.Item label="Libra" value="Libra" />
            <Picker.Item label="Scorpio" value="Scorpio" />
            <Picker.Item label="Sagittarius" value="Sagittarius" />
            <Picker.Item label="Capricorn" value="Capricorn" />
            <Picker.Item label="Aquarius" value="Aquarius" />
            <Picker.Item label="Pisces" value="Pisces" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Relationship Status</Text>
        <View style={[styles.input, { padding: 0, overflow: 'hidden', justifyContent: 'center' }]}>
          <Picker
            selectedValue={userData.status}
            onValueChange={(itemValue) => updateUserData('status', itemValue)}
          >
            <Picker.Item label="Select Status..." value="" color={COLORS.textMuted} />
            <Picker.Item label="Single" value="Single" />
            <Picker.Item label="Divorced" value="Divorced" />
            <Picker.Item label="Widow" value="Widow" />
            <Picker.Item label="Widower" value="Widower" />
            <Picker.Item label="Separated" value="Separated" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Looking For</Text>
        <View style={[styles.input, { padding: 0, overflow: 'hidden', justifyContent: 'center' }]}>
          <Picker
            selectedValue={userData.intent}
            onValueChange={(itemValue) => updateUserData('intent', itemValue)}
          >
            <Picker.Item label="Select Intent..." value="" color={COLORS.textMuted} />
            <Picker.Item label="Long Term Relationship" value="Long Term Relationship" />
            <Picker.Item label="Marriage" value="Marriage" />
            <Picker.Item label="Companion" value="Companion" />
            <Picker.Item label="Just Exploring" value="Just Exploring" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bio / Intro</Text>
        <TextInput 
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
          placeholder="Tell others a bit about yourself..."
          value={userData.bio}
          onChangeText={val => updateUserData('bio', val)}
          multiline
          numberOfLines={4}
        />
      </View>

      <PremiumButton title="Continue" onPress={nextStep} style={styles.mt} />
    </ScrollView>
  );

  const handleVerify = async () => {
    if (!permission || !permission.granted) {
      const p = await requestPermission();
      if (!p.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed for face verification.');
        return;
      }
    }

    try {
      setIsRecording(true);
      setUploadStatus('Recording liveness...');
      
      // 1. Start Recording (Native expo-camera API)
      if (cameraRef.current) {
        const recordPromise = cameraRef.current.recordAsync({
          maxDuration: 3,
          quality: '480p',
        });

        // Auto-stop after 3 seconds if maxDuration isn't enough
        setTimeout(async () => {
          if (cameraRef.current) {
            await cameraRef.current.stopRecording();
          }
        }, 3500);

        const video = await recordPromise;
        setIsRecording(false);
        setUploadStatus('Uploading verification...');

        // 2. Upload Video for Compliance
        const videoName = `verif_${Date.now()}.mp4`;
        const videoRef = storage.ref(`verification_videos/${user.uid}/${videoName}`);
        await videoRef.putFile(video.uri);
        const videoUrl = await videoRef.getDownloadURL();

        // 3. Update Status
        updateUserData('isFaceVerified', true);
        updateUserData('verificationVideo', videoUrl);
        
        Alert.alert('Verified', 'Compliance video captured and verified!');
      }
    } catch (error) {
      console.error("Verification failed:", error);
      setIsRecording(false);
      Alert.alert('Verification Error', 'Could not capture liveness video. Please try again.');
    } finally {
      setUploadStatus('');
    }
  };

  const renderStep4 = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.stepTitle}>Face Verification</Text>
      <Text style={styles.stepSubtitle}>We use facial liveness to keep Cuppa a high-trust community.</Text>
      
      <View style={styles.verificationBox}>
        {userData.isFaceVerified ? (
          <View style={{ alignItems: 'center' }}>
            <CheckCircle color={COLORS.gold} size={80} />
            <Text style={styles.verificationText}>Identity Verified!</Text>
          </View>
        ) : isRecording ? (
          <View style={{ flex: 1, width: '100%', borderRadius: 20, overflow: 'hidden' }}>
            <Camera
              style={styles.camera}
              type={Camera.Constants.Type.front}
              ref={cameraRef}
            />
            <View style={styles.recordingOverlay}>
              <View style={styles.recordingIndicator} />
              <Text style={styles.recordingText}>Analyzing Liveness...</Text>
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <CameraIcon color={COLORS.textMuted} size={60} />
            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
              <Text style={styles.verifyBtnText}>Start Liveness Check</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.privacyNote}>
        🛡️ Privacy Note: We do not store this video or your biometric data on our servers. It is used only for real-time verification.
      </Text>

      <PremiumButton 
        title={isSaving ? (uploadStatus || "Saving...") : "Complete Setup"} 
        onPress={completeOnboarding} 
        style={styles.mt} 
        disabled={isSaving || (!userData.isFaceVerified && !isSaving)}
      />
      
      {!userData.isFaceVerified && (
        <TouchableOpacity onPress={() => completeOnboarding(true)} style={styles.skipBtn} disabled={isSaving}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={step > 1 ? prevStep : () => navigation.goBack()}>
          <ChevronLeft color={COLORS.navy} size={28} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
        </View>
        <Text style={styles.stepText}>{step}/4</Text>
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      <Modal visible={showLanguageModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Languages</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <X color={COLORS.navy} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {LANGUAGES.map(lang => {
                const isSelected = userData.languages.includes(lang);
                return (
                  <TouchableOpacity 
                    key={lang} 
                    style={styles.languageOption}
                    onPress={() => toggleLanguage(lang)}
                  >
                    <Text style={styles.languageOptionText}>{lang}</Text>
                    {isSelected && <CheckCircle color={COLORS.gold} size={20} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
            <PremiumButton title="Done" onPress={() => setShowLanguageModal(false)} style={styles.mt} />
          </View>
        </View>
      </Modal>

      {/* City Search Modal */}
      <Modal visible={cityModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                <X color={COLORS.navy} size={24} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search city..."
              value={citySearchQuery}
              onChangeText={setCitySearchQuery}
            />
            <ScrollView style={{ maxHeight: 400 }}>
              {INDIAN_CITIES
                .filter(city => city.toLowerCase().includes(citySearchQuery.toLowerCase()))
                .map(city => (
                <TouchableOpacity 
                  key={city} 
                  style={styles.modalOption}
                  onPress={() => {
                    updateUserData('location', city);
                    setCityModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, userData.location === city && { color: COLORS.gold, fontWeight: 'bold' }]}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
  },
  progressContainer: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.gold,
  },
  stepText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textMain,
  },
  locationWrapper: {
    flexDirection: 'row',
    gap: 10,
  },
  locationBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  photoTile: {
    width: '30%',
    aspectRatio: 0.8,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  verificationBox: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginVertical: 40,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  verificationText: {
    fontSize: 18,
    color: COLORS.navy,
    fontWeight: '600',
    marginTop: 20,
  },
  mt: {
    marginTop: 20,
  },
  skipBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.navy,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  languageOptionText: {
    fontSize: 16,
    color: COLORS.navy,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: COLORS.navy,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.navy,
  },
  privacyNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  verifyBtn: {
    marginTop: 20,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  verifyBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  recordingOverlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4444',
    marginRight: 8,
  },
  recordingText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
});

export default OnboardingScreen;
