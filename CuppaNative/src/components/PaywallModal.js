import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';
import { X, Crown, Check, ShieldCheck, Heart, MessageCircle } from 'lucide-react-native';
import Purchases from 'react-native-purchases';
import { AuthContext } from '../context/AuthContext';

const PaywallModal = ({ visible, onClose }) => {
  const { purchasePlan } = React.useContext(AuthContext);
  const [packages, setPackages] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchOfferings = async () => {
      // Safety check
      if (typeof Purchases.getOfferings !== 'function') {
        console.log("RevenueCat not available in this environment.");
        return;
      }

      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (e) {
        console.log("Error fetching RevenueCat offerings:", e);
      }
    };
    if (visible) {
      fetchOfferings();
    }
  }, [visible]);

  const handlePayment = async (planName, planType, pkg = null) => {
    if (pkg && typeof Purchases.purchasePackage === 'function') {
      try {
        setLoading(true);
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        if (typeof customerInfo.entitlements.active['Premium'] !== "undefined") {
          await purchasePlan(planType);
          Alert.alert("Welcome to Cuppa Gold", "Your premium features are now active!");
          onClose();
        }
      } catch (e) {
        if (!e.userCancelled) Alert.alert("Payment Error", e.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback/Simulated Payment for testing
      Alert.alert(
        "Secure Payment Gateway",
        `Redirecting to Razorpay for ${planName}...\n\n(Simulated for testing)`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Pay Now", 
            onPress: async () => {
              setLoading(true);
              const success = await purchasePlan(planType);
              setLoading(false);
              if (success) {
                Alert.alert("Success", `Welcome to the ${planName} membership!`);
                onClose();
              }
            }
          }
        ]
      );
    }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color={COLORS.navy} size={24} />
          </TouchableOpacity>
          
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Unlock Your Dating Potential!</Text>
            
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.gold} style={{ marginVertical: 40 }} />
            ) : (
              <>
                {/* Basic Plan */}
                <TouchableOpacity style={styles.planCard} onPress={() => handlePayment('Weekly Spark (Basic)', 'Basic')}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Weekly Spark</Text>
                    <Text style={styles.planPrice}>₹99</Text>
                  </View>
                  <Text style={styles.planSubtitle}>10 Likes & 10 Messages per day. See who liked you!</Text>
                  <View style={styles.featureList}>
                    <View style={styles.featureItem}><Heart color={COLORS.gold} size={16} /><Text style={styles.featureText}>10 Likes per day</Text></View>
                    <View style={styles.featureItem}><MessageCircle color={COLORS.gold} size={16} /><Text style={styles.featureText}>10 Messages per day</Text></View>
                    <View style={styles.featureItem}><Check color={COLORS.gold} size={16} /><Text style={styles.featureText}>See who liked you & visitors</Text></View>
                    <View style={styles.featureItem}><X color={COLORS.textMuted} size={16} /><Text style={[styles.featureText, {color: COLORS.textMuted}]}>No Likes/Chat from Lists</Text></View>
                  </View>
                  <View style={styles.btnOutline}>
                    <Text style={styles.btnOutlineText}>Get Basic</Text>
                  </View>
                </TouchableOpacity>

                {/* Standard Plan */}
                <TouchableOpacity style={[styles.planCard, styles.recommendedCard]} onPress={() => handlePayment('Monthly Flame (Standard)', 'Standard')}>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>MOST POPULAR</Text>
                  </View>
                  <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Monthly Flame</Text>
                    <Text style={styles.planPrice}>₹399</Text>
                  </View>
                  <Text style={styles.planSubtitle}>Unlimited Likes & Messages for 30 days.</Text>
                  <View style={styles.featureList}>
                    <View style={styles.featureItem}><Heart color={COLORS.gold} size={16} /><Text style={styles.featureText}>Unlimited Likes</Text></View>
                    <View style={styles.featureItem}><MessageCircle color={COLORS.gold} size={16} /><Text style={styles.featureText}>Unlimited Messages</Text></View>
                    <View style={styles.featureItem}><X color={COLORS.textMuted} size={16} /><Text style={[styles.featureText, {color: COLORS.textMuted}]}>No Incognito/Private Mode</Text></View>
                  </View>
                  <View style={styles.btnPrimary}>
                    <Text style={styles.btnPrimaryText}>Get Standard</Text>
                  </View>
                </TouchableOpacity>

                {/* Premium Plan */}
                <TouchableOpacity style={[styles.planCard, styles.premiumCard]} onPress={() => handlePayment('6 Month Gold (Premium)', 'Premium')}>
                  <View style={styles.goldBadge}>
                    <Crown color={COLORS.navy} size={12} fill={COLORS.navy} />
                    <Text style={styles.goldBadgeText}>CUPPA GOLD</Text>
                  </View>
                  <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>6 Month Gold</Text>
                    <Text style={styles.planPrice}>₹1999</Text>
                  </View>
                  <Text style={styles.planSubtitle}>Unlimited everything for 6 months.</Text>
                  <View style={styles.featureList}>
                    <View style={styles.featureItem}><Heart color={COLORS.gold} size={16} /><Text style={styles.featureText}>Unlimited Likes & Messages</Text></View>
                    <View style={styles.featureItem}><ShieldCheck color={COLORS.gold} size={16} /><Text style={styles.featureText}>Incognito & Private Mode</Text></View>
                    <View style={styles.featureItem}><Check color={COLORS.gold} size={16} /><Text style={styles.featureText}>Full Access to All Features</Text></View>
                  </View>
                  <View style={[styles.btnPrimary, {backgroundColor: COLORS.navy}]}>
                    <Text style={[styles.btnPrimaryText, {color: COLORS.gold}]}>Get Premium</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: COLORS.white,
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 20,
  },
  planCard: {
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  premiumCard: {
    borderColor: COLORS.gold,
    backgroundColor: '#FFFCF5',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 5,
  },
  recommendedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  recommendedCard: {
    borderColor: '#FF6B6B',
  },
  goldBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goldBadgeText: {
    color: COLORS.navy,
    fontSize: 10,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.navy,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.navy,
  },
  planSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 15,
  },
  featureList: {
    marginBottom: 20,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textMain,
  },
  btnOutline: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.navy,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: COLORS.navy,
    fontWeight: 'bold',
  },
  btnPrimary: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: COLORS.navy,
    fontWeight: 'bold',
  },
});

export default PaywallModal;
