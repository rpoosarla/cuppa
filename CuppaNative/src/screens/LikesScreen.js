import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import { COLORS } from '../constants/theme';
import PaywallModal from '../components/PaywallModal';
import { AuthContext } from '../context/AuthContext';
import { db } from '../config/firebase';
import { Crown, Lock } from 'lucide-react-native';
import { getPlanLimits } from '../constants/plans';
import { maskName, calculateAge } from '../utils/utils';
import ProfileDetailModal from '../components/ProfileDetailModal';

const LikesScreen = () => {
  const { user, userData } = useContext(AuthContext);
  const [likes, setLikes] = useState([]);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const isPro = userData?.isPro || false;

  React.useEffect(() => {
    if (!user) return;

    // Native Firestore syntax for real-time listener
    const unsubscribe = db.collection('intros')
      .where('receiverId', '==', user.uid)
      .onSnapshot((snapshot) => {
        const uniqueLikes = [];
        const seenIds = new Set();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!seenIds.has(data.senderId)) {
            seenIds.add(data.senderId);
            uniqueLikes.push({ id: doc.id, ...data });
          }
        });
        
        setLikes(uniqueLikes);
        setLoading(false);
      }, error => {
        console.error("Likes listener error:", error);
      });

    return unsubscribe;
  }, [user]);

  const plan = getPlanLimits(userData?.planType || 'Free');
  const canSee = plan.canSeeLists;

  const handleCardPress = (like) => {
    if (!plan.canLikeFromLists) {
      Alert.alert(
        "Upgrade Required",
        "Your current plan allows you to see who likes you, but you need Standard or Premium to like them back and start chatting!",
        [
          { text: "Later", style: "cancel" },
          { text: "Upgrade", onPress: () => setPaywallVisible(true) }
        ]
      );
      return;
    }
    
    // Create a profile object for the modal
    const profile = {
      id: like.senderId,
      name: like.senderName,
      photos: [like.senderPhoto],
      bio: like.senderBio || "I'd like to connect!",
      community: like.senderCommunity || 'Open',
      status: like.senderStatus || 'Single',
      intent: like.senderIntent || 'Marriage',
      age: calculateAge(like.senderDob)
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
        message: "Liked you back!",
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
        <Text style={styles.title}>Who Likes You</Text>
        <Text style={styles.subtitle}>
          {plan.canLikeFromLists 
            ? "These people have already swiped right on you!" 
            : "Clear photos unlocked! Upgrade to see names and start chatting."}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {likes.map((like) => (
            <TouchableOpacity key={like.id} style={styles.card} onPress={() => handleCardPress(like)}>
              <Image 
                source={{ uri: like.senderPhoto || 'https://via.placeholder.com/400' }} 
                style={styles.image} 
              />
              <View style={styles.overlay}>
                <Text style={styles.name}>
                  {plan.canLikeFromLists ? like.senderName : maskName(like.senderName)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {likes.length === 0 && !loading && (
            <Text style={{ textAlign: 'center', width: '100%', marginTop: 50, color: COLORS.textMuted }}>No likes yet. Keep exploring!</Text>
          )}
        </View>
        
        {!plan.canLikeFromLists && likes.length > 0 && (
          <TouchableOpacity 
            style={styles.upgradeBanner} 
            onPress={() => setPaywallVisible(true)}
          >
            <Text style={styles.upgradeBannerText}>Upgrade to Chat & Like Back!</Text>
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
  scrollContent: { padding: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between' },
  card: { width: '47%', aspectRatio: 0.75, borderRadius: 15, overflow: 'hidden', backgroundColor: COLORS.white, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  image: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, paddingTop: 40, backgroundColor: 'rgba(0,0,0,0.4)' },
  name: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
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

export default LikesScreen;
