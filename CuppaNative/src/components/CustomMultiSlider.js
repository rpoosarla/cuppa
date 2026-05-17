import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Platform } from 'react-native';

const CustomMultiSlider = ({ min, max, minValue, maxValue, onValuesChange }) => {
  const [containerWidth, setContainerWidth] = useState(0);

  const getValueChange = (dx) => {
    if (containerWidth === 0) return 0;
    const valuePerPixel = (max - min) / containerWidth;
    return Math.round(dx * valuePerPixel);
  };

  const startMinValue = useRef(minValue);
  const startMaxValue = useRef(maxValue);

  const minResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startMinValue.current = minValue;
      },
      onPanResponderMove: (evt, gestureState) => {
        let newVal = startMinValue.current + getValueChange(gestureState.dx);
        newVal = Math.max(min, Math.min(newVal, maxValue - 1));
        onValuesChange(newVal, maxValue);
      },
    })
  ).current;

  const maxResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startMaxValue.current = maxValue;
      },
      onPanResponderMove: (evt, gestureState) => {
        let newVal = startMaxValue.current + getValueChange(gestureState.dx);
        newVal = Math.max(minValue + 1, Math.min(newVal, max));
        onValuesChange(minValue, newVal);
      },
    })
  ).current;

  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  return (
    <View 
      style={styles.container} 
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.track} />
      <View style={[styles.fill, { left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }]} />
      
      <View 
        style={[styles.thumbContainer, { left: `${minPercent}%` }]} 
        {...minResponder.panHandlers}
      >
        <View style={styles.thumb} />
      </View>

      <View 
        style={[styles.thumbContainer, { left: `${maxPercent}%` }]} 
        {...maxResponder.panHandlers}
      >
        <View style={styles.thumb} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 15,
  },
  track: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
    left: 15,
    right: 15,
  },
  fill: {
    height: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    position: 'absolute',
    marginLeft: 15,
  },
  thumbContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -5, // Offset half width so the thumb is centered
    zIndex: 10,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  }
});

export default CustomMultiSlider;
