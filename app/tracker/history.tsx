import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Animated,
  PanResponder,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { getAllInnings, deleteInnings } from '@/db/queries';
import { InningsSelect } from '@/db/schema';
import { MatchFormat } from '@/types';

// Format chips configuration
const FORMAT_FILTERS: (MatchFormat | 'All')[] = ['All', 'T20', 'ODI', 'Test', 'Club'];

// ─── Swipeable Innings Card Component ───────────────────────────────────────────
interface SwipeableCardProps {
  innings: InningsSelect;
  onDelete: (id: number) => void;
  onPress: () => void;
}

const SwipeableInningsCard: React.FC<SwipeableCardProps> = ({ innings, onDelete, onPress }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const heightVal = useRef(new Animated.Value(130)).current;
  const opacityVal = useRef(new Animated.Value(1)).current;
  const marginVal = useRef(new Animated.Value(12)).current;
  const isSwipedOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger horizontal swipe when movement is horizontal and exceeds threshold
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5 && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        let newX = gestureState.dx;
        if (isSwipedOpen.current) {
          newX -= 80;
        }
        // Clamping swipe movement to prevent swiping to the right
        if (newX > 0) newX = 0;
        if (newX < -120) {
          newX = -120 + (newX + 120) * 0.2; // apply rubber-banding/resistance
        }
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentX = gestureState.dx + (isSwipedOpen.current ? -80 : 0);
        if (currentX < -50) {
          // Snap open to reveal delete button
          isSwipedOpen.current = true;
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        } else {
          // Snap closed
          isSwipedOpen.current = false;
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    isSwipedOpen.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const triggerDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Innings',
      `Are you sure you want to delete your innings against ${innings.opponent}? This action is permanent.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: handleClose },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Animated.parallel([
              Animated.timing(heightVal, {
                toValue: 0,
                duration: 250,
                useNativeDriver: false,
              }),
              Animated.timing(opacityVal, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
              }),
              Animated.timing(marginVal, {
                toValue: 0,
                duration: 250,
                useNativeDriver: false,
              }),
            ]).start(() => {
              onDelete(innings.id);
            });
          },
        },
      ]
    );
  };

  // Badge utility functions
  const getFormatBadgeStyle = (fmt: string) => {
    switch (fmt) {
      case 'T20':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'ODI':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Test':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Club':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getMindsetBadge = (mind: string) => {
    switch (mind) {
      case 'Confident':
        return { emoji: '😊', label: 'Confident', style: 'bg-green-500/10 text-green-400 border border-green-500/20' };
      case 'Neutral':
        return { emoji: '😐', label: 'Neutral', style: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
      case 'Nervous':
        return { emoji: '😰', label: 'Nervous', style: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
      default:
        return { emoji: '🤔', label: mind, style: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const mindInfo = getMindsetBadge(innings.mindset);

  return (
    <Animated.View style={{ height: heightVal, opacity: opacityVal, marginBottom: marginVal, overflow: 'hidden' }}>
      {/* Absolute delete background */}
      <View className="absolute inset-y-0 right-0 w-24 bg-red-600 rounded-2xl flex-row items-center justify-end pr-6">
        <TouchableOpacity onPress={triggerDelete} className="w-12 h-12 items-center justify-center">
          <Ionicons name="trash" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Slideable Card Front */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
        className="flex-1 bg-surface border border-border rounded-2xl p-4 flex-row justify-between"
      >
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} className="flex-1 flex-row justify-between">
          {/* Performance Data (Left) */}
          <View className="justify-between flex-1 pr-2">
            <View className="flex-row items-baseline gap-1">
              <Text className="text-white text-3xl font-black">{innings.runsScored}</Text>
              <Text className="text-muted text-sm font-semibold">({innings.ballsFaced})</Text>
              <Text className="text-primary text-xs font-bold ml-2">SR {innings.strikeRate.toFixed(1)}</Text>
            </View>

            <View className="flex-row items-center gap-2 mt-1">
              <Text className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide ${getFormatBadgeStyle(innings.format)}`}>
                {innings.format}
              </Text>
              <Text className="text-muted text-xs font-semibold">{innings.dismissal}</Text>
            </View>

            <View className="flex-row mt-2">
              <Text className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${mindInfo.style}`}>
                {mindInfo.emoji} {mindInfo.label}
              </Text>
            </View>
          </View>

          {/* Context Data (Right) */}
          <View className="items-end justify-between max-w-[50%]">
            <Text className="text-muted text-[10px] font-bold tracking-wider uppercase">
              {formatDate(innings.date)}
            </Text>

            <View className="items-end">
              <Text className="text-white text-sm font-extrabold text-right" numberOfLines={1}>
                vs {innings.opponent}
              </Text>
              <Text className="text-muted text-xs text-right mt-0.5" numberOfLines={1}>
                📍 {innings.venue}
              </Text>
            </View>

            <View className={`rounded px-2 py-0.5 border ${
              innings.result === 'Won' 
                ? 'bg-green-500/10 border-green-500/20' 
                : innings.result === 'Lost' 
                  ? 'bg-rose-500/10 border-rose-500/20' 
                  : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              <Text className={`text-[9px] font-black uppercase tracking-wider ${
                innings.result === 'Won' 
                  ? 'text-green-400' 
                  : innings.result === 'Lost' 
                    ? 'text-rose-400' 
                    : 'text-amber-400'
              }`}>
                {innings.result}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Main History Screen Component ──────────────────────────────────────────────
export default function HistoryScreen() {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const [inningsList, setInningsList] = useState<InningsSelect[]>([]);
  const [filterFormat, setFilterFormat] = useState<MatchFormat | 'All'>('All');
  const [selectedInnings, setSelectedInnings] = useState<InningsSelect | null>(null);

  const fetchInnings = () => {
    try {
      const data = getAllInnings();
      setInningsList(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to retrieve innings log history.');
      console.error(err);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchInnings();
    }
  }, [isFocused]);

  const handleDelete = (id: number) => {
    try {
      deleteInnings(id);
      setInningsList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete entry from database.');
      console.error(err);
    }
  };

  const filteredInnings = useMemo(() => {
    if (filterFormat === 'All') return inningsList;
    return inningsList.filter((item) => item.format === filterFormat);
  }, [inningsList, filterFormat]);

  const getMindsetInfo = (mind: string | null) => {
    if (!mind) return { emoji: '🤔', label: 'Unknown', style: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' };
    switch (mind) {
      case 'Confident':
        return { emoji: '😊', label: 'Confident', style: 'bg-green-500/10 text-green-400 border border-green-500/20' };
      case 'Neutral':
        return { emoji: '😐', label: 'Neutral', style: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
      case 'Nervous':
        return { emoji: '😰', label: 'Nervous', style: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
      default:
        return { emoji: '🤔', label: mind, style: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' };
    }
  };

  const formatDateFull = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  const selectedMindInfo = getMindsetInfo(selectedInnings?.mindset || null);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Format Filter Bar */}
      <View className="py-4 border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {FORMAT_FILTERS.map((fmt) => {
            const isActive = filterFormat === fmt;
            return (
              <TouchableOpacity
                key={fmt}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilterFormat(fmt);
                }}
                className={`px-4 py-2 rounded-full border ${
                  isActive
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <Text
                  className={`text-sm font-extrabold ${
                    isActive ? 'text-white' : 'text-muted'
                  }`}
                >
                  {fmt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Innings List */}
      <FlatList
        data={filteredInnings}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="py-20 items-center justify-center">
            <Ionicons name="folder-open-outline" size={64} color="#64748b" />
            <Text className="text-white text-lg font-bold mt-4">No Innings Found</Text>
            <Text className="text-muted text-sm text-center mt-2 px-6">
              {filterFormat === 'All'
                ? 'You haven\'t logged any innings yet. Go to the dashboard and press "+" to log your first match!'
                : `No innings logged for format: ${filterFormat}.`}
            </Text>
            {filterFormat === 'All' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('LogInnings')}
                className="mt-6 bg-primary px-6 py-3 rounded-2xl"
              >
                <Text className="text-white font-bold text-sm">Log Your First Innings</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableInningsCard
            innings={item}
            onDelete={handleDelete}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedInnings(item);
            }}
          />
        )}
      />

      {/* Detail Modal */}
      {selectedInnings && (
        <Modal
          visible={selectedInnings !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedInnings(null)}
        >
          <View className="flex-1 justify-end bg-black/75">
            <View className="bg-surface rounded-t-[32px] border-t border-border h-[88%] p-6">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between pb-4 border-b border-border">
                <View>
                  <Text className="text-muted text-[10px] font-black uppercase tracking-wider">
                    Innings Details
                  </Text>
                  <Text className="text-white text-xl font-black mt-0.5">
                    vs {selectedInnings.opponent}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedInnings(null);
                  }}
                  className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center border border-slate-700/50"
                >
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
              >
                {/* Format, Date, Venue, Result cards */}
                <View className="flex-row flex-wrap mb-6" style={{ gap: 12 }}>
                  <View className="flex-1 min-w-[45%] bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                    <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Format</Text>
                    <Text className="text-white text-base font-extrabold mt-1">{selectedInnings.format}</Text>
                  </View>
                  <View className="flex-1 min-w-[45%] bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                    <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Result</Text>
                    <Text className={`text-base font-extrabold mt-1 ${
                      selectedInnings.result === 'Won'
                        ? 'text-green-400'
                        : selectedInnings.result === 'Lost'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                    }`}>
                      {selectedInnings.result}
                    </Text>
                  </View>
                  <View className="w-full bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                    <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Match Date</Text>
                    <Text className="text-white text-sm font-extrabold mt-1">
                      {formatDateFull(selectedInnings.date)}
                    </Text>
                  </View>
                  <View className="w-full bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                    <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Venue</Text>
                    <Text className="text-white text-sm font-extrabold mt-1">📍 {selectedInnings.venue}</Text>
                  </View>
                </View>

                {/* Scorecard Box */}
                <Text className="text-white text-sm font-black mb-3 uppercase tracking-wider">Batting Performance</Text>
                <View className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 mb-6">
                  <View className="flex-row items-center justify-between border-b border-slate-800/80 pb-3">
                    <View>
                      <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Runs Scored</Text>
                      <Text className="text-primary text-4xl font-black mt-1">{selectedInnings.runsScored}</Text>
                    </View>
                    <View className="items-end text-right">
                      <Text className="text-muted text-[10px] font-bold uppercase tracking-wider text-right">Balls Faced</Text>
                      <Text className="text-white text-4xl font-black mt-1">{selectedInnings.ballsFaced}</Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between py-3 border-b border-slate-800/80">
                    <View>
                      <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Fours (4s)</Text>
                      <Text className="text-white text-xl font-bold mt-0.5">{selectedInnings.fours}</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Sixes (6s)</Text>
                      <Text className="text-white text-xl font-bold mt-0.5">{selectedInnings.sixes}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-muted text-[10px] font-bold uppercase tracking-wider text-right">Strike Rate</Text>
                      <Text className="text-white text-xl font-bold mt-0.5">{selectedInnings.strikeRate.toFixed(2)}</Text>
                    </View>
                  </View>

                  <View className="pt-3">
                    <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Dismissal Mode</Text>
                    <Text className="text-white text-sm font-semibold mt-1">❌ {selectedInnings.dismissal}</Text>
                  </View>
                </View>

                {/* Entry & Match Situation */}
                <Text className="text-white text-sm font-black mb-3 uppercase tracking-wider">Match Situation</Text>
                <View className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 mb-6" style={{ gap: 12 }}>
                  <View className="flex-row justify-between">
                    <Text className="text-muted text-xs font-semibold">Scenario</Text>
                    <Text className="text-white text-xs font-black uppercase tracking-wider">{selectedInnings.scenario}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted text-xs font-semibold">Team Score at Entry</Text>
                    <Text className="text-white text-xs font-extrabold">{selectedInnings.scoreAtEntry} for {selectedInnings.wicketsAtEntry}</Text>
                  </View>
                  {selectedInnings.scenario === 'Chasing' && selectedInnings.runsRequired !== null && (
                    <View className="flex-row justify-between border-t border-slate-800/80 pt-2 mt-1">
                      <Text className="text-muted text-xs font-semibold">Target / Runs Required</Text>
                      <Text className="text-primary text-xs font-black">{selectedInnings.runsRequired} runs</Text>
                    </View>
                  )}
                </View>

                {/* Mindset & Psychology */}
                <Text className="text-white text-sm font-black mb-3 uppercase tracking-wider">Mindset & Psychology</Text>
                <View className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Text className="text-muted text-xs font-semibold">Felt:</Text>
                    <Text className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${selectedMindInfo.style}`}>
                      {selectedMindInfo.emoji} {selectedMindInfo.label}
                    </Text>
                  </View>
                  <View className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <Text className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Notes</Text>
                    <Text className="text-white text-sm leading-relaxed italic">
                      {selectedInnings.mindsetNotes.trim() || 'No psychological mindset notes logged for this innings.'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
