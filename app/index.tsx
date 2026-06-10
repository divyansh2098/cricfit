import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ModeCard } from '@/components/ModeCard';

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-5 pt-8">
        <Text className="text-primary text-sm font-semibold tracking-widest uppercase mb-1">
          Cricket
        </Text>
        <Text className="text-white text-3xl font-bold mb-2">CricFit</Text>
        <Text className="text-muted text-base mb-10">
          Track your game. Sharpen your technique.
        </Text>

        <ModeCard
          icon="🏏"
          title="Performance Tracker"
          subtitle="Log every innings and track your batting stats, form, and trends over time."
          onPress={() => navigation.navigate('TrackerDashboard')}
        />

        <ModeCard
          icon="🎥"
          title="Shot Analyzer"
          subtitle="Upload a batting video and get AI-powered feedback on your shot technique."
          onPress={() => navigation.navigate('AnalyzerUpload')}
        />
      </View>
    </SafeAreaView>
  );
}
