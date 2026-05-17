import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const PremiumButton = ({ title, onPress, style, textStyle, disabled, outline }) => {
  if (outline) {
    return (
      <TouchableOpacity 
        style={[styles.outlineButton, style, disabled && styles.disabled]} 
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.outlineButtonText, textStyle]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.buttonContainer, style, disabled && styles.disabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <LinearGradient
        colors={[COLORS.gold, '#B5952F']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: 'bold',
  },
  outlineButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default PremiumButton;
