import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, Modal, TextInput, Alert } from 'react-native';
import { COLORS } from '../constants/theme';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import PremiumButton from '../components/PremiumButton';
import { INDIAN_CITIES } from '../constants/cities';
import { AuthContext } from '../context/AuthContext';
import { db } from '../config/firebase';

const PreferencesScreen = ({ navigation }) => {
  const { user, userData, updateUserData } = useContext(AuthContext);
  const [preferences, setPreferences] = useState({
    city: userData?.location || 'Hyderabad',
    acrossIndia: userData?.acrossIndia ?? true,
    community: userData?.communityPreference || 'Any',
    photosOnly: userData?.photosOnly || false,
    status: userData?.statusPreference || 'Any',
    intent: userData?.intentPreference || 'Any',
    minAge: userData?.minAge || 18,
    maxAge: userData?.maxAge || 49,
    distance: userData?.distancePreference || 'Anywhere',
    gender: userData?.genderPreference || 'Any'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalConfig, setModalConfig] = useState({ visible: false, key: '', title: '', options: [] });

  const ageOptions = Array.from({ length: 70 - 18 + 1 }, (_, i) => `${18 + i}`);
  const distanceOptions = ['5 km', '10 km', '15 km', '25 km', '50 km', '100 km', '250 km', 'Anywhere'];

  const updatePref = (key, val) => setPreferences(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updateData = {
        location: preferences.city,
        acrossIndia: preferences.acrossIndia,
        communityPreference: preferences.community,
        photosOnly: preferences.photosOnly,
        statusPreference: preferences.status,
        intentPreference: preferences.intent,
        minAge: preferences.minAge,
        maxAge: preferences.maxAge,
        distancePreference: preferences.distance,
        genderPreference: preferences.gender,
        updatedAt: new Date().toISOString()
      };
      await db.collection('users').doc(user.uid).update(updateData);
      if (updateUserData) updateUserData(updateData);
      Alert.alert('Success', 'Preferences saved successfully!');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = (key, title, options) => {
    setModalConfig({ visible: true, key, title, options });
    setSearchQuery('');
  };

  const PreferenceItem = ({ title, subtitle, rightText, hasArrow, isToggle, toggleValue, onToggle, onPress }) => (
    <TouchableOpacity 
      style={styles.prefItem} 
      onPress={onPress} 
      disabled={isToggle || !onPress}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.prefTitle}>{title}</Text>
        {subtitle && <Text style={styles.prefSubtitle}>{subtitle}</Text>}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {rightText && <Text style={styles.prefRightText}>{rightText}</Text>}
        {hasArrow && <ChevronRight color={COLORS.textMain} size={18} />}
        {isToggle && (
          <Switch 
            value={toggleValue} 
            onValueChange={onToggle}
            trackColor={{ false: COLORS.lightGray, true: '#2563EB' }}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
          <ChevronLeft color={COLORS.navy} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My preferences</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
          <PreferenceItem 
            title="Minimum Age" 
            rightText={`${preferences.minAge} Yrs`} 
            hasArrow 
            onPress={() => openModal('minAge', 'Select Minimum Age', ageOptions)}
          />
          <View style={styles.divider} />
          <PreferenceItem 
            title="Maximum Age" 
            rightText={`${preferences.maxAge} Yrs`} 
            hasArrow 
            onPress={() => openModal('maxAge', 'Select Maximum Age', ageOptions)}
          />
        </View>

        <View style={styles.card}>
          <PreferenceItem 
            title="City" 
            subtitle="Searching around this location" 
            rightText={preferences.city} 
            hasArrow 
            onPress={() => openModal('city', 'Select City', INDIAN_CITIES)}
          />
          <View style={styles.divider} />
          <PreferenceItem 
            title="Distance Radius" 
            rightText={preferences.distance} 
            hasArrow 
            onPress={() => openModal('distance', 'Select Distance', distanceOptions)}
          />
        </View>

        <View style={styles.card}>
          <PreferenceItem 
            title="Show matches from across India" 
            isToggle 
            toggleValue={preferences.acrossIndia}
            onToggle={(val) => updatePref('acrossIndia', val)}
          />
        </View>

        <View style={styles.card}>
          <PreferenceItem 
            title="Show me" 
            rightText={preferences.gender} 
            hasArrow 
            onPress={() => openModal('gender', 'Show me', ['Male', 'Female', 'Any'])}
          />
        </View>

        <View style={styles.card}>
          <PreferenceItem 
            title="Community" 
            subtitle="Show matches from this community" 
            rightText={preferences.community} 
            hasArrow 
            onPress={() => openModal('community', 'Select Community', ['Any', 'Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain'])}
          />
        </View>

        <View style={styles.card}>
          <PreferenceItem 
            title="With photos only" 
            isToggle 
            toggleValue={preferences.photosOnly}
            onToggle={(val) => updatePref('photosOnly', val)}
          />
        </View>

        <View style={styles.card}>
          <PreferenceItem 
            title="Relationship status" 
            rightText={preferences.status} 
            hasArrow 
            onPress={() => openModal('status', 'Relationship Status', ['Any', 'Single', 'Divorced', 'Widowed', 'Separated'])}
          />
        </View>

        <View style={styles.card}>
          <PreferenceItem 
            title="Looking for" 
            rightText={preferences.intent} 
            hasArrow 
            onPress={() => openModal('intent', 'Looking For', ['Any', 'Marriage', 'Long Term', 'Companion', 'Exploring'])}
          />
        </View>

        <View style={{ height: 20 }} />
        
        <PremiumButton 
          title={isSaving ? "Saving..." : "Save Preferences"} 
          onPress={handleSave} 
          disabled={isSaving}
        />
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Reusable Options Modal */}
      <Modal visible={modalConfig.visible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalConfig.title}</Text>
              <TouchableOpacity onPress={() => setModalConfig({ ...modalConfig, visible: false })}>
                <X color={COLORS.navy} size={24} />
              </TouchableOpacity>
            </View>
            
            {modalConfig.key === 'city' && (
              <TextInput
                style={styles.searchInput}
                placeholder="Search city..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
              />
            )}

            <ScrollView style={{ maxHeight: 400 }}>
              {modalConfig.options
                .filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(opt => (
                <TouchableOpacity 
                  key={opt} 
                  style={styles.modalOption}
                  onPress={() => {
                    updatePref(modalConfig.key, opt);
                    setModalConfig({ ...modalConfig, visible: false });
                  }}
                >
                  <Text style={[styles.modalOptionText, preferences[modalConfig.key] === opt && { color: COLORS.gold, fontWeight: 'bold' }]}>{opt}</Text>
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.navy,
  },
  scrollContent: {
    padding: 15,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.white,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 16,
  },
  prefTitle: {
    fontSize: 16,
    color: COLORS.textMain,
  },
  prefSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  prefRightText: {
    fontSize: 16,
    color: COLORS.textMain,
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
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalOptionText: {
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
});

export default PreferencesScreen;
