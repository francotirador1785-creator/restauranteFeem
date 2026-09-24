// src/navigation/AppNavigator.js
import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../features/auth/screens/LoginScreen';
import TablesManagerScreen from '../features/admin/screens/TablesManagerScreen';
import MenuManagerScreen from '../features/admin/screens/MenuManagerScreen';
import OrderScreen from '../features/mozo/screens/OrderScreen';
import KitchenScreen from '../features/cocina/screens/KitchenScreen';

export default function AppNavigator() {
  const { user, userRole, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('Mesa');

  // 1. Cargando sesión
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  // 2. Si no hay usuario -> Pantalla de Login
  if (!user) {
    return <LoginScreen />;
  }

  // Normalizar el rol (quitar espacios, pasar a minúsculas)
  const role = userRole ? userRole.toString().trim().toLowerCase() : '';

  // 3. Ruteo por rol
  if (role === 'cocina' || role === 'cocinero' || role === 'chef') {
    return <KitchenScreen />;
  }

  if (role === 'mozo' || role === 'waiter') {
    return <OrderScreen activeTab={activeTab} onSelectTab={setActiveTab} />;
  }

  if (role === 'admin' || role === 'administrador') {
    if (activeTab === 'Menu') {
      return <MenuManagerScreen activeTab={activeTab} onSelectTab={setActiveTab} />;
    }
    return <TablesManagerScreen activeTab={activeTab} onSelectTab={setActiveTab} />;
  }

  // 4. Fallback si el rol no coincide con ninguna pantalla esperada
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Sin vista asignada</Text>
      <Text style={styles.errorSub}>
        Email: {user.email}{'\n'}
        Rol leído desde BD: "{userRole}"
      </Text>
      <TouchableOpacity style={styles.btn} onPress={signOut}>
        <Text style={styles.btnText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1210',
    padding: 20,
  },
  errorTitle: { color: '#EF4444', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  errorSub: { color: '#AAA', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  btn: { backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
});