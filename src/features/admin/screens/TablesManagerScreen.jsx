import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { getTables, createTable } from '../services/tableService';

export default function TablesManagerScreen() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await getTables();
      setTables(data || []);
    } catch (err) {
      Alert.alert('Error al cargar mesas', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!tableNumber.trim()) {
      Alert.alert('Atención', 'Ingresa el número de mesa');
      return;
    }

    try {
      setSubmitting(true);
      await createTable(tableNumber, capacity);
      Alert.alert('¡Éxito!', `Mesa ${tableNumber} creada correctamente`);
      setIsModalOpen(false);
      setTableNumber('');
      setCapacity('4');
      loadTables(); // Recargar la lista
    } catch (err) {
      Alert.alert('Error al crear mesa', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra de Navegación Superior (Navbar) */}
      <View style={styles.navbar}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>🍔</Text>
        </View>
        <View style={styles.navLinks}>
          <TouchableOpacity style={styles.navItemActive}>
            <Text style={styles.navTextActive}>Mesa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navText}>Menú</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navText}>Pedidos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navText}>Restaurante</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido Principal / Grilla de Mesas */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(item) => item.id.toString()}
          numColumns={4}
          contentContainerStyle={styles.gridContainer}
          renderItem={({ item }) => (
            <View style={styles.tableCard}>
              <Text style={styles.tableNumber}>{item.table_number}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No hay mesas registradas. ¡Presiona "+ Agregar" para crear la primera!
            </Text>
          }
        />
      )}

      {/* Botón Flotante "+ Agregar" */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setIsModalOpen(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Agregar</Text>
      </TouchableOpacity>

      {/* Modal para Crear Mesa */}
      <Modal visible={isModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Mesa</Text>

            <TextInput
              placeholder="Número de mesa (Ej: 1, 2, 3)"
              placeholderTextColor="#9CA3AF"
              value={tableNumber}
              onChangeText={setTableNumber}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              placeholder="Capacidad de personas (Default: 4)"
              placeholderTextColor="#9CA3AF"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleCreateTable}
                disabled={submitting}
              >
                <Text style={styles.btnText}>
                  {submitting ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B1F1B', // Fondo café / marrón oscuro de tu diseño
  },
  centered: {
    flex: 1,
    justify: 'center',
    alignItems: 'center',
  },
  /* Navbar */
  navbar: {
    backgroundColor: '#F59E0B', // Color mostaza / naranja superior
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  logoText: {
    fontSize: 20,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 30,
  },
  navItem: {
    paddingVertical: 4,
  },
  navItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#FFF',
    paddingVertical: 4,
  },
  navText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navTextActive: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  /* Grilla de Mesas */
  gridContainer: {
    padding: 20,
  },
  tableCard: {
    width: 110,
    height: 70,
    backgroundColor: '#C88346', // Tono madera
    borderRadius: 35, // Forma ovalada
    justifyContent: 'center',
    alignItems: 'center',
    margin: 15,
    borderWidth: 3,
    borderColor: '#9A5B27',
  },
  tableNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
  },
  emptyText: {
    color: '#E5E7EB',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  /* Botón Flotante */
  fabButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 8,
  },
  fabText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#2D1815',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#3B1F1B',
    color: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#522A24',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelBtn: {
    backgroundColor: '#6B7280',
  },
  saveBtn: {
    backgroundColor: '#F59E0B',
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});