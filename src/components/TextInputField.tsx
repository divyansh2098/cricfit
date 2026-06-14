import React from 'react';
import { TextInput, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

interface TextInputFieldProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
  onVoicePress?: () => void;
  isListening?: boolean;
}

export function TextInputField({
  value,
  onChange,
  placeholder,
  multiline = false,
  onVoicePress,
  isListening = false,
}: TextInputFieldProps) {
  return (
    <View
      className={`bg-surface border-2 border-border rounded-2xl px-4 flex-row items-${multiline ? 'start' : 'center'}`}
      style={{ minHeight: multiline ? 100 : 60 }}
    >
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        multiline={multiline}
        className="flex-1 text-white text-base py-4"
        style={{ textAlignVertical: multiline ? 'top' : 'center' }}
      />
      {onVoicePress && (
        <TouchableOpacity onPress={onVoicePress} className="ml-2 mt-3">
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={22}
            color={isListening ? '#22c55e' : '#64748b'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
