// src/components/common/Header.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        <Text style={styles.logo}>🍔 Feem</Text>
        <Text style={styles.navItem}>Mesa</Text>
        <Text style={styles.navItem}>Menú</Text>
        <Text style={styles.navItem}>Pedidos</Text>
        <Text style={styles.navItem}>Restaurante</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Salir ({user?.email?.split('@')[0]})</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: { fontSize: 20, fontWeight: 'bold' },
  navItem: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#3B1F1B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  logoutText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
});