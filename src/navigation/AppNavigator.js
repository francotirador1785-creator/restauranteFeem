// src/navigation/AppNavigator.js
import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../features/auth/screens/LoginScreen';
import TablesManagerScreen from '../features/admin/screens/TablesManagerScreen';
import MenuManagerScreen from '../features/admin/screens/MenuManagerScreen';
import OrderScreen from '../features/mozo/screens/OrderScreen';

export default function AppNavigator() {
  const { user, userRole, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('Mesa');

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1210' }}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  // 1. Si no hay sesión iniciada -> Pantalla de Login
  if (!user) {
    return <LoginScreen />;
  }

  // 2. Si el usuario es MOZO -> Pantalla de Toma de Pedidos
  if (userRole === 'mozo') {
    return <OrderScreen activeTab={activeTab} onSelectTab={setActiveTab} />;
  }

  // 3. Si es ADMINISTRADOR -> Acceso a Gestión de Mesas y Menú
  if (activeTab === 'Menu') {
    return <MenuManagerScreen activeTab={activeTab} onSelectTab={setActiveTab} />;
  }

  return <TablesManagerScreen activeTab={activeTab} onSelectTab={setActiveTab} />;
}