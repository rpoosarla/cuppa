import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { COLORS } from '../constants/theme';

export const OnboardingScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.text}>Onboarding Screen</Text>
    <Button title="Complete Onboarding" onPress={() => navigation.navigate('Main')} />
  </View>
);

export const DiscoverScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Discover Screen</Text>
  </View>
);

export const MessagesScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.text}>Messages Screen</Text>
    <Button title="Open Chat" onPress={() => navigation.navigate('Chat', { name: 'Sarah' })} />
  </View>
);

export const ProfileScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.text}>Profile Screen</Text>
    <Button title="Logout" onPress={() => navigation.navigate('Login')} />
  </View>
);

export const ChatScreen = ({ route, navigation }) => (
  <View style={styles.container}>
    <Text style={styles.text}>Chat with {route.params?.name || 'Someone'}</Text>
    <Button title="Back" onPress={() => navigation.goBack()} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
  },
  text: {
    fontSize: 20,
    color: COLORS.navy,
    marginBottom: 20,
  },
});
