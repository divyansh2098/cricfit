import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

interface OptionPickerProps<T extends string> {
  options: T[];
  selected: T | null;
  onSelect: (value: T) => void;
  columns?: 1 | 2 | 3;
}

export function OptionPicker<T extends string>({
  options,
  selected,
  onSelect,
  columns = 2,
}: OptionPickerProps<T>) {
  const handleSelect = (value: T) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(value);
  };

  return (
    <View className={`flex-row flex-wrap gap-3`}>
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => handleSelect(option)}
            activeOpacity={0.8}
            style={{ width: columns === 3 ? '30%' : columns === 2 ? '47%' : '100%' }}
            className={`py-4 px-3 rounded-2xl border-2 items-center justify-center ${
              isSelected
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            }`}
          >
            <Text
              className={`font-semibold text-sm ${
                isSelected ? 'text-white' : 'text-muted'
              }`}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
