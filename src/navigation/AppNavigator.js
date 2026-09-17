// src/navigation/AppNavigator.js
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Importación de pantallas (Ajustar según tus rutas creadas)
import LoginScreen from '../features/auth/screens/LoginScreen';
import TablesManagerScreen from '../features/admin/screens/TablesManagerScreen';
// Placeholders para roles en desarrollo
const MozoScreen = () => <View style={styles.center}><Text style={styles.text}>Vista Mozo</Text></View>;
const CocinaScreen = () => <View style={styles.center}><Text style={styles.text}>Vista Cocina</Text></View>;
const CajaScreen = () => <View style={styles.center}><Text style={styles.text}>Vista Caja</Text></View>;

export default function AppNavigator() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Ruteo condicional según el rol en BDD
  switch (userRole) {
    case 'admin':
      return <TablesManagerScreen />;
    case 'mozo':
      return <MozoScreen />;
    case 'cocina':
      return <CocinaScreen />;
    case 'caja':
      return <CajaScreen />;
    default:
      return (
        <View style={styles.center}>
          <Text style={styles.text}>Rol no reconocido o sin perfil asignado.</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B1F1B',
  },
  text: {
    color: '#FFF',
    fontSize: 18,
  },
});