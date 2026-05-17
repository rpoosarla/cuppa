import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Phone, ArrowRight } from 'lucide-react-native';
import { auth, db } from '../config/firebase';

const LoginScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const handleSendOtp = async () => {
    if (!identifier || identifier.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number.');
      return;
    }
    setLoading(true);
    
    // Ensure phone number has country code for Firebase
    const phoneNumber = identifier.startsWith('+') ? identifier : `+91${identifier}`;

    try {
      // Full Native Authentication
      const confirmation = await auth.signInWithPhoneNumber(phoneNumber);
      setConfirmationResult(confirmation);
      setShowOtp(true);
    } catch (error) {
      console.error("Error sending OTP: ", error);
      if (error.code === 'auth/billing-not-enabled') {
        Alert.alert(
          "Firebase Billing Required",
          "This project requires a billing account (Blaze Plan) to send SMS. Please link a card in the Firebase Console. (Note: You still get 50,000 free logins/month)."
        );
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert("Too Many Attempts", "We've sent too many codes to this number. Please try again later.");
      } else if (error.code === 'auth/invalid-phone-number') {
        Alert.alert("Invalid Number", "Please check the phone number and try again.");
      } else {
        Alert.alert("Login Error", error.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      Alert.alert('Error', 'Invalid code. Most OTPs are 6 digits.');
      return;
    }
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // 1. Check if user already has a completed profile in Firestore
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (userDoc.exists && userDoc.data().onboardingCompleted) {
        // User already exists - skip onboarding
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        // New user or incomplete profile - go to onboarding
        navigation.navigate('Onboarding');
      }
    } catch (error) {
      console.error("Error verifying OTP: ", error);
      if (error.message.includes('db') || error.message.includes('Firestore')) {
        Alert.alert('Database Error', 'OTP was correct, but we couldn\'t load your profile.');
      } else {
        Alert.alert('Error', 'Invalid or expired code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Cuppa<Text style={{color: COLORS.white}}>.</Text></Text>
        <Text style={styles.subtitle}>Where first impressions are deep brewed.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{showOtp ? 'Verify Code' : 'Login / Signup'}</Text>
          <Text style={styles.cardSubtitle}>
            {showOtp 
              ? `Enter the code sent to ${identifier}` 
              : 'Enter your mobile number to get started'}
          </Text>

          {!showOtp ? (
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number"
                  placeholderTextColor={COLORS.textMuted}
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity 
                style={styles.btnPrimary} 
                onPress={handleSendOtp}
                disabled={loading}
              >
                <Text style={styles.btnText}>{loading ? 'Sending...' : 'Get OTP'}</Text>
                {!loading && <ArrowRight color={COLORS.navy} size={20} />}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="000000"
                  placeholderTextColor={COLORS.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity 
                style={styles.btnPrimary} 
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowOtp(false)} style={styles.resendBtn}>
                <Text style={styles.resendText}>Back to login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  inner: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    color: COLORS.gold,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
  },
  subtitle: {
    color: COLORS.goldLight,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTitle: {
    fontSize: 24,
    color: COLORS.gold,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardSubtitle: {
    color: COLORS.white,
    opacity: 0.8,
    fontSize: 14,
    marginBottom: 24,
  },
  inputGroup: {
    width: '100%',
  },
  inputWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: COLORS.textMain,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  btnPrimary: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: COLORS.goldLight,
    fontSize: 14,
  }
});

export default LoginScreen;
