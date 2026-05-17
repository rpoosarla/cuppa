import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  Alert 
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Settings, LogOut, ChevronRight, CreditCard, ShieldCheck, Heart, UserCog } from 'lucide-react-native';
import PaywallModal from '../components/PaywallModal';
import { AuthContext } from '../context/AuthContext';
import { auth, db } from '../config/firebase';
import { calculateAge } from '../utils/utils';
import ProfileDetailModal from '../components/ProfileDetailModal';

const ProfileScreen = ({ navigation }) => {
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const { userData } = useContext(AuthContext);

  const displayUser = userData || {
    name: 'Guest',
    dob: '1990-01-01',
    photos: ['https://via.placeholder.com/400'],
    isPro: false,
  };

  // calculateAge imported from utils

  const userAge = calculateAge(displayUser.dob);
  const mainPhoto = (displayUser.photos && displayUser.photos.length > 0) ? displayUser.photos[0] : 'https://via.placeholder.com/400';

  const handleLogout = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Clear push token before logging out to protect privacy
        await db.collection('users').doc(currentUser.uid).update({
          pushToken: null
        }).catch(err => console.log('Error clearing push token:', err));
      }
      await auth.signOut();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Logout failed.');
    }
  };

  const SettingItem = ({ icon: Icon, title, onPress, color = COLORS.navy }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Icon color={color} size={22} />
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <ChevronRight color={COLORS.textMuted} size={20} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: mainPhoto }} style={styles.avatar} />
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => navigation.navigate('PhotoUpload')}
          >
            <Settings color={COLORS.white} size={16} />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{displayUser.name}, {userAge}</Text>
        {!displayUser.isPro && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => setPaywallVisible(true)}>
            <Heart color={COLORS.gold} size={18} fill={COLORS.gold} />
            <Text style={styles.upgradeText}>Upgrade to Cuppa Plus</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.upgradeBanner, { backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.lightGray, marginTop: 10 }]} 
          onPress={() => setProfileVisible(true)}
        >
          <UserCog color={COLORS.navy} size={18} />
          <Text style={[styles.upgradeText, { color: COLORS.navy }]}>Preview My Profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.matchmakerBanner}>
        <View>
          <Text style={styles.matchmakerTitle}>Matchmaking Service</Text>
          <Text style={styles.matchmakerSubtitle}>Access, schedule, enjoy integrated benefits</Text>
        </View>
        <ChevronRight color="#BE185D" size={20} />
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Account Settings</Text>
      <View style={styles.section}>
        <SettingItem icon={CreditCard} title="Subscription Plan" onPress={() => setPaywallVisible(true)} />
        <SettingItem icon={ShieldCheck} title="Privacy & Security" onPress={() => navigation.navigate('PrivacySecurity')} />
        <SettingItem icon={Settings} title="Preferences" onPress={() => navigation.navigate('Preferences')} />
        <SettingItem icon={UserCog} title="Manage Account" onPress={() => navigation.navigate('ManageAccount')} />
        <SettingItem 
          icon={LogOut} 
          title="Logout" 
          onPress={handleLogout} 
          color={COLORS.danger} 
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>Cuppa Native v1.0.0</Text>
      </View>
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
      <ProfileDetailModal 
        visible={profileVisible} 
        profile={{
          ...displayUser,
          age: userAge
        }} 
        onClose={() => setProfileVisible(false)} 
        canInteract={false}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  header: { alignItems: 'center', padding: 30, paddingTop: Platform.OS === 'ios' ? 60 : 40, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: COLORS.gold },
  editBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.navy, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.navy },
  upgradeBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.navy, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 20, gap: 10 },
  upgradeText: { color: COLORS.white, fontWeight: 'bold' },
  matchmakerBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FDF2F8', borderColor: '#FBCFE8', borderWidth: 1, padding: 16, margin: 16, borderRadius: 12 },
  matchmakerTitle: { color: '#BE185D', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  matchmakerSubtitle: { color: '#9D174D', fontSize: 14, opacity: 0.8 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: COLORS.navy, marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  section: { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.lightGray },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingTitle: { fontSize: 16, color: COLORS.textMain, fontWeight: '500' },
  footer: { padding: 40, alignItems: 'center' },
  version: { color: COLORS.textMuted, fontSize: 12 }
});

export default ProfileScreen;
