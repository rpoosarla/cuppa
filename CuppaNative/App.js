import './src/config/firebase';
import React from 'react';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

import Purchases from 'react-native-purchases';

// Global Error Handler
if (global.ErrorUtils) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();

  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('CRITICAL APP ERROR:', error);

    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

export default function App() {

  React.useEffect(() => {

    // RevenueCat Setup
    const setupPurchases = async () => {
      try {
        if (
          Platform.OS === 'android' &&
          typeof Purchases.configure === 'function'
        ) {
          Purchases.configure({
            apiKey: 'test_mKbQtQGuPbUvQf...'
          });

          console.log('RevenueCat initialized');
        }
      } catch (e) {
        console.log('RevenueCat Init Error:', e);
      }
    };

    // Notification Setup
    const setupNotifications = async () => {
      try {

        // Android 13+ permission
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        }

        // Firebase notification permission
        await messaging().requestPermission();

        // Get FCM token
        const token = await messaging().getToken();

        console.log('FCM TOKEN:', token);

        // Current logged in user
        const currentUser = auth().currentUser;

        // Save token to Firestore
        if (currentUser && token) {

          await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .update({
              pushToken: token
            });

          console.log('Push token saved!');
        }

      } catch (e) {
        console.log('Notification setup error:', e);
      }
    };

    setupPurchases();
    setupNotifications();

    // Foreground notifications listener
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification:', remoteMessage);
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'New Notification',
          remoteMessage.notification.body || ''
        );
      }
    });

    return unsubscribe;

  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

