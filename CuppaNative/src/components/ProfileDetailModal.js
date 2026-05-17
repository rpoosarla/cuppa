import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { COLORS } from '../constants/theme';
import { X, MapPin, Briefcase, GraduationCap, Heart, Coffee } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const ProfileDetailModal = ({ visible, profile, onClose, onLike, onDislike, canInteract = true }) => {
  if (!profile) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          {/* Photos Area */}
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: profile.photos?.[0] || 'https://via.placeholder.com/600' }}
              style={styles.mainPhoto}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X color={COLORS.white} size={28} />
            </TouchableOpacity>
          </View>

          {/* Info Area */}
          <View style={styles.infoSection}>
            <View style={styles.headerRow}>
              <Text style={styles.name}>{profile.name}, {profile.age || '?'}</Text>
              {profile.isPro && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>

            <View style={styles.locationRow}>
              <MapPin color={COLORS.textMuted} size={16} />
              <Text style={styles.locationText}>{profile.location || 'India'}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio || "No bio provided yet."}</Text>

            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsGrid}>
              <DetailItem icon={Heart} label="Status" value={profile.status || 'Single'} />
              <DetailItem icon={Coffee} label="Looking For" value={profile.intent || 'Marriage'} />
              <DetailItem icon={GraduationCap} label="Community" value={profile.community || 'Open'} />
            </View>

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        {canInteract && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.circleBtn, styles.dislikeBtn]} onPress={() => { onDislike?.(); onClose(); }}>
              <X color={COLORS.danger} size={32} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleBtn, styles.likeBtn]} onPress={() => { onLike?.(); onClose(); }}>
              <Heart color={COLORS.white} size={32} fill={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const DetailItem = ({ icon: Icon, label, value }) => (
  <View style={styles.detailItem}>
    <Icon color={COLORS.navy} size={20} />
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  photoContainer: { width: width, height: height * 0.6, backgroundColor: COLORS.lightGray },
  mainPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  closeBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 5 },
  infoSection: { padding: 20, borderTopLeftRadius: 25, borderTopRightRadius: 25, marginTop: -25, backgroundColor: COLORS.white },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 },
  name: { fontSize: 26, fontWeight: 'bold', color: COLORS.navy },
  proBadge: { backgroundColor: COLORS.gold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  proBadgeText: { color: COLORS.navy, fontSize: 10, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  locationText: { color: COLORS.textMuted, fontSize: 16 },
  divider: { height: 1, backgroundColor: COLORS.lightGray, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.navy, marginBottom: 10, marginTop: 10 },
  bioText: { fontSize: 16, color: COLORS.textMain, lineHeight: 24, marginBottom: 20 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  detailItem: { width: '45%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 12, color: COLORS.textMuted },
  detailValue: { fontSize: 14, color: COLORS.navy, fontWeight: '600' },
  actionRow: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 30, paddingHorizontal: 20 },
  circleBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 },
  dislikeBtn: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightGray },
  likeBtn: { backgroundColor: '#FF4B6C' },
});

export default ProfileDetailModal;
