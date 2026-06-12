import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

interface NumberInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  suffix?: string;
}

export function NumberInput({ value, onChange, placeholder, min, max, suffix }: NumberInputProps) {
  const adjust = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = parseInt(value || '0', 10);
    const next = Math.max(min ?? 0, Math.min(max ?? 999, current + delta));
    onChange(String(next));
  };

  return (
    <View className="flex-row items-center bg-surface border-2 border-border rounded-2xl overflow-hidden">
      <TouchableOpacity
        onPress={() => adjust(-1)}
        activeOpacity={0.7}
        className="w-14 h-16 items-center justify-center"
      >
        <Text className="text-white text-2xl font-light">−</Text>
      </TouchableOpacity>

      <View className="flex-1 items-center flex-row justify-center">
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          placeholder={placeholder ?? '0'}
          placeholderTextColor="#64748b"
          className="text-white text-3xl font-bold text-center"
          style={{ minWidth: 60 }}
        />
        {suffix ? (
          <Text className="text-muted text-base ml-1 mt-1">{suffix}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={() => adjust(1)}
        activeOpacity={0.7}
        className="w-14 h-16 items-center justify-center"
      >
        <Text className="text-primary text-2xl font-light">+</Text>
      </TouchableOpacity>
    </View>
  );
}
