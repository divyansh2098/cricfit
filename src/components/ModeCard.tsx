import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';

interface ModeCardProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

export function ModeCard({ title, subtitle, icon, onPress }: ModeCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-surface rounded-2xl p-6 mb-4 border border-border"
    >
      <Text className="text-4xl mb-3">{icon}</Text>
      <Text className="text-white text-xl font-bold mb-1">{title}</Text>
      <Text className="text-muted text-sm leading-5">{subtitle}</Text>
    </TouchableOpacity>
  );
}
