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
import { ChevronLeft, UserMinus, ShieldAlert } from 'lucide-react-native';
import { auth, db } from '../config/firebase';
import PremiumButton from '../components/PremiumButton';
import { AuthContext } from '../context/AuthContext';

const ManageAccountScreen = ({ navigation }) => {
  const { user } = React.useContext(AuthContext);
  const [showAuth, setShowAuth] = useState(false);
  const [authType, setAuthType] = useState(null); // 'deactivate' or 'delete'
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActionClick = (type) => {
    setAuthType(type);
    setShowAuth(true);
    setConfirmText('');
  };

  const handleAuthenticate = async () => {
    const isDelete = authType === 'delete';
    
    if (isDelete && confirmText.toUpperCase() !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm.');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isDelete) {
        // 1. Delete from Firestore
        await db.collection('users').doc(user.uid).delete();
        
        // 2. Delete from Auth (Frees up phone number)
        await auth.currentUser.delete();
        
        Alert.alert('Account Deleted', 'Your account has been permanently removed.');
      } else {
        // Deactivate (just hide profile)
        await db.collection('users').doc(user.uid).update({ 
          isActive: false,
          onboardingCompleted: false, // Force them to redo onboarding if they return
          pushToken: null // Clear push token on deactivation
        });
        await auth.signOut();
        Alert.alert('Account Deactivated', 'Your profile is now hidden.');
      }
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error("Account action error:", error);
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert("Security Timeout", "For your protection, please logout and log back in before deleting your account.");
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (showAuth) {
    const isDelete = authType === 'delete';
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowAuth(false)}>
            <ChevronLeft color={COLORS.navy} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Identity</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.warningBox}>
            <ShieldAlert color={isDelete ? COLORS.danger : COLORS.gold} size={48} />
            <Text style={styles.warningTitle}>
              {isDelete ? 'Permanently Delete Account?' : 'Deactivate Account?'}
            </Text>
            <Text style={styles.warningText}>
              {isDelete 
                ? 'This action cannot be undone. All your matches, messages, and profile data will be erased.' 
                : 'Your profile will be hidden from everyone. You can reactivate it anytime by logging back in.'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {isDelete ? "Type 'DELETE' to confirm" : "Press confirm to deactivate"}
            </Text>
            {isDelete && (
              <TextInput
                style={styles.input}
                placeholder="Type DELETE"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
                value={confirmText}
                onChangeText={setConfirmText}
              />
            )}
          </View>

          <PremiumButton 
            title={loading ? 'Verifying...' : `Confirm ${isDelete ? 'Deletion' : 'Deactivation'}`} 
            onPress={handleAuthenticate}
            disabled={loading}
            style={isDelete ? { backgroundColor: COLORS.danger } : {}}
            outline={isDelete} // Use outline for delete to make it look different
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.navy} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Account</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.actionCard} onPress={() => handleActionClick('deactivate')}>
          <View style={styles.actionIconWrapper}>
            <UserMinus color={COLORS.navy} size={24} />
          </View>
          <View style={styles.actionTextWrapper}>
            <Text style={styles.actionTitle}>Deactivate Account</Text>
            <Text style={styles.actionDesc}>Hide your profile temporarily. You won't be shown to anyone.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, styles.dangerCard]} onPress={() => handleActionClick('delete')}>
          <View style={[styles.actionIconWrapper, styles.dangerIconWrapper]}>
            <ShieldAlert color={COLORS.danger} size={24} />
          </View>
          <View style={styles.actionTextWrapper}>
            <Text style={[styles.actionTitle, { color: COLORS.danger }]}>Delete Account</Text>
            <Text style={styles.actionDesc}>Permanently remove your account and all data. This cannot be undone.</Text>
          </View>
        </TouchableOpacity>
      </View>
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
    padding: 20,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  dangerCard: {
    borderColor: 'rgba(230, 57, 70, 0.3)',
    backgroundColor: 'rgba(230, 57, 70, 0.02)',
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dangerIconWrapper: {
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
  },
  actionTextWrapper: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  warningBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 30,
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
});

export default ManageAccountScreen;
