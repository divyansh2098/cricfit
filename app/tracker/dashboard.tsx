import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function DashboardScreen() {
  return (
    <ScrollView className="flex-1 bg-background px-4 pt-6">
      <Text className="text-white text-2xl font-bold mb-6">My Performance</Text>
      <View className="bg-surface rounded-2xl p-6 items-center justify-center h-40">
        <Text className="text-muted text-base">No innings logged yet.</Text>
        <Text className="text-muted text-sm mt-1">Tap + to log your first innings.</Text>
      </View>
    </ScrollView>
  );
}
