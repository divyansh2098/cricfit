import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { StepIndicator } from '@/components/StepIndicator';
import { OptionPicker } from '@/components/OptionPicker';
import { NumberInput } from '@/components/NumberInput';
import { TextInputField } from '@/components/TextInputField';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { insertInnings } from '@/db/queries';
import {
  MatchFormat,
  MatchResult,
  MatchScenario,
  Dismissal,
  Mindset,
} from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 9;

const FORMATS: MatchFormat[] = ['T20', 'ODI', 'Test', 'Club'];
const RESULTS: MatchResult[] = ['Won', 'Lost', 'Draw', 'No Result'];
const SCENARIOS: MatchScenario[] = ['Chasing', 'Setting'];
const DISMISSALS: Dismissal[] = [
  'Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Not Out', 'Retired',
];
const MINDSETS: Mindset[] = ['Confident', 'Neutral', 'Nervous'];
const WICKET_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface FormState {
  format: MatchFormat | null;
  opponent: string;
  venue: string;
  result: MatchResult | null;
  scoreAtEntry: string;
  wicketsAtEntry: string;
  scenario: MatchScenario | null;
  runsRequired: string;
  runsScored: string;
  ballsFaced: string;
  fours: string;
  sixes: string;
  dismissal: Dismissal | null;
  mindset: Mindset | null;
  mindsetNotes: string;
}

const INITIAL_FORM: FormState = {
  format: null,
  opponent: '',
  venue: '',
  result: null,
  scoreAtEntry: '',
  wicketsAtEntry: '',
  scenario: null,
  runsRequired: '',
  runsScored: '',
  ballsFaced: '',
  fours: '0',
  sixes: '0',
  dismissal: null,
  mindset: null,
  mindsetNotes: '',
};

interface StepConfig {
  title: string;
  subtitle: string;
  isValid: (form: FormState) => boolean;
}

const STEPS: StepConfig[] = [
  {
    title: 'What format did you play?',
    subtitle: 'Select the match format',
    isValid: (f) => f.format !== null,
  },
  {
    title: 'Who did you play against?',
    subtitle: 'Enter the opponent name',
    isValid: (f) => f.opponent.trim().length > 0,
  },
  {
    title: 'Where was the match?',
    subtitle: 'Enter the venue',
    isValid: (f) => f.venue.trim().length > 0,
  },
  {
    title: 'What was the result?',
    subtitle: 'How did the match end?',
    isValid: (f) => f.result !== null,
  },
  {
    title: 'Score when you walked in?',
    subtitle: 'Team score and wickets down at the time',
    isValid: (f) => f.scoreAtEntry.length > 0 && f.wicketsAtEntry.length > 0,
  },
  {
    title: 'Chasing or setting?',
    subtitle: 'What was the match scenario',
    isValid: (f) =>
      f.scenario !== null &&
      (f.scenario === 'Setting' || f.runsRequired.length > 0),
  },
  {
    title: 'How did you bat?',
    subtitle: 'Enter your batting stats',
    isValid: (f) => f.runsScored.length > 0 && f.ballsFaced.length > 0,
  },
  {
    title: 'How were you dismissed?',
    subtitle: 'Mode of dismissal',
    isValid: (f) => f.dismissal !== null,
  },
  {
    title: 'What was your mindset?',
    subtitle: 'How were you feeling going in?',
    isValid: (f) => f.mindset !== null,
  },
];

export default function LogInningsScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const { isListening, toggle: toggleVoice } = useVoiceInput(
    useCallback((text: string) => {
      update('mindsetNotes', text);
    }, [update])
  );

  const strikeRate =
    form.ballsFaced && parseInt(form.ballsFaced) > 0
      ? ((parseInt(form.runsScored || '0') / parseInt(form.ballsFaced)) * 100).toFixed(1)
      : null;

  const animateToStep = useCallback(
    (nextStep: number, direction: 1 | -1) => {
      const outX = -direction * SCREEN_WIDTH;
      const inX = direction * SCREEN_WIDTH;

      opacity.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) });
      translateX.value = withTiming(
        outX,
        { duration: 220, easing: Easing.in(Easing.ease) },
        () => {
          runOnJS(setStep)(nextStep);
          translateX.value = inX;
          opacity.value = 0;
          translateX.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.ease) });
          opacity.value = withTiming(1, { duration: 220 });
        }
      );
    },
    [opacity, translateX]
  );

  const goNext = useCallback(() => {
    if (!STEPS[step].isValid(form)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < TOTAL_STEPS - 1) {
      animateToStep(step + 1, 1);
    } else {
      handleSave();
    }
  }, [step, form, animateToStep]);

  const goBack = useCallback(() => {
    if (step === 0) {
      navigation.goBack();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateToStep(step - 1, -1);
  }, [step, navigation, animateToStep]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const balls = parseInt(form.ballsFaced || '0');
      const runs = parseInt(form.runsScored || '0');
      insertInnings({
        date: now.split('T')[0],
        format: form.format!,
        opponent: form.opponent.trim(),
        venue: form.venue.trim(),
        result: form.result!,
        scoreAtEntry: parseInt(form.scoreAtEntry || '0'),
        wicketsAtEntry: parseInt(form.wicketsAtEntry || '0'),
        scenario: form.scenario!,
        runsRequired: form.scenario === 'Chasing' ? parseInt(form.runsRequired || '0') : null,
        runsScored: runs,
        ballsFaced: balls,
        fours: parseInt(form.fours || '0'),
        sixes: parseInt(form.sixes || '0'),
        strikeRate: balls > 0 ? parseFloat(((runs / balls) * 100).toFixed(2)) : 0,
        dismissal: form.dismissal!,
        mindset: form.mindset!,
        mindsetNotes: form.mindsetNotes,
        createdAt: now,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('TrackerDashboard', { saved: true });
    } catch {
      Alert.alert('Error', 'Could not save innings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const currentStep = STEPS[step];
  const canProceed = currentStep.isValid(form);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with progress bar */}
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity onPress={goBack} className="w-10 h-10 items-center justify-center">
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View className="flex-1 mx-4">
            <View className="h-1.5 bg-surface rounded-full overflow-hidden">
              <Animated.View
                style={{
                  width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
                  height: '100%',
                  backgroundColor: '#22c55e',
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
          <Text className="text-muted text-sm">{step + 1}/{TOTAL_STEPS}</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[animatedStyle, { flex: 1, paddingHorizontal: 20, paddingTop: 32 }]}>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            <Text className="text-white text-3xl font-bold mb-2 leading-tight">
              {currentStep.title}
            </Text>
            <Text className="text-muted text-base mb-8">{currentStep.subtitle}</Text>

            {/* Step 0 — Format */}
            {step === 0 && (
              <OptionPicker<MatchFormat>
                options={FORMATS}
                selected={form.format}
                onSelect={(v) => update('format', v)}
                columns={2}
              />
            )}

            {/* Step 1 — Opponent */}
            {step === 1 && (
              <TextInputField
                value={form.opponent}
                onChange={(v) => update('opponent', v)}
                placeholder="e.g. Mumbai XI"
              />
            )}

            {/* Step 2 — Venue */}
            {step === 2 && (
              <TextInputField
                value={form.venue}
                onChange={(v) => update('venue', v)}
                placeholder="e.g. Wankhede Stadium"
              />
            )}

            {/* Step 3 — Result */}
            {step === 3 && (
              <OptionPicker<MatchResult>
                options={RESULTS}
                selected={form.result}
                onSelect={(v) => update('result', v)}
                columns={2}
              />
            )}

            {/* Step 4 — Score at entry */}
            {step === 4 && (
              <View style={{ gap: 24 }}>
                <View>
                  <Text className="text-muted text-sm mb-3 uppercase tracking-wider">Team score</Text>
                  <NumberInput
                    value={form.scoreAtEntry}
                    onChange={(v) => update('scoreAtEntry', v)}
                    placeholder="0"
                    min={0}
                    max={999}
                    suffix="runs"
                  />
                </View>
                <View>
                  <Text className="text-muted text-sm mb-3 uppercase tracking-wider">Wickets down</Text>
                  <OptionPicker<string>
                    options={WICKET_OPTIONS}
                    selected={form.wicketsAtEntry}
                    onSelect={(v) => update('wicketsAtEntry', v)}
                    columns={3}
                  />
                </View>
              </View>
            )}

            {/* Step 5 — Scenario */}
            {step === 5 && (
              <View style={{ gap: 24 }}>
                <OptionPicker<MatchScenario>
                  options={SCENARIOS}
                  selected={form.scenario}
                  onSelect={(v) => update('scenario', v)}
                  columns={2}
                />
                {form.scenario === 'Chasing' && (
                  <View>
                    <Text className="text-muted text-sm mb-3 uppercase tracking-wider">Runs required</Text>
                    <NumberInput
                      value={form.runsRequired}
                      onChange={(v) => update('runsRequired', v)}
                      placeholder="0"
                      min={0}
                      max={999}
                      suffix="runs"
                    />
                  </View>
                )}
              </View>
            )}

            {/* Step 6 — Batting stats */}
            {step === 6 && (
              <View style={{ gap: 20 }}>
                <View>
                  <Text className="text-muted text-sm mb-3 uppercase tracking-wider">Runs scored</Text>
                  <NumberInput
                    value={form.runsScored}
                    onChange={(v) => update('runsScored', v)}
                    placeholder="0"
                    min={0}
                    max={500}
                  />
                </View>
                <View>
                  <Text className="text-muted text-sm mb-3 uppercase tracking-wider">Balls faced</Text>
                  <NumberInput
                    value={form.ballsFaced}
                    onChange={(v) => update('ballsFaced', v)}
                    placeholder="0"
                    min={0}
                    max={999}
                  />
                </View>
                <View className="flex-row" style={{ gap: 16 }}>
                  <View className="flex-1">
                    <Text className="text-muted text-sm mb-3 uppercase tracking-wider">Fours</Text>
                    <NumberInput
                      value={form.fours}
                      onChange={(v) => update('fours', v)}
                      min={0}
                      max={99}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-muted text-sm mb-3 uppercase tracking-wider">Sixes</Text>
                    <NumberInput
                      value={form.sixes}
                      onChange={(v) => update('sixes', v)}
                      min={0}
                      max={99}
                    />
                  </View>
                </View>
                {strikeRate && (
                  <View className="bg-surface rounded-2xl p-4 items-center border border-border">
                    <Text className="text-muted text-xs uppercase tracking-wider mb-1">Strike Rate</Text>
                    <Text className="text-primary text-3xl font-bold">{strikeRate}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Step 7 — Dismissal */}
            {step === 7 && (
              <OptionPicker<Dismissal>
                options={DISMISSALS}
                selected={form.dismissal}
                onSelect={(v) => update('dismissal', v)}
                columns={2}
              />
            )}

            {/* Step 8 — Mindset */}
            {step === 8 && (
              <View style={{ gap: 24 }}>
                <OptionPicker<Mindset>
                  options={MINDSETS}
                  selected={form.mindset}
                  onSelect={(v) => update('mindset', v)}
                  columns={3}
                />
                <View>
                  <Text className="text-muted text-sm mb-3 uppercase tracking-wider">
                    Additional notes{' '}
                    <Text className="text-muted normal-case" style={{ letterSpacing: 0 }}>(optional)</Text>
                  </Text>
                  <TextInputField
                    value={form.mindsetNotes}
                    onChange={(v) => update('mindsetNotes', v)}
                    placeholder="How were you feeling? Any context..."
                    multiline
                    onVoicePress={toggleVoice}
                    isListening={isListening}
                  />
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <View className="px-5 pb-8 pt-4">
          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.85}
            disabled={!canProceed || isSaving}
            className={`h-14 rounded-2xl items-center justify-center ${
              canProceed && !isSaving ? 'bg-primary' : 'bg-surface'
            }`}
          >
            <Text
              className={`text-base font-bold ${
                canProceed && !isSaving ? 'text-white' : 'text-muted'
              }`}
            >
              {step === TOTAL_STEPS - 1
                ? isSaving
                  ? 'Saving...'
                  : 'Save Innings'
                : 'Continue →'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
