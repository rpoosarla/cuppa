import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, ScrollView, Animated, PanResponder } from 'react-native';
import { COLORS } from '../constants/theme';
import { RotateCcw, ShieldAlert, X, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

const ProfileCard = ({ profile, onLike, onNext, onRewind, onReport, onDoubleTap, isMasked = false }) => {
  const position = useRef(new Animated.ValueXY()).current;
  const lastTap = useRef(0);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
      if (onDoubleTap) onDoubleTap(profile);
    } else {
      lastTap.current = now;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        // Detect Tap
        if (Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
          handleTap();
          resetPosition();
          return;
        }

        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const forceSwipe = (direction) => {
    const x = direction === 'right' ? width + 100 : -width - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction) => {
    direction === 'right' ? onLike(profile) : onNext();
    position.setValue({ x: 0, y: 0 });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-width * 1.5, 0, width * 1.5],
      outputRange: ['-30deg', '0deg', '30deg']
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    };
  };

  const maskName = (fullName) => {
    if (!fullName) return "?.?.";
    const parts = fullName.split(' ');
    const firstInitial = parts[0]?.[0] || '?';
    const secondPartSecondLetter = parts[1]?.[1] || parts[0]?.[1] || '?';
    return `${firstInitial}. ${secondPartSecondLetter}.`;
  };

  return (
    <Animated.View 
      style={[styles.card, getCardStyle()]} 
      {...panResponder.panHandlers}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: profile.photos[0] }} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />
        <View style={styles.infoOverlay}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>
              {isMasked ? maskName(profile.name) : profile.name}, {profile.age}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile.category}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
        >
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.detailsText}>{profile.intent}</Text>

          <Text style={styles.sectionTitle}>Community & Languages</Text>
          <Text style={styles.detailsText}>
            {profile.community} • {profile.languages && profile.languages.length > 0 ? profile.languages.join(', ') : 'Hindi, English'}
          </Text>
          {/* Add extra space at the bottom of scroll to prevent overlap with buttons if needed */}
          <View style={{ height: 10 }} />
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onRewind}>
            <RotateCcw color={COLORS.gold} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={onNext}>
            <X color={COLORS.danger} size={32} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.mainAction]} onPress={() => onLike(profile)}>
            <Heart color={COLORS.white} size={32} fill={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onReport}>
            <ShieldAlert color={COLORS.textMuted} size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width - 32,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    flex: 1,
    maxHeight: height * 0.75,
    marginBottom: 20,
  },
  imageContainer: {
    height: '65%',
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.goldLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeText: {
    color: COLORS.navy,
    fontWeight: 'bold',
    fontSize: 12,
  },
  detailsContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, // More bottom padding
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollArea: {
    flex: 1,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.navy,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: COLORS.textMain,
    marginBottom: 12,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray + '20', // Very light border
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  mainAction: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ProfileCard;
