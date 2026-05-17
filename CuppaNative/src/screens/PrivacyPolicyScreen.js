import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '../constants/theme';
import { ChevronLeft } from 'lucide-react-native';

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.navy} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last Updated: May 8, 2026</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide directly to us when you create an account, such as your name, date of birth, gender, location, and photos. We also collect data about your interactions with other users.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to provide and improve our services, facilitate matches, and ensure the safety and security of our community. We do not sell your personal data to third parties.
        </Text>

        <Text style={styles.sectionTitle}>3. Face Verification</Text>
        <Text style={styles.paragraph}>
          To maintain a high-trust community, we use facial liveness verification. This data is used solely for identity verification and is not shared with any other parties.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
        </Text>

        <Text style={styles.title}>Terms of Service</Text>
        
        <Text style={styles.sectionTitle}>1. Eligibility</Text>
        <Text style={styles.paragraph}>
          You must be at least 18 years old to use Cuppa. By using the app, you represent and warrant that you meet this requirement.
        </Text>

        <Text style={styles.sectionTitle}>2. Community Guidelines</Text>
        <Text style={styles.paragraph}>
          Users must treat others with respect. Harassment, hate speech, and fraudulent behavior are strictly prohibited and will result in immediate account termination.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.navy,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginTop: 20,
    marginBottom: 10,
  },
  lastUpdated: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginTop: 15,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    color: COLORS.textMain,
    lineHeight: 24,
    marginBottom: 15,
  },
});

export default PrivacyPolicyScreen;
