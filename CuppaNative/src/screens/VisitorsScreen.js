import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import { COLORS } from '../constants/theme';
import PaywallModal from '../components/PaywallModal';
import { AuthContext } from '../context/AuthContext';
import { db } from '../config/firebase';
import { Crown, Lock } from 'lucide-react-native';
import { getPlanLimits } from '../constants/plans';
import { maskName, calculateAge } from '../utils/utils';
import ProfileDetailModal from '../components/ProfileDetailModal';
import { useContext } from 'react';

const VisitorsScreen = () => {
  const { user, userData } = useContext(AuthContext);
  const [visitors, setVisitors] = useState([]);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const isPro = userData?.isPro || false;

  React.useEffect(() => {
    if (!user) return;

    // Native Firestore syntax for real-time visitor listener
    const unsubscribe = db.collection('visitors')
      .where('profileId', '==', user.uid)
      .onSnapshot((snapshot) => {
        const uniqueVisitors = [];
        const seenIds = new Set();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!seenIds.has(data.visitorId)) {
            seenIds.add(data.visitorId);
            uniqueVisitors.push({ id: doc.id, ...data });
          }
        });
        
        setVisitors(uniqueVisitors);
        setLoading(false);
      }, error => {
        console.error("Visitors listener error:", error);
      });

    return unsubscribe;
  }, [user]);

  const plan = getPlanLimits(userData?.planType || 'Free');
  const canSee = plan.canSeeLists;

  const handleCardPress = (visitor) => {
    if (!plan.canLikeFromLists) {
      Alert.alert(
        "Upgrade Required",
        "Your current plan allows you to see who visited you, but you need Standard or Premium to visit them back!",
        [
          { text: "Later", style: "cancel" },
          { text: "Upgrade", onPress: () => setPaywallVisible(true) }
        ]
      );
      return;
    }
    
    // Create a profile object for the modal
    const profile = {
      id: visitor.visitorId,
      name: visitor.visitorName,
      photos: [visitor.visitorPhoto],
      bio: visitor.visitorBio || "Checking you out!",
      community: visitor.visitorCommunity || 'Open',
      status: visitor.visitorStatus || 'Single',
      intent: visitor.visitorIntent || 'Marriage',
      age: calculateAge(visitor.visitorDob)
    };
    setSelectedProfile(profile);
    setProfileVisible(true);
  };

  const handleLike = async () => {
    if (!selectedProfile) return;
    try {
      await db.collection('intros').add({
        senderId: user.uid,
        senderName: userData.name,
        senderPhoto: userData.photos?.[0] || '',
        receiverId: selectedProfile.id,
        message: "Liked you back after your visit!",
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      Alert.alert("Success", "Interest sent back!");
    } catch (e) {
      console.error(e);
    }
  };

  // maskName utility imported from ../utils/utils

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Visitors</Text>
        <Text style={styles.subtitle}>
          {plan.canLikeFromLists 
            ? "These people checked out your profile recently." 
            : "Clear photos unlocked! Upgrade to see names and start chatting."}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {visitors.map((v) => (
            <TouchableOpacity key={v.id} style={styles.card} onPress={() => handleCardPress(v)}>
              <Image 
                source={{ uri: v.visitorPhoto || 'https://via.placeholder.com/400' }} 
                style={styles.image} 
              />
              <View style={styles.overlay}>
                <Text style={styles.name}>
                  {plan.canLikeFromLists ? v.visitorName : maskName(v.visitorName)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {visitors.length === 0 && !loading && (
            <Text style={{ textAlign: 'center', width: '100%', marginTop: 50, color: COLORS.textMuted }}>No visitors yet. Share your profile!</Text>
          )}
        </View>

        {!plan.canLikeFromLists && visitors.length > 0 && (
          <TouchableOpacity 
            style={styles.upgradeBanner} 
            onPress={() => setPaywallVisible(true)}
          >
            <Text style={styles.upgradeBannerText}>Upgrade to see all visitors!</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
      <ProfileDetailModal 
        visible={profileVisible} 
        profile={selectedProfile} 
        onClose={() => setProfileVisible(false)} 
        onLike={handleLike}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  header: { padding: 20, paddingTop: 60, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.navy },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 5 },
  scrollContent: { padding: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
  card: { width: '31%', aspectRatio: 0.8, borderRadius: 10, overflow: 'hidden', backgroundColor: COLORS.white },
  image: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)' },
  name: { color: COLORS.white, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  lockContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  lockIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(184, 134, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  lockTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.navy, marginBottom: 10, textAlign: 'center' },
  lockSubtitle: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  unlockBtn: { backgroundColor: COLORS.gold, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, width: '100%', alignItems: 'center' },
  unlockBtnText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  upgradeBanner: {
    backgroundColor: COLORS.navy,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  upgradeBannerText: {
    color: COLORS.gold,
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default VisitorsScreen;
