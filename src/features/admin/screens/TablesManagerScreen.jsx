// src/features/admin/screens/TablesManagerScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Header from '../../../components/common/Header';
import { getTables, createTable, deleteTable } from '../services/tableService';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../context/AuthContext';

export default function TablesManagerScreen({ activeTab, onSelectTab }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchTables();

    const channel = supabase
      .channel('tables_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchTables())
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
    if (!isAdmin) return;
    try {
      let customNum = null;
      if (Platform.OS === 'web') {
        const input = window.prompt('Número de mesa (deja vacío para automático):');
        if (input === null) return;
        if (input.trim() !== '') customNum = parseInt(input, 10);
      }
      await createTable(customNum, userRole);
      await fetchTables();
    } catch (err) {
      alert(err.message || 'Error al crear la mesa');
    }
  };

  const handleDeleteTable = async (table) => {
    if (!isAdmin) return;
    const confirmDelete = Platform.OS === 'web'
      ? window.confirm(`¿Eliminar la Mesa Nº ${table.table_number}?`)
      : true;

    if (confirmDelete) {
      try {
        await deleteTable(table.id, userRole);
        await fetchTables();
      } catch (err) {
        alert(err.message || 'Error al eliminar la mesa');
      }
    }
  };

  const handleTableClick = (table) => {
    // Tanto Admin como Mozo al seleccionar la mesa van a la Toma de Pedido / Carta
    if (onSelectTab) {
      onSelectTab('Menu', table);
    }
  };

  return (
    <View style={styles.container}>
      <Header activeTab={activeTab || 'Mesa'} onSelectTab={onSelectTab} />

      <View style={styles.statusBar}>
        <Text style={styles.title}>Plano de Mesas</Text>
        <View style={styles.legendGroup}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Libre</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Ocupada</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F59E0B" style={{ flex: 1 }} />
      ) : tables.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {isAdmin ? 'No hay mesas. Presiona "+ Agregar Mesa" para empezar.' : 'No hay mesas habilitadas.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(item) => item.id.toString()}
          numColumns={Platform.OS === 'web' ? 4 : 2}
          contentContainerStyle={styles.gridContainer}
          renderItem={({ item }) => {
            const isOccupied = item.status === 'occupied';
            const statusColor = isOccupied ? '#EF4444' : '#10B981';

            return (
              <TouchableOpacity
                style={[styles.circularTable, { borderColor: statusColor }]}
                onPress={() => handleTableClick(item)}
                onLongPress={() => handleDeleteTable(item)}
              >
                <Text style={styles.tableLabel}>MESA</Text>
                <Text style={styles.tableNumber}>{item.table_number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.badgeText}>{isOccupied ? 'Ocupada' : 'Libre'}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {isAdmin && (
        <TouchableOpacity style={styles.fabButton} onPress={handleAddTable}>
          <Text style={styles.fabText}>+ Agregar Mesa</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1210' },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#2D1815',
    borderBottomWidth: 1,
    borderColor: '#3D201C',
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  legendGroup: { flexDirection: 'row', gap: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#CCC', fontSize: 12 },
  gridContainer: { padding: 15, alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#AAA', fontSize: 15 },

  /* Diseño de Mesa Circular Estilo Restaurante */
  circularTable: {
    width: 110,
    height: 110,
    borderRadius: 55, // Hace que la mesa sea perfectamente circular
    backgroundColor: '#2D1815',
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
    cursor: 'pointer',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tableLabel: { color: '#888', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  tableNumber: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  statusBadge: {
    marginTop: 2,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },

  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    elevation: 5,
    cursor: 'pointer',
  },
  fabText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});