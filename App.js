import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import TablesManagerScreen from './src/features/admin/screens/TablesManagerScreen.jsx';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <TablesManagerScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B1F1B',
  },
});