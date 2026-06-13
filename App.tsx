import './global.css';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from './src/db/client';

import HomeScreen from './app/index';
import DashboardScreen from './app/tracker/dashboard';
import LogInningsScreen from './app/tracker/log-innings';
import HistoryScreen from './app/tracker/history';
import UploadScreen from './app/analyzer/upload';
import ProcessingScreen from './app/analyzer/processing';
import ResultScreen from './app/analyzer/result';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#0f172a' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TrackerDashboard" component={DashboardScreen} options={{ title: 'Performance' }} />
        <Stack.Screen name="LogInnings" component={LogInningsScreen} options={{ title: 'Log Innings' }} />
        <Stack.Screen name="InningsHistory" component={HistoryScreen} options={{ title: 'History' }} />
        <Stack.Screen name="AnalyzerUpload" component={UploadScreen} options={{ title: 'Shot Analyzer' }} />
        <Stack.Screen name="AnalyzerProcessing" component={ProcessingScreen} options={{ title: 'Analyzing' }} />
        <Stack.Screen name="AnalyzerResult" component={ResultScreen} options={{ title: 'Result' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
