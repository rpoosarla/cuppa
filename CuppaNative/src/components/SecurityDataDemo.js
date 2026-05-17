import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { ShieldCheck } from 'lucide-react-native';

// Note: In production, this data should be securely transmitted to Firestore 
// alongside the user's registration payload, not rendered visibly to the user.

const fetchIpAddress = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Error fetching IP:", error);
    return 'Unknown';
  }
};

const SecurityDataDemo = () => {
  const [deviceData, setDeviceData] = useState({
    deviceType: Platform.OS,
    location: 'Detecting...',
    ipAddress: 'Detecting...'
  });

  useEffect(() => {
    const gatherData = async () => {
      // 1. IP Address
      const ip = await fetchIpAddress();

      // 2. Location (Requires permissions)
      let locationString = 'Permission Denied';
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({});
          locationString = `Lat: ${loc.coords.latitude.toFixed(4)}, Lng: ${loc.coords.longitude.toFixed(4)}`;
        }
      } catch(e) {
        console.log(e);
      }

      setDeviceData(prev => ({
        ...prev,
        ipAddress: ip,
        location: locationString
      }));
    };

    gatherData();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ShieldCheck color="#2563EB" size={24} />
        <Text style={styles.title}>Data Capture Test</Text>
      </View>
      <Text style={styles.info}>Device: {deviceData.deviceType}</Text>
      <Text style={styles.info}>IP Address: {deviceData.ipAddress}</Text>
      <Text style={styles.info}>Location: {deviceData.location}</Text>
      <Text style={styles.note}>*This raw data will be saved silently to Firestore during registration.*</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#EBF5FF',
    borderRadius: 8,
    margin: 20,
    borderWidth: 1,
    borderColor: '#93C5FD'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A'
  },
  info: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  note: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 10,
    fontStyle: 'italic'
  }
});

export default SecurityDataDemo;
