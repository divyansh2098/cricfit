import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-2xl font-bold">My Performance</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('LogInnings')}
          className="w-10 h-10 bg-primary rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <View className="bg-surface rounded-2xl p-6 items-center justify-center h-40">
        <Text className="text-muted text-base">No innings logged yet.</Text>
        <Text className="text-muted text-sm mt-1">Tap + to log your first innings.</Text>
      </View>
    </ScrollView>
  );
}
