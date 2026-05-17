import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Text, Alert, Modal, TouchableOpacity, Switch, Platform, ActivityIndicator, TextInput, ScrollView, Image, Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
import { COLORS } from '../constants/theme';
import ProfileCard from '../components/ProfileCard';
import { Coffee, Filter, X, ChevronRight } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import { db } from '../config/firebase';
import firestore from '@react-native-firebase/firestore';
import { INDIAN_CITIES } from '../constants/cities';
import { getPlanLimits } from '../constants/plans';
import { maskName, calculateAge } from '../utils/utils';
import PaywallModal from '../components/PaywallModal';

const DiscoverScreen = () => {
  const { user, userData } = useContext(AuthContext);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [filters, setFilters] = useState({
    city: userData?.location || 'Hyderabad',
    showNRI: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    fetchProfiles();
  }, [filters.city, filters.showNRI, userData?.blockedUsers]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      let query = db.collection('users')
        .where('onboardingCompleted', '==', true);
      
      // Basic Firestore Filter (City)
      if (filters.city !== 'Any' && !userData?.acrossIndia) {
        query = query.where('location', '==', filters.city);
      }
      
      const querySnapshot = await query.limit(50).get();
      let allPotentialProfiles = [];
      
      querySnapshot.forEach((doc) => {
        if (user && doc.id !== user.uid) {
          const data = doc.data();
          const age = calculateAge(data.dob);
          
          // --- Robust Filtering Logic ---
          
          // 1. Age Range
          if (age < (userData?.minAge || 18) || age > (userData?.maxAge || 99)) return;
          
          // 2. Community
          const commPref = userData?.communityPreference || 'Any';
          if (commPref !== 'Any' && data.community !== commPref) return;
          
          // 3. Relationship Status
          const statusPref = userData?.statusPreference || 'Any';
          if (statusPref !== 'Any' && data.relationshipStatus !== statusPref) return;
          
          // 4. Intent (Looking For)
          const intentPref = userData?.intentPreference || 'Any';
          if (intentPref !== 'Any' && data.intent !== intentPref) return;
          
          // 5. Photos Only
          const photoPref = userData?.photosOnly || false;
          if (photoPref && (!data.photos || data.photos.length === 0)) return;

          // 6. Gender Filter
          const genderPref = userData?.genderPreference || 'Any';
          if (genderPref !== 'Any' && data.gender !== genderPref) return;

          // 7. Block Filter
          if (userData?.blockedUsers?.includes(doc.id)) return;

          const isFree = !data.planType || data.planType === 'Free';
          allPotentialProfiles.push({
            id: doc.id,
            ...data,
            name: isFree ? maskName(data.name) : data.name,
            age: age,
            category: data.isPro ? 'Cuppa Plus Member' : 'New Member',
            intent: data.bio || 'Looking for a great connection.',
            community: data.community || 'Open to all',
            languages: data.languages || ['English'],
            photos: (data.photos && data.photos.length > 0) ? data.photos : ['https://via.placeholder.com/400'],
          });
        }
      });

      // If no profiles match strict filters, show a message or a small fallback
      setProfiles(allPotentialProfiles);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Error fetching profiles: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Utilities now imported from ../utils/utils

  const handleNext = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(profiles.length);
    }
  };

  const handleRewind = () => setPaywallVisible(true);

  const handleLike = async (profile) => {
    if (!user) return;
    
    const plan = getPlanLimits(userData?.planType || 'Free');
    const currentLikes = userData?.likesSentToday || 0;

    if (currentLikes >= plan.dailyLikes) {
      Alert.alert(
        "Daily Limit Reached",
        `Your ${plan.name} plan allows ${plan.dailyLikes} likes per day. Upgrade for more!`,
        [
          { text: "Later", style: "cancel" },
          { text: "Upgrade", onPress: () => setPaywallVisible(true) }
        ]
      );
      return;
    }

    try {
      // 1. Check for reciprocal like (a Match)
      const reciprocalIntro = await db.collection('intros')
        .where('senderId', '==', profile.id)
        .where('receiverId', '==', user.uid)
        .get();

      if (!reciprocalIntro.empty) {
        // IT'S A MATCH!
        await db.collection('matches').add({
          userIds: [user.uid, profile.id],
          participants: {
            [user.uid]: {
              name: userData.name,
              photo: userData.photos?.[0] || ''
            },
            [profile.id]: {
              name: profile.name,
              photo: profile.photos?.[0] || ''
            }
          },
          createdAt: new Date().toISOString(),
          lastMessage: "You matched! Say hi.",
          lastMessageAt: new Date().toISOString()
        });

        Alert.alert("It's a Match! ☕", `You and ${profile.name} liked each other. You can now chat!`);
      }

      // 2. Send Intro
      await db.collection('intros').add({
        senderId: user.uid,
        senderName: userData?.name || 'Someone',
        senderPhoto: userData?.photos?.[0] || '',
        receiverId: profile.id,
        message: "Hi! I'd like to get to know you.",
        createdAt: new Date().toISOString(),
        status: 'pending'
      });

      // 3. Increment daily likes count using Atomic Increment
      await db.collection('users').doc(user.uid).update({
        likesSentToday: firestore.FieldValue.increment(1)
      });
    } catch (error) {
      console.error("Error handling like: ", error);
    } finally {
      handleNext();
    }
  };

  const handleReport = (profile) => {
    if (!profile) return;
    Alert.alert(
      "Report Profile",
      "Are you sure you want to report and block this user?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Report & Block", 
          style: "destructive", 
          onPress: async () => {
             try {
               await db.collection('users').doc(user.uid).update({
                 blockedUsers: firestore.FieldValue.arrayUnion(profile.id)
               });
               await db.collection('reports').add({
                 reporterId: user.uid,
                 reportedId: profile.id,
                 reason: "Reported from Discover",
                 createdAt: new Date().toISOString()
               });
               handleNext();
               Alert.alert("Reported", "User blocked and reported.");
             } catch (e) {
               console.error("Report failed:", e);
             }
          }
        }
      ]
    );
  };

  const handleDoubleTap = (profile) => {
    setSelectedProfile(profile);
    setDetailsVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={() => setFilterVisible(true)}>
          <Filter color={COLORS.navy} size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.cardContainer}>
          <View style={[styles.skeletonCard, { height: height * 0.7 }]}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonInfo}>
              <View style={styles.skeletonName} />
              <View style={styles.skeletonBadge} />
            </View>
          </View>
        </View>
      ) : currentIndex >= profiles.length ? (
        <View style={styles.emptyContainer}>
          <Coffee color={COLORS.gold} size={64} />
          <Text style={styles.emptyTitle}>You've seen everyone!</Text>
          <Text style={styles.emptySubtitle}>Try changing your filters or come back later.</Text>
          <TouchableOpacity style={styles.clearBtn} onPress={fetchProfiles}>
            <Text style={styles.clearBtnText}>Refresh Feed</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardContainer}>
          <ProfileCard 
            key={profiles[currentIndex]?.id || currentIndex}
            profile={profiles[currentIndex]} 
            onNext={handleNext}
            onRewind={handleRewind}
            onLike={handleLike}
            onReport={handleReport}
            onDoubleTap={handleDoubleTap}
            isMasked={!userData?.isPro}
          />
        </View>
      )}

      {/* Profile Details Modal */}
      <Modal visible={detailsVisible} animationType="fade" transparent={true}>
        <View style={styles.detailsOverlay}>
          <View style={styles.detailsContent}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>Profile Details</Text>
              <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                <X color={COLORS.navy} size={28} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image 
                source={{ uri: selectedProfile?.photos?.[0] || 'https://via.placeholder.com/400' }} 
                style={styles.detailsImage} 
              />
              
              <View style={styles.detailsInfoSection}>
                <Text style={styles.detailsName}>
                  {selectedProfile?.name}, {selectedProfile?.age}
                </Text>
                <Text style={styles.detailsCategory}>{selectedProfile?.category}</Text>
                
                <View style={styles.infoGrid}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Relationship</Text>
                    <Text style={styles.infoValue}>{selectedProfile?.relationshipStatus || 'Single'}</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{selectedProfile?.location || 'India'}</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Community</Text>
                    <Text style={styles.infoValue}>{selectedProfile?.community || 'Open'}</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Education</Text>
                    <Text style={styles.infoValue}>{selectedProfile?.education || 'Graduate'}</Text>
                  </View>
                </View>

                <Text style={styles.sectionHeading}>Bio</Text>
                <Text style={styles.sectionBody}>{selectedProfile?.bio || 'No bio provided.'}</Text>

                <Text style={styles.sectionHeading}>Interests</Text>
                <View style={styles.tagContainer}>
                  {(selectedProfile?.interests || ['Coffee', 'Travel', 'Music']).map((tag, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />

      <Modal visible={filterVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <X color={COLORS.navy} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>City</Text>
              <TouchableOpacity 
                style={styles.citySelector} 
                onPress={() => {
                  setCityModalVisible(true);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.citySelectorText}>{filters.city}</Text>
                <ChevronRight color={COLORS.navy} size={18} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.applyBtn} 
              onPress={() => setFilterVisible(false)}
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <ScrollView style={{ maxHeight: 400 }}>
              {INDIAN_CITIES
                .filter(city => city.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(city => (
                <TouchableOpacity 
                  key={city} 
                  style={styles.modalOption}
                  onPress={() => {
                    setFilters(prev => ({ ...prev, city }));
                    setCityModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, filters.city === city && { color: COLORS.gold, fontWeight: 'bold' }]}>{city}</Text>
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
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.navy },
  cardContainer: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.navy, marginTop: 20, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
  clearBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.navy },
  clearBtnText: { color: COLORS.navy, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.navy },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
  filterLabel: { fontSize: 16, color: COLORS.navy, fontWeight: '500' },
  citySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 5 },
  citySelectorText: { fontSize: 14, color: COLORS.navy, fontWeight: '600' },
  applyBtn: { backgroundColor: COLORS.gold, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  applyBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  searchInput: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16, color: COLORS.navy, borderWidth: 1, borderColor: COLORS.lightGray },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  modalOptionText: { fontSize: 16, color: COLORS.navy },
  detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  detailsContent: { backgroundColor: COLORS.white, borderRadius: 24, flex: 0.9, overflow: 'hidden' },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  detailsTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.navy },
  detailsImage: { width: '100%', height: 300, resizeMode: 'cover' },
  detailsInfoSection: { padding: 20 },
  detailsName: { fontSize: 26, fontWeight: 'bold', color: COLORS.navy },
  detailsCategory: { fontSize: 14, color: COLORS.gold, fontWeight: '600', marginBottom: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  infoBox: { width: '48%', backgroundColor: COLORS.bgLight, padding: 12, borderRadius: 12 },
  infoLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  infoValue: { fontSize: 14, color: COLORS.navy, fontWeight: 'bold' },
  sectionHeading: { fontSize: 18, fontWeight: 'bold', color: COLORS.navy, marginTop: 10, marginBottom: 8 },
  sectionBody: { fontSize: 15, color: COLORS.textMain, lineHeight: 22, marginBottom: 20 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: COLORS.navy, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  tagText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  skeletonCard: {
    width: width - 32,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  skeletonImage: {
    height: '65%',
    backgroundColor: '#E5E7EB',
  },
  skeletonInfo: {
    padding: 20,
    gap: 12,
  },
  skeletonName: {
    height: 30,
    width: '60%',
    backgroundColor: '#E5E7EB',
    borderRadius: 15,
  },
  skeletonBadge: {
    height: 20,
    width: '40%',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
  },
});

export default DiscoverScreen;
