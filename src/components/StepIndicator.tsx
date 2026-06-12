import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface StepIndicatorProps {
  total: number;
  current: number;
}

export function StepIndicator({ total, current }: StepIndicatorProps) {
  return (
    <View className="flex-row gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current;
        const isDone = i < current;
        return (
          <AnimatedDot key={i} isActive={isActive} isDone={isDone} />
        );
      })}
    </View>
  );
}

function AnimatedDot({ isActive, isDone }: { isActive: boolean; isDone: boolean }) {
  const style = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 24 : 8, { duration: 300 }),
    opacity: withTiming(isActive || isDone ? 1 : 0.3, { duration: 300 }),
  }));

  return (
    <Animated.View
      style={[style, {
        height: 8,
        borderRadius: 4,
        backgroundColor: isDone ? '#22c55e' : isActive ? '#ffffff' : '#64748b',
      }]}
    />
  );
}
