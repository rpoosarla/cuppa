import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  Alert
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Send, MoreVertical, ChevronLeft } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import PaywallModal from '../components/PaywallModal';
import { Crown, Lock, X } from 'lucide-react-native';
import { getPlanLimits } from '../constants/plans';
import { maskName } from '../utils/utils';

const ChatScreen = ({ route, navigation }) => {
  const { profile, matchId } = route.params || {};
  const { user, userData } = React.useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const isFree = !userData?.planType || userData?.planType === 'Free';
  const isPremium = !isFree;

// Utilities now imported

  React.useEffect(() => {
    if (!matchId) return;

    // Native Firestore Real-time Listener
    const unsubscribe = db.collection('matches')
      .doc(matchId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isSent: doc.data().senderId === user?.uid
        }));
        setMessages(fetchedMessages);
        setLoading(false);
      }, error => {
        console.error("Chat snapshot error:", error);
      });

    return unsubscribe;
  }, [matchId, user]);

  const handleUnmatch = () => {
    Alert.alert(
      "Unmatch",
      "Are you sure you want to unmatch? You will not be able to message this person again.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Unmatch", 
          style: "destructive", 
          onPress: async () => {
            try {
              await db.collection('matches').doc(matchId).delete();
              navigation.goBack();
              Alert.alert("Unmatched", "Conversation deleted.");
            } catch (error) {
              console.error("Unmatch failed:", error);
            }
          } 
        }
      ]
    );
  };

  const handleReportAndBlock = () => {
    Alert.alert(
      "Report & Block",
      "Are you sure you want to report and block this user? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Report & Block", 
          style: "destructive", 
          onPress: async () => {
            try {
              // 1. Add to blocked list
              await db.collection('users').doc(user.uid).update({
                blockedUsers: firestore.FieldValue.arrayUnion(profile.id)
              });
              // 2. Delete match
              await db.collection('matches').doc(matchId).delete();
              // 3. Optional: Add to a 'reports' collection
              await db.collection('reports').add({
                reporterId: user.uid,
                reportedId: profile.id,
                matchId: matchId,
                reason: "Reported from Chat",
                createdAt: new Date().toISOString()
              });
              navigation.navigate('Main');
              Alert.alert("User Blocked", "You will no longer see this user.");
            } catch (error) {
              console.error("Block failed:", error);
            }
          } 
        }
      ]
    );
  };

  const handleMoreMenu = () => {
    Alert.alert(
      "Options",
      "What would you like to do?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Unmatch", onPress: handleUnmatch },
        { text: "Report & Block", style: "destructive", onPress: handleReportAndBlock }
      ]
    );
  };

  const handleSend = async () => {
    if (!message.trim() || !matchId) return;

    const plan = getPlanLimits(userData?.planType || 'Free');
    const currentMessages = userData?.messagesSentToday || 0;

    if (currentMessages >= plan.dailyMessages) {
      Alert.alert(
        "Message Limit Reached",
        `Your ${plan.name} plan allows ${plan.dailyMessages} messages per day. Upgrade for more!`,
        [
          { text: "Later", style: "cancel" },
          { text: "Upgrade", onPress: () => setPaywallVisible(true) }
        ]
      );
      return;
    }
    
    const msgText = message.trim();
    setMessage('');

    try {
      // 1. Send Message
      await db.collection('matches')
        .doc(matchId)
        .collection('messages')
        .add({
          text: msgText,
          senderId: user.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      // 2. Update parent match document for preview and sorting
      await db.collection('matches').doc(matchId).update({
        lastMessage: msgText,
        lastMessageAt: new Date().toISOString()
      });

      // 2. Update Message Counter using Atomic Increment
      await db.collection('users').doc(user.uid).update({
        messagesSentToday: firestore.FieldValue.increment(1)
      });
    } catch (error) {
      console.error("Error sending message: ", error);
      Alert.alert("Error", "Could not send message.");
    }
  };

  const renderMessage = ({ item }) => {
    const isFree = !userData?.planType || userData?.planType === 'Free';
    const isHidden = isFree && !item.isSent;

    return (
      <View style={[
        styles.bubble, 
        item.isSent ? styles.sentBubble : styles.receivedBubble,
        isHidden && { backgroundColor: COLORS.lightGray, opacity: 0.6 }
      ]}>
        {isHidden ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Lock color={COLORS.textMuted} size={14} />
            <Text style={[styles.messageText, { color: COLORS.textMuted, fontStyle: 'italic' }]}>
              Message locked
            </Text>
          </View>
        ) : (
          <Text style={[
            styles.messageText, 
            item.isSent ? styles.sentText : styles.receivedText
          ]}>
            {item.text}
          </Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.white} size={28} />
        </TouchableOpacity>
        <Image source={{ uri: profile?.photo || profile?.photos?.[0] || 'https://via.placeholder.com/100' }} style={styles.headerAvatar} />
        <Text style={styles.headerName}>
          {isPremium ? profile?.name : maskName(profile?.name)}
        </Text>
        <TouchableOpacity onPress={handleMoreMenu}>
          <MoreVertical color={COLORS.white} size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item?.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.messageList}
        inverted
      />

      {(userData?.planType === 'Free' || !userData?.planType) ? (
        <TouchableOpacity 
          style={styles.premiumOverlay} 
          onPress={() => setPaywallVisible(true)}
        >
          <Crown color={COLORS.gold} size={20} fill={COLORS.gold} />
          <Text style={styles.premiumOverlayText}>Upgrade to Reply</Text>
          <Lock color={COLORS.gold} size={16} />
        </TouchableOpacity>
      ) : (
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Send color={COLORS.navy} size={20} />
          </TouchableOpacity>
        </View>
      )}

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: COLORS.navy,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 12,
  },
  headerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  messageList: {
    padding: 16,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  sentBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.navyLight,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentText: {
    color: COLORS.white,
  },
  receivedText: {
    color: COLORS.textMain,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  premiumOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.navy,
    gap: 12,
  },
  premiumOverlayText: {
    color: COLORS.gold,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ChatScreen;
