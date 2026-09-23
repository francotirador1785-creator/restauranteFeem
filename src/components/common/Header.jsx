// src/components/common/Header.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function Header({ activeTab, onSelectTab }) {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        <Text style={styles.logo}>🍔 Feem</Text>
        
        <TouchableOpacity onPress={() => onSelectTab && onSelectTab('Mesa')}>
          <Text style={[styles.navItem, activeTab === 'Mesa' && styles.activeTab]}>
            Mesa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onSelectTab && onSelectTab('Menu')}>
          <Text style={[styles.navItem, activeTab === 'Menu' && styles.activeTab]}>
            Menú
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>
          Salir ({user?.email ? user.email.split('@')[0] : 'Usuario'})
        </Text>
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
    gap: 20,
  },
  logo: { fontSize: 22, fontWeight: 'bold' },
  navItem: { color: '#FFF', fontSize: 16, fontWeight: '600', cursor: 'pointer' },
  activeTab: { textDecorationLine: 'underline', fontWeight: 'bold' },
  logoutButton: {
    backgroundColor: '#3B1F1B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    cursor: 'pointer',
  },
  logoutText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
});