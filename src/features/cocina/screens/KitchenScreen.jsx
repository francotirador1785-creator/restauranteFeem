// src/features/cocina/screens/KitchenScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Header from '../../../components/common/Header';
import { getActiveOrders, updateOrderStatus } from '../services/kitchenService';
import { supabase } from '../../../config/supabase';

export default function KitchenScreen({ activeTab, onSelectTab }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // Escuchar en TIEMPO REAL nuevos pedidos o actualizaciones
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getActiveOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Error al cargar comandas:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStatus = async (order) => {
    try {
      let nextStatus = 'in_preparation';
      if (order.status === 'in_preparation') {
        nextStatus = 'ready';
      }

      await updateOrderStatus(order.id, nextStatus);
      fetchOrders();
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const getTimeElapsed = (createdAt) => {
    const minutes = Math.floor((new Date() - new Date(createdAt)) / 60000);
    return `${minutes} min`;
  };

  // Paleta de colores según diseño acordado
  const getTicketTheme = (order) => {
    if (order.order_type === 'takeout') {
      return {
        cardBg: '#1B2E23', // Verde pastel oscuro
        headerBg: '#10B981', // Verde brillante
        border: '#059669',
        typeText: 'PARA LLEVAR',
      };
    }
    if (order.status === 'pending') {
      return {
        cardBg: '#3B1C22', // Rosa/Rojo oscuro pastel
        headerBg: '#EF4444', // Rojo vivo
        border: '#DC2626',
        typeText: `MESA ${order.table_number}`,
      };
    }
    return {
      cardBg: '#3D3117', // Amarillo/Crema oscuro
      headerBg: '#F59E0B', // Amarillo/Naranja
      border: '#D97706',
      typeText: `MESA ${order.table_number}`,
    };
  };

  const renderTicket = ({ item }) => {
    const theme = getTicketTheme(item);

    return (
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        {/* Header del Ticket */}
        <View style={[styles.cardHeader, { backgroundColor: theme.headerBg }]}>
          <Text style={styles.headerTitle}>#{item.id.toString().slice(0, 5)} - {theme.typeText}</Text>
          <Text style={styles.headerTime}>{getTimeElapsed(item.created_at)}</Text>
        </View>

        {/* Detalle de productos */}
        <View style={styles.cardBody}>
          {item.order_items?.map((prod) => (
            <View key={prod.id} style={styles.itemRow}>
              <Text style={styles.itemText}>
                <Text style={styles.qty}>{prod.quantity}x </Text>
                {prod.product_name}
              </Text>
              {prod.notes ? (
                <Text style={styles.notes}>↳ {prod.notes}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* Botón de cambio de estado */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: item.status === 'pending' ? '#F59E0B' : '#10B981' },
          ]}
          onPress={() => handleNextStatus(item)}
        >
          <Text style={styles.actionBtnText}>
            {item.status === 'pending' ? 'PREPARAR' : 'MARCAR LISTO'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header activeTab="Cocina" onSelectTab={onSelectTab} />

      <View style={styles.content}>
        <Text style={styles.title}>Comandas de Cocina</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 20 }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🍳 No hay pedidos pendientes por preparar</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTicket}
            numColumns={3}
            contentContainerStyle={styles.grid}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { flex: 1, padding: 16 },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  grid: { paddingBottom: 20 },
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 260,
    maxWidth: '32%',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  headerTime: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  cardBody: { padding: 12, flex: 1 },
  itemRow: { marginBottom: 10 },
  itemText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  qty: { color: '#F59E0B', fontSize: 16 },
  notes: { color: '#F87171', fontSize: 13, fontStyle: 'italic', marginTop: 2, marginLeft: 8 },
  actionBtn: { padding: 12, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 18 },
});