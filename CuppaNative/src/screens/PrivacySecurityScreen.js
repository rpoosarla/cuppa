import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, Alert } from 'react-native';
import { COLORS } from '../constants/theme';
import { ChevronLeft, ChevronRight, ShieldCheck, UserX, Download, KeyRound, AlertTriangle } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import PaywallModal from '../components/PaywallModal';

const PrivacySecurityScreen = ({ navigation }) => {
  const { userData } = React.useContext(AuthContext);
  const plan = userData?.planType || '';
  const isPremiumPlan = plan === 'Premium';
  const [paywallVisible, setPaywallVisible] = useState(false);

  const [settings, setSettings] = useState({
    profileVisible: true,
    twoFactor: false,
    readReceipts: true,
    incognito: false,
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAction = (title, message) => {
    Alert.alert(title, message);
  };

  const SettingToggle = ({ icon: Icon, title, subtitle, value, onToggle }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconBox}>
          <Icon color={COLORS.navy} size={20} />
        </View>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: COLORS.lightGray, true: '#2563EB' }}
      />
    </View>
  );

  const ActionItem = ({ icon: Icon, title, subtitle, onPress, danger }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, danger && { backgroundColor: '#FEE2E2' }]}>
          <Icon color={danger ? COLORS.danger : COLORS.navy} size={20} />
        </View>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.settingTitle, danger && { color: COLORS.danger }]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <ChevronRight color={COLORS.textMuted} size={20} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
          <ChevronLeft color={COLORS.navy} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.shieldBanner}>
          <ShieldCheck color={COLORS.gold} size={48} />
          <Text style={styles.shieldTitle}>Your Trust is Our Priority</Text>
          <Text style={styles.shieldSubtitle}>We use industry-leading encryption and strict moderation to keep the Cuppa community safe.</Text>
        </View>

        <Text style={styles.sectionHeader}>Visibility</Text>
        <View style={styles.card}>
          <SettingToggle 
            icon={ShieldCheck} 
            title="Profile Visibility" 
            subtitle="Allow others to find and see your profile"
            value={settings.profileVisible}
            onToggle={() => {
              if (settings.profileVisible && !isPremiumPlan) {
                setPaywallVisible(true);
              } else {
                toggleSetting('profileVisible');
              }
            }}
          />
          <View style={styles.divider} />
          <SettingToggle 
            icon={ShieldCheck} 
            title="Incognito Mode" 
            subtitle="Only people you like can see you (Cuppa Gold Feature)"
            value={settings.incognito}
            onToggle={() => {
              if (!settings.incognito && !isPremiumPlan) {
                setPaywallVisible(true);
              } else {
                toggleSetting('incognito');
              }
            }}
          />
        </View>

        <Text style={styles.sectionHeader}>Security</Text>
        <View style={styles.card}>
          <SettingToggle 
            icon={KeyRound} 
            title="Two-Factor Authentication" 
            subtitle="Secure your account with SMS codes"
            value={settings.twoFactor}
            onToggle={() => toggleSetting('twoFactor')}
          />
          <View style={styles.divider} />
          <ActionItem 
            icon={Download} 
            title="Download My Data" 
            subtitle="Get a copy of everything you've shared"
            onPress={() => handleAction("Data Request", "We will email you a secure link to download your data within 48 hours.")}
          />
        </View>

        <Text style={styles.sectionHeader}>Safety & Moderation</Text>
        <View style={styles.card}>
          <ActionItem 
            icon={UserX} 
            title="Blocked Contacts" 
            subtitle="Manage people you have blocked"
            onPress={() => handleAction("Blocked Contacts", "You have 0 blocked contacts.")}
          />
          <View style={styles.divider} />
          <ActionItem 
            icon={ShieldCheck} 
            title="Privacy Policy" 
            subtitle="View our Terms & Privacy policy"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <View style={styles.divider} />
          <ActionItem 
            icon={AlertTriangle} 
            title="Safety Center" 
            subtitle="Guides, resources, and support"
            onPress={() => handleAction("Safety Center", "Opening Cuppa Safety Center guidelines.")}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
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
  shieldBanner: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shieldTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginTop: 12,
    marginBottom: 8,
  },
  shieldSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginLeft: 10,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    color: COLORS.navy,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 70,
  },
});

export default PrivacySecurityScreen;
