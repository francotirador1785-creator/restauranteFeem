// src/features/auth/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../../../config/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Atención', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        showAlert('Error de inicio de sesión', error.message);
      }
    } catch (err) {
      showAlert('Error inesperado', err.message || 'Ocurrió un problema al intentar ingresar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>🍔 Feem</Text>
        <Text style={styles.subtitle}>Iniciar Sesión</Text>

        <Text style={styles.label}>Correo Electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="admin@feem.com"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>INGRESAR</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D1815',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#3B1F1B',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A2823',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    color: '#DDD',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#2D1815',
    borderWidth: 1,
    borderColor: '#552822',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    cursor: 'pointer',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});