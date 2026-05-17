import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Check, X, ChevronRight } from 'lucide-react-native';
import { Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { db } from '../config/firebase';
import { maskName } from '../utils/utils';

const MessagesScreen = ({ navigation }) => {
  const { user, userData } = React.useContext(AuthContext);
  const [pendingIntros, setPendingIntros] = React.useState([]);
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
// Utilities now imported

  React.useEffect(() => {
    if (!user) return;

    // Native Firestore Listener for intros
    const unsubscribeIntros = db.collection('intros')
      .where('receiverId', '==', user.uid)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        const intros = [];
        const seenSenderIds = new Set();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!seenSenderIds.has(data.senderId)) {
            seenSenderIds.add(data.senderId);
            intros.push({ id: doc.id, ...data });
          }
        });
        
        setPendingIntros(intros);
      });

    // Native Firestore Listener for matches
    const unsubscribeMatches = db.collection('matches')
      .where('userIds', 'array-contains', user.uid)
      .onSnapshot((snapshot) => {
        const fetchedMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMatches(fetchedMatches);
        setLoading(false);
      });

    return () => {
      unsubscribeIntros();
      unsubscribeMatches();
    };
  }, [user]);

  const handleAccept = async (intro) => {
    if (!userData?.isPro) {
      Alert.alert(
        "Upgrade Required",
        "Free users cannot accept intros. Upgrade to a plan to start chatting!",
        [{ text: "Cancel", style: "cancel" }, { text: "Upgrade Now", onPress: () => navigation.navigate('Profile') }]
      );
      return;
    }

    try {
      // 1. Transaction to Create Match and Delete Intro atomically
      await db.runTransaction(async (transaction) => {
        const today = new Date().toISOString().split('T')[0];
        const currentAccepted = (userData?.lastAcceptDate === today) ? (userData?.introsAcceptedToday || 0) : 0;
        
        const matchRef = db.collection('matches').doc();
        const userRef = db.collection('users').doc(user.uid);
        const introRef = db.collection('intros').doc(intro.id);

        transaction.set(matchRef, {
          userIds: [user.uid, intro.senderId],
          participants: {
            [user.uid]: {
              name: userData?.name || 'User',
              photo: userData?.photos?.[0] || ''
            },
            [intro.senderId]: {
              name: intro.senderName,
              photo: intro.senderPhoto || ''
            }
          },
          createdAt: new Date().toISOString(),
          lastMessage: "You matched! Say hi.",
          lastMessageAt: new Date().toISOString()
        });

        transaction.update(userRef, {
          introsAcceptedToday: currentAccepted + 1,
          lastAcceptDate: today
        });

        // 3. Delete ALL pending intros from this sender to this user
        // Note: Transactions require reads before writes, but since we are deleting based on IDs we already have in the UI
        // or can query outside. Actually, in a transaction, we should use transaction.get if we want to query.
        // For simplicity and safety, we'll delete the specific one in transaction and others can be cleaned up.
        // Wait, better yet, let's just delete the specific one in transaction, 
        // and if there are others, the UI dedup logic will handle it until they are eventually cleared?
        // No, the user wants them GONE.
        
        transaction.delete(introRef);
      });

      // Cleanup any other redundant intros from the same sender
      const otherIntros = await db.collection('intros')
        .where('receiverId', '==', user.uid)
        .where('senderId', '==', intro.senderId)
        .where('status', '==', 'pending')
        .get();
      
      const batch = db.batch();
      otherIntros.forEach(doc => {
        if (doc.id !== intro.id) batch.delete(doc.ref);
      });
      await batch.commit();
      
      Alert.alert("Matched!", `You can now chat with ${intro.senderName}.`);
    } catch (error) {
      console.error("Error accepting intro: ", error);
      Alert.alert("Error", "Could not accept intro. Please check your connection.");
    }
  };

  const handleReject = async (introId) => {
    try {
      await db.collection('intros').doc(introId).delete();
    } catch (error) {
      console.error("Error rejecting intro: ", error);
    }
  };

  const renderPendingItem = ({ item }) => (
    <View style={styles.listItem}>
      <Image 
        source={{ uri: item.senderPhoto || 'https://via.placeholder.com/100' }} 
        style={styles.avatar} 
      />
      <View style={styles.listContent}>
        <Text style={styles.name}>
          {!userData?.isPro ? maskName(item.senderName) : item.senderName}
        </Text>
        <Text style={styles.messageText} numberOfLines={1}>
          {!userData?.isPro ? "Upgrade to read message..." : `"${item.message}"`}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleReject(item.id)}>
          <X color={COLORS.danger} size={16} />
          <Text style={[styles.actionText, { color: COLORS.danger }]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.acceptBtnMain]} onPress={() => handleAccept(item)}>
          <Check color={COLORS.white} size={16} />
          <Text style={[styles.actionText, { color: COLORS.white }]}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMatchItem = ({ item }) => {
    // Determine the other user's info from participants object
    const otherUserId = item.userIds.find(id => id !== user.uid);
    const otherUser = item.participants?.[otherUserId] || { name: 'User', photo: '' };
    const otherName = otherUser.name;
    const otherPhoto = otherUser.photo;

    return (
      <TouchableOpacity 
        style={styles.listItem} 
        onPress={() => navigation.navigate('Chat', { matchId: item.id, profile: { id: otherUserId, name: otherName, photos: [otherPhoto] } })}
      >
        <Image 
          source={{ uri: otherPhoto || 'https://via.placeholder.com/100' }} 
          style={styles.avatar} 
        />
        <View style={styles.listContent}>
          <Text style={styles.name}>
            {!userData?.isPro ? maskName(otherName) : otherName}
          </Text>
          <Text style={styles.messageText} numberOfLines={1}>
            {!userData?.isPro ? "Upgrade to view profile details" : (item.lastMessage || "Tap to chat...")}
          </Text>
        </View>
        <ChevronRight color={COLORS.textMuted} size={20} />
      </TouchableOpacity>
    );
  };

  // Deduplicate matches for the UI
  const uniqueMatches = [];
  const seenUserIds = new Set();
  
  matches.forEach(match => {
    const otherUserId = match.userIds[0] === user.uid ? match.userIds[1] : match.userIds[0];
    if (!seenUserIds.has(otherUserId)) {
      seenUserIds.add(otherUserId);
      uniqueMatches.push(match);
    }
  });

  // Sort by most recent message
  uniqueMatches.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));

  const remainingAccepts = userData?.planType === 'Basic' 
    ? Math.max(0, 15 - (userData.lastAcceptDate === new Date().toISOString().split('T')[0] ? (userData.introsAcceptedToday || 0) : 0)) 
    : 'Unlimited';

  const combinedData = [
    { type: 'header', title: 'Pending Intros', id: 'h1' },
    ...pendingIntros.map(i => ({ ...i, itemType: 'intro' })),
    { type: 'header', title: 'Matches', id: 'h2', marginTop: 24 },
    ...uniqueMatches.map(m => ({ ...m, itemType: 'match' }))
  ];

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={[styles.sectionHeaderRow, item.marginTop && { marginTop: item.marginTop }]}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
          {item.title === 'Pending Intros' && userData?.isPro && (
            <Text style={styles.counterText}>
              {userData.planType === 'Basic' ? `Daily Accepts: ${remainingAccepts}/15` : 'Unlimited Accepts'}
            </Text>
          )}
        </View>
      );
    }
    if (item.itemType === 'intro') return renderPendingItem({ item });
    return renderMatchItem({ item });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={combinedData}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={loading ? null : <Text style={styles.emptyText}>Nothing here yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.navy,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  counterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gold,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lightGray,
  },
  listContent: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.navy,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  acceptBtnMain: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    padding: 16,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  }
});

export default MessagesScreen;
