import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ChatScreen from '../screens/ChatScreen';
import ManageAccountScreen from '../screens/ManageAccountScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import TabNavigator from './TabNavigator';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import PhotoUploadScreen from '../screens/PhotoUploadScreen';
import { COLORS } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, userData, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgLight }}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.bgLight },
      }}
    >
      {user && userData ? (
        // Authenticated Stack
        <>
          {userData?.onboardingCompleted ? (
            <Stack.Screen name="Main" component={TabNavigator} />
          ) : (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: COLORS.navy },
              headerTintColor: COLORS.white,
            }}
          />
          <Stack.Screen name="ManageAccount" component={ManageAccountScreen} />
          <Stack.Screen name="Preferences" component={PreferencesScreen} />
          <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
