import React from 'react';
import { View, Text } from 'react-native';

export default function ResultScreen() {
  return (
    <View className="flex-1 bg-background px-4 pt-6">
      <Text className="text-white text-2xl font-bold">Analysis Result</Text>
      <Text className="text-muted mt-2">Results coming in Phase 9.</Text>
    </View>
  );
}
