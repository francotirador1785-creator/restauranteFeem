// src/features/admin/screens/TablesManagerScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Header from '../../../components/common/Header'; // Tu componente Header
import { getTables, createTable, deleteTable } from '../services/tableService';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../context/AuthContext';

export default function TablesManagerScreen({ navigation }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [customNumber, setCustomNumber] = useState('');
  
  // Obtenemos el rol actual del usuario autenticado
  const { role } = useAuth();

  useEffect(() => {
    fetchTables();

    // Sincronización Realtime (Escucha cambios instantáneos en la BDD)
    const channel = supabase
      .channel('tables_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        () => fetchTables()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTables = async () => {
    try {
      const data = await getTables();
      setTables(data || []);
    } catch (err) {
      console.error('Error al obtener mesas:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    try {
      const num = customNumber.trim() ? parseInt(customNumber, 10) : null;
      await createTable(num, role);
      setCustomNumber('');
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Restricción', err.message || 'Error al crear la mesa');
    }
  };

  const handleDeleteTable = (table) => {
    // Si no es admin, ni siquiera mostrar la alerta
    if (role !== 'admin') return;

    Alert.alert(
      'Eliminar Mesa',
      `¿Deseas eliminar la Mesa Nº ${table.table_number}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTable(table.id, role);
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleSelectTable = (table) => {
    // Si la navega el mozo o admin para tomar pedido
    if (navigation) {
      navigation.navigate('MenuScreen', { table });
    }
  };

  const renderTableItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tableShape}
      onPress={() => handleSelectTable(item)}
      onLongPress={() => handleDeleteTable(item)}
    >
      <Text style={styles.tableNumber}>{item.table_number}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 1. Header con Botón de Salir */}
      <Header />

      {/* 2. Lista de Mesas */}
      {loading ? (
        <ActivityIndicator size="large" color="#F59E0B" style={{ flex: 1 }} />
      ) : tables.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {role === 'admin'
              ? 'No hay mesas creadas. Usa "+ Agregar" para empezar.'
              : 'No hay mesas disponibles en el restaurante.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTableItem}
          numColumns={4}
          contentContainerStyle={styles.gridContainer}
        />
      )}

      {/* 3. Botón flotante para agregar (RESTRICCIÓN: Solo visible para 'admin') */}
      {role === 'admin' && (
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabText}>+ Agregar</Text>
        </TouchableOpacity>
      )}

      {/* 4. Modal para Número Personalizado u Opcional */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Crear Nueva Mesa</Text>
            <Text style={styles.modalSubtitle}>
              Deja el campo vacío para asignar automáticamente el siguiente número consecutivo.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 5 (Opcional)"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={customNumber}
              onChangeText={setCustomNumber}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setCustomNumber('');
                  setModalVisible(false);
                }}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddTable}>
                <Text style={styles.btnText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2D1815' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#FFF', fontSize: 16, textAlign: 'center' },
  gridContainer: { padding: 20 },
  tableShape: {
    width: 100,
    height: 65,
    backgroundColor: '#C87D46',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#9E5B29',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
    elevation: 4,
  },
  tableNumber: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    elevation: 5,
  },
  fabText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    maxWidth: 360,
    backgroundColor: '#3B1F1B',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: { color: '#F59E0B', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  modalSubtitle: { color: '#D1D5DB', fontSize: 12, marginBottom: 14 },
  input: {
    backgroundColor: '#2D1815',
    color: '#FFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#522A24',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { backgroundColor: '#6B7280', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  confirmBtn: { backgroundColor: '#F59E0B', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
});