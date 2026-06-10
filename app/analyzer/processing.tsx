import React from 'react';
import { View, Text } from 'react-native';

export default function ProcessingScreen() {
  return (
    <View className="flex-1 bg-background px-4 pt-6 items-center justify-center">
      <Text className="text-white text-xl font-bold">Analyzing...</Text>
      <Text className="text-muted mt-2">Coming in Phase 6.</Text>
    </View>
  );
}
