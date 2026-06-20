import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { getAllInnings } from '@/db/queries';
import { InningsSelect } from '@/db/schema';
import { MatchFormat } from '@/types';
import { CartesianChart, Bar, Line, PolarChart, Pie } from 'victory-native';
import { matchFont } from '@shopify/react-native-skia';

const FORMAT_FILTERS: (MatchFormat | 'All')[] = ['All', 'T20', 'ODI', 'Test', 'Club'];

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [inningsList, setInningsList] = useState<InningsSelect[]>([]);
  const [filterFormat, setFilterFormat] = useState<MatchFormat | 'All'>('All');

  // Load innings from the database when screen is focused
  useEffect(() => {
    if (isFocused) {
      try {
        const data = getAllInnings();
        setInningsList(data);
      } catch (err) {
        console.error('Failed to load innings:', err);
      }
    }
  }, [isFocused]);

  // Load custom system font for Skia-based axis labels in Victory Native
  const chartFont = useMemo(() => {
    return matchFont({
      fontFamily: Platform.select({ ios: 'Helvetica', android: 'sans-serif' }),
      fontSize: 9,
      fontWeight: 'bold',
    });
  }, []);

  const axisOptions = useMemo(() => ({
    font: chartFont,
    lineColor: '#334155', // border color (slate-700)
    labelColor: '#64748b', // muted text color (slate-500)
    tickColor: '#334155',
    grid: {
      stroke: '#1e293b', // surface background line (slate-800)
      strokeWidth: 1,
    },
  }), [chartFont]);

  // Compute all metrics and chart datasets in memory for reactive format filtering
  const stats = useMemo(() => {
    const rows = filterFormat === 'All'
      ? inningsList
      : inningsList.filter((item) => item.format === filterFormat);

    if (rows.length === 0) return null;

    const totalInnings = rows.length;
    const totalRuns = rows.reduce((sum, r) => sum + r.runsScored, 0);

    // completed innings = total - Not Out - Retired
    const completedInnings = rows.filter(
      (r) => r.dismissal !== 'Not Out' && r.dismissal !== 'Retired'
    ).length;
    
    const average = completedInnings > 0 ? totalRuns / completedInnings : totalRuns;
    const highestScore = Math.max(...rows.map((r) => r.runsScored));
    const totalFours = rows.reduce((sum, r) => sum + r.fours, 0);
    const totalSixes = rows.reduce((sum, r) => sum + r.sixes, 0);

    // Recent 10 innings sorted chronologically (earliest -> latest) for left-to-right graphs
    const recent10 = rows.slice(0, 10).reverse();
    
    const formChartData = recent10.map((r, idx) => ({
      matchIndex: idx + 1,
      runs: r.runsScored,
      opponent: r.opponent,
    }));

    const strikeRateChartData = recent10.map((r, idx) => ({
      matchIndex: idx + 1,
      sr: r.strikeRate,
      opponent: r.opponent,
    }));

    // Dismissal breakdown counting
    const dismissalCounts: Record<string, number> = {};
    rows.forEach((r) => {
      dismissalCounts[r.dismissal] = (dismissalCounts[r.dismissal] || 0) + 1;
    });

    const dismissalColors: Record<string, string> = {
      'Bowled': '#f87171', // red-400
      'Caught': '#60a5fa', // blue-400
      'LBW': '#fbbf24', // amber-400
      'Run Out': '#c084fc', // purple-400
      'Stumped': '#f472b6', // pink-400
      'Hit Wicket': '#9ca3af', // gray-400
      'Not Out': '#34d399', // emerald-400
      'Retired': '#a7f3d0', // emerald-200
    };

    const dismissalChartData = Object.keys(dismissalCounts).map((key) => ({
      label: key,
      value: dismissalCounts[key],
      color: dismissalColors[key] || '#64748b',
    }));

    // Mindset averages
    const mindsetStats: Record<string, { totalRuns: number; count: number }> = {
      Confident: { totalRuns: 0, count: 0 },
      Neutral: { totalRuns: 0, count: 0 },
      Nervous: { totalRuns: 0, count: 0 },
    };

    rows.forEach((r) => {
      if (mindsetStats[r.mindset]) {
        mindsetStats[r.mindset].totalRuns += r.runsScored;
        mindsetStats[r.mindset].count += 1;
      }
    });

    const mindsetChartData = Object.keys(mindsetStats).map((key) => {
      const entry = mindsetStats[key];
      const avg = entry.count > 0 ? entry.totalRuns / entry.count : 0;
      return {
        mindset: key,
        avgRuns: parseFloat(avg.toFixed(1)),
        count: entry.count,
      };
    });

    // Scenario averages
    let chasingRuns = 0, chasingCount = 0;
    let settingRuns = 0, settingCount = 0;

    rows.forEach((r) => {
      if (r.scenario === 'Chasing') {
        chasingRuns += r.runsScored;
        chasingCount += 1;
      } else {
        settingRuns += r.runsScored;
        settingCount += 1;
      }
    });

    const chasingAvg = chasingCount > 0 ? chasingRuns / chasingCount : 0;
    const settingAvg = settingCount > 0 ? settingRuns / settingCount : 0;

    return {
      totalInnings,
      totalRuns,
      average,
      highestScore,
      totalFours,
      totalSixes,
      formChartData,
      strikeRateChartData,
      dismissalChartData,
      mindsetChartData,
      scenarioData: {
        chasingAvg,
        chasingCount,
        settingAvg,
        settingCount,
      },
    };
  }, [inningsList, filterFormat]);

  const maxMindsetAvg = useMemo(() => {
    if (!stats) return 1;
    const maxVal = Math.max(...stats.mindsetChartData.map(item => item.avgRuns), 1);
    return maxVal;
  }, [stats]);

  const maxScenarioAvg = useMemo(() => {
    if (!stats) return 1;
    const maxVal = Math.max(stats.scenarioData.chasingAvg, stats.scenarioData.settingAvg, 1);
    return maxVal;
  }, [stats]);

  return (
    <View className="flex-1 bg-background">
      {/* Dynamic Header */}
      <View className="flex-row items-center justify-between px-4 pt-6 pb-2">
        <Text className="text-white text-2xl font-black">My Performance</Text>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('InningsHistory')}
            className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-border"
          >
            <Ionicons name="time-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('LogInnings')}
            className="w-10 h-10 bg-primary rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Format Filter Bar */}
      <View className="py-3 border-b border-border">
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
                onPress={() => setFilterFormat(fmt)}
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

      {/* Main Content Area */}
      {stats === null ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 pt-6">
          <View className="bg-surface rounded-3xl p-8 items-center justify-center mt-8 border border-border">
            <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
              <Ionicons name="stats-chart-outline" size={32} color="#22c55e" />
            </View>
            <Text className="text-white text-lg font-black text-center">No Innings Logged</Text>
            <Text className="text-muted text-sm text-center mt-2 px-4 leading-relaxed">
              {filterFormat === 'All'
                ? 'You haven\'t logged any innings yet. Tap the "+" button above to log your first match and see statistics!'
                : `No innings logged for format: ${filterFormat}.`}
            </Text>
            {filterFormat === 'All' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('LogInnings')}
                className="mt-6 bg-primary px-6 py-3 rounded-2xl"
              >
                <Text className="text-white font-bold text-sm">Log First Innings</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          className="px-4 pt-6"
        >
          {/* Career Stats Grid */}
          <Text className="text-white text-sm font-black mb-3 uppercase tracking-wider">Career Stats</Text>
          <View className="flex-row flex-wrap mb-6" style={{ gap: 12 }}>
            <View className="flex-1 min-w-[45%] bg-surface border border-border rounded-2xl p-4">
              <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Innings</Text>
              <Text className="text-white text-2xl font-black mt-1">{stats.totalInnings}</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-surface border border-border rounded-2xl p-4">
              <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Total Runs</Text>
              <Text className="text-white text-2xl font-black mt-1">{stats.totalRuns}</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-surface border border-border rounded-2xl p-4">
              <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Batting Avg</Text>
              <Text className="text-white text-2xl font-black mt-1">
                {typeof stats.average === 'number' ? stats.average.toFixed(2) : '-'}
              </Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-surface border border-border rounded-2xl p-4">
              <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Highest Score</Text>
              <Text className="text-white text-2xl font-black mt-1">{stats.highestScore}</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-surface border border-border rounded-2xl p-4">
              <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Fours (4s)</Text>
              <Text className="text-white text-2xl font-black mt-1">{stats.totalFours}</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-surface border border-border rounded-2xl p-4">
              <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">Sixes (6s)</Text>
              <Text className="text-white text-2xl font-black mt-1">{stats.totalSixes}</Text>
            </View>
          </View>

          {/* Form Chart */}
          <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
            <Text className="text-white text-sm font-black mb-1 uppercase tracking-wider">Recent Form</Text>
            <Text className="text-muted text-xs mb-4">Runs scored in last 10 innings</Text>
            <View className="h-44 w-full">
              <CartesianChart
                data={stats.formChartData}
                xKey="matchIndex"
                yKeys={['runs']}
                axisOptions={axisOptions}
              >
                {({ points, chartBounds }) => (
                  <Bar
                    points={points.runs}
                    chartBounds={chartBounds}
                    color="#22c55e"
                    roundedCorners={{ topLeft: 4, topRight: 4 }}
                  />
                )}
              </CartesianChart>
            </View>
          </View>

          {/* Strike Rate Chart */}
          <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
            <Text className="text-white text-sm font-black mb-1 uppercase tracking-wider">Strike Rate Trend</Text>
            <Text className="text-muted text-xs mb-4">Strike rate across last 10 innings</Text>
            <View className="h-44 w-full">
              <CartesianChart
                data={stats.strikeRateChartData}
                xKey="matchIndex"
                yKeys={['sr']}
                axisOptions={axisOptions}
              >
                {({ points }) => (
                  <Line
                    points={points.sr}
                    color="#3b82f6"
                    strokeWidth={3}
                  />
                )}
              </CartesianChart>
            </View>
          </View>

          {/* Dismissal Breakdown Donut */}
          <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
            <Text className="text-white text-sm font-black mb-1 uppercase tracking-wider">Dismissal Breakdown</Text>
            <Text className="text-muted text-xs mb-4">Analysis of how you got out</Text>
            <View className="flex-row items-center justify-between">
              <View className="w-32 h-32">
                <PolarChart
                  data={stats.dismissalChartData}
                  labelKey="label"
                  valueKey="value"
                  colorKey="color"
                  containerStyle={{ height: 128, width: 128 }}
                >
                  <Pie.Chart innerRadius={36}>
                    {() => (
                      <Pie.Slice />
                    )}
                  </Pie.Chart>
                </PolarChart>
              </View>
              {/* Legend Grid */}
              <View className="flex-1 ml-6 gap-2">
                {stats.dismissalChartData.map((item, idx) => (
                  <View key={idx} className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <Text className="text-white text-xs font-semibold">{item.label}</Text>
                    </View>
                    <Text className="text-muted text-xs font-bold">{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Mindset vs Performance */}
          <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
            <Text className="text-white text-sm font-black mb-1 uppercase tracking-wider">Mindset vs Performance</Text>
            <Text className="text-muted text-xs mb-4">Average runs scored grouped by psychology</Text>
            <View className="gap-4">
              {stats.mindsetChartData.map((item, idx) => {
                const percentage = maxMindsetAvg > 0 ? (item.avgRuns / maxMindsetAvg) * 100 : 0;
                let colorClass = 'bg-amber-500';
                let textClass = 'text-amber-400';
                let emoji = '😐';
                if (item.mindset === 'Confident') {
                  colorClass = 'bg-green-500';
                  textClass = 'text-green-400';
                  emoji = '😊';
                } else if (item.mindset === 'Nervous') {
                  colorClass = 'bg-rose-500';
                  textClass = 'text-rose-400';
                  emoji = '😰';
                }

                return (
                  <View key={idx}>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-white text-xs font-bold">{emoji} {item.mindset} <Text className="text-muted font-medium">({item.count} matches)</Text></Text>
                      <Text className={`text-xs font-black ${textClass}`}>{item.avgRuns} runs avg</Text>
                    </View>
                    <View className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <View 
                        className={`h-full rounded-full ${colorClass}`}
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Match Situation Breakdown */}
          <View className="bg-surface border border-border rounded-2xl p-4">
            <Text className="text-white text-sm font-black mb-1 uppercase tracking-wider">Match Situation Comparison</Text>
            <Text className="text-muted text-xs mb-4">Chasing vs Setting batting average comparison</Text>
            <View className="gap-4">
              {/* Chasing */}
              <View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-white text-xs font-bold">Chasing <Text className="text-muted font-medium">({stats.scenarioData.chasingCount} matches)</Text></Text>
                  <Text className="text-primary text-xs font-black">{stats.scenarioData.chasingAvg.toFixed(1)} runs avg</Text>
                </View>
                <View className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${maxScenarioAvg > 0 ? (stats.scenarioData.chasingAvg / maxScenarioAvg) * 100 : 0}%` }}
                  />
                </View>
              </View>

              {/* Setting */}
              <View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-white text-xs font-bold">Setting Target <Text className="text-muted font-medium">({stats.scenarioData.settingCount} matches)</Text></Text>
                  <Text className="text-blue-400 text-xs font-black">{stats.scenarioData.settingAvg.toFixed(1)} runs avg</Text>
                </View>
                <View className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${maxScenarioAvg > 0 ? (stats.scenarioData.settingAvg / maxScenarioAvg) * 100 : 0}%` }}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
