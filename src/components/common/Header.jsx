// src/components/common/Header.jsx
import React from 'react';
// 1. Asegúrate de importar Image desde 'react-native'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'; 
import logoFem from '../../../assets/LogoFinalFinal.png'; 
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
        {/* Renderizado de la imagen del logo */}
        <Image source={logoFem} style={styles.logoImagen} />
        
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
    gap: 12,
  },
  logoImagen: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'contain',
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  navItem: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  activeTab: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  logoutButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
});