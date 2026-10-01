// src/features/mozo/screens/OrderScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import Header from '../../../components/common/Header';
import { getTables, updateTableStatus } from '../../admin/services/tableService';
import { getCategories, getProducts } from '../../admin/services/menuService';
import { createOrder, getTableTotal, closeTableOrders } from '../../cocina/services/kitchenService';
import { supabase } from '../../../config/supabase';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function OrderScreen({ onSelectTab }) {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [occupiedTotal, setOccupiedTotal] = useState(0);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [step, setStep] = useState('mesas');

  const MP_ALIAS = 'RESTAURANTE.FEEM.MP';

  useEffect(() => {
    loadInitialData();

    // Suscripción Realtime para actualizar estado de mesas inmediatamente
    const channel = supabase
      .channel('tables-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
        loadTablesOnly();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTablesOnly = async () => {
    try {
      const tablesData = await getTables();
      setTables(tablesData || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [tablesData, catData, prodData] = await Promise.all([
        getTables(),
        getCategories(),
        getProducts(),
      ]);
      setTables(tablesData || []);
      setCategories(catData || []);
      setProducts(prodData || []);
    } catch (err) {
      console.error('Error inicial:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = async (table) => {
    setSelectedTable(table);
    setCart([]);
    setOccupiedTotal(0);

    if (table.status === 'occupied') {
      try {
        setLoadingCheckout(true);
        const { total } = await getTableTotal(table.id);
        setOccupiedTotal(total);
      } catch (err) {
        console.error('Error cobro:', err.message);
      } finally {
        setLoadingCheckout(false);
      }
    }

    if (isMobile) {
      setStep(table.status === 'occupied' ? 'comanda' : 'menu');
    }
  };

  const handleAddToCart = (product) => {
    if (!selectedTable) {
      Alert.alert('Atención', 'Selecciona primero una mesa.');
      if (isMobile) setStep('mesas');
      return;
    }
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleSendOrder = async () => {
    if (!selectedTable || cart.length === 0) return;

    try {
      setSending(true);
      await createOrder(selectedTable.id, selectedTable.table_number, cart, 'dine_in');
      await updateTableStatus(selectedTable.id, 'occupied');

      Alert.alert('Éxito', `Mesa ${selectedTable.table_number} marcada como OCUPADA.`);
      setSelectedTable(null);
      setCart([]);
      if (isMobile) setStep('mesas');
      await loadTablesOnly();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSending(false);
    }
  };

// Finalizar Pago y liberar mesa
  const handleFinalizePayment = async () => {
    if (!selectedTable) return;

    const targetTable = selectedTable;
    setSending(true);

    try {
      // 1. Cierra pedidos en segundo plano
      await closeTableOrders(targetTable.id);

      // 2. Cambia estado en Supabase
      await updateTableStatus(targetTable.id, 'available');

      // 3. Actualización de estado local inmediata
      setTables((prevTables) =>
        prevTables.map((t) =>
          t.id === targetTable.id ? { ...t, status: 'available' } : t
        )
      );

      // 4. Limpia la selección de la mesa actual
      setSelectedTable(null);
      setOccupiedTotal(0);
      setCart([]);
      if (isMobile) setStep('mesas');

    } catch (err) {
      console.error('Error al liberar mesa:', err);
      // Forzar liberación local en caso de error de red
      setTables((prevTables) =>
        prevTables.map((t) =>
          t.id === targetTable.id ? { ...t, status: 'available' } : t
        )
      );
      setSelectedTable(null);
    } finally {
      setSending(false);
      // Recargar datos desde Supabase
      loadTablesOnly();
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch = p.name ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchesCat && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  

  return (
    <View style={styles.container}>
      <Header activeTab="Mesa" onSelectTab={onSelectTab} />

      <View style={[styles.layout, isMobile && { flexDirection: 'column' }]}>
        {/* MESAS */}
        {(!isMobile || step === 'mesas') && (
          <View style={[styles.panel, isMobile ? { flex: 1 } : styles.tablesPanel]}>
            <Text style={styles.sectionTitle}>Mesas</Text>
            {loading ? (
              <ActivityIndicator color="#F59E0B" />
            ) : (
              <FlatList
                data={tables}
                keyExtractor={(item) => item.id.toString()}
                numColumns={isMobile ? 3 : 2}
                renderItem={({ item }) => {
                  const isSelected = selectedTable?.id === item.id;
                  const isOccupied = item.status === 'occupied';
                  const statusColor = isOccupied ? '#EF4444' : '#10B981';

                  return (
                    <TouchableOpacity
                      style={[
                        styles.circleTable,
                        { borderColor: isSelected ? '#F59E0B' : statusColor },
                        isSelected && { backgroundColor: '#3B1F1B' },
                      ]}
                      onPress={() => handleSelectTable(item)}
                    >
                      <Text style={styles.tableNum}>{item.table_number}</Text>
                      <View style={[styles.badge, { backgroundColor: statusColor }]}>
                        <Text style={styles.badgeText}>{isOccupied ? 'Ocupada' : 'Libre'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        )}

        {/* MENÚ */}
        {(!isMobile || step === 'menu') && (
          <View style={[styles.panel, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Menú</Text>
            <TextInput
              style={styles.searchBar}
              placeholder="🔍 Buscar..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <ScrollView horizontal style={styles.catScroll}>
              <TouchableOpacity
                style={[styles.chip, selectedCategory === null && styles.activeChip]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.chipText}>Todos</Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, selectedCategory === c.id && styles.activeChip]}
                  onPress={() => setSelectedCategory(c.id)}
                >
                  <Text style={styles.chipText}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.productCard} onPress={() => handleAddToCart(item)}>
                  <Text style={styles.prodName}>{item.name}</Text>
                  <Text style={styles.prodPrice}>${item.price || 0}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* DETALLE Y COBRO */}
        {(!isMobile || step === 'comanda') && (
          <View style={[styles.panel, isMobile ? { flex: 1 } : styles.cartPanel]}>
            <Text style={styles.sectionTitle}>
              {selectedTable?.status === 'occupied'
                ? `Cobro Mesa #${selectedTable.table_number}`
                : `Comanda Mesa #${selectedTable?.table_number || ''}`}
            </Text>

            {selectedTable?.status === 'occupied' ? (
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <ScrollView>
                  <View style={styles.payBox}>
                    <Text style={{ color: '#AAA' }}>Total Consumido:</Text>
                    <Text style={styles.occupiedTotalText}>${occupiedTotal}</Text>
                  </View>
                  <View style={styles.aliasContainer}>
                    <Text style={styles.aliasLabel}>Alias MP / Transferencia:</Text>
                    <Text style={styles.aliasValue}>{MP_ALIAS}</Text>
                  </View>
                </ScrollView>
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: '#10B981' }]}
                  disabled={sending}
                  onPress={handleFinalizePayment}
                >
                  <Text style={styles.sendBtnText}>
                    {sending ? 'Procesando...' : 'FINALIZAR PAGO / LIBERAR'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <ScrollView>
                  {cart.map((item) => (
                    <View key={item.id} style={styles.cartRow}>
                      <Text style={{ color: '#FFF' }}>{item.name} x{item.quantity}</Text>
                      <Text style={{ color: '#F59E0B' }}>
                        ${(item.price || 0) * item.quantity}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.cartFooter}>
                  <Text style={styles.totalText}>Total: ${cartTotal}</Text>
                  <TouchableOpacity
                    style={[styles.sendBtn, (!selectedTable || cart.length === 0) && { backgroundColor: '#555' }]}
                    disabled={!selectedTable || cart.length === 0 || sending}
                    onPress={handleSendOrder}
                  >
                    <Text style={styles.sendBtnText}>
                      {sending ? 'Enviando...' : 'ENVIAR A COCINA'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1210' },
  layout: { flex: 1, flexDirection: 'row' },
  panel: { padding: 10 },
  tablesPanel: { width: 200, backgroundColor: '#2D1815', borderRightWidth: 1, borderColor: '#3D201C' },
  cartPanel: { width: 260, backgroundColor: '#2D1815', borderLeftWidth: 1, borderColor: '#3D201C' },
  sectionTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  circleTable: { width: 65, height: 65, borderRadius: 33, borderWidth: 2, justifyContent: 'center', alignItems: 'center', margin: 5, backgroundColor: '#1E1210' },
  tableNum: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  badge: { paddingHorizontal: 4, borderRadius: 3, marginTop: 2 },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  searchBar: { backgroundColor: '#2D1815', color: '#FFF', padding: 8, borderRadius: 6, marginBottom: 8 },
  catScroll: { maxHeight: 38, marginBottom: 8 },
  chip: { backgroundColor: '#2D1815', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginRight: 6 },
  activeChip: { backgroundColor: '#F59E0B' },
  chipText: { color: '#FFF', fontSize: 11 },
  productCard: { flex: 1, backgroundColor: '#2D1815', padding: 10, margin: 4, borderRadius: 6 },
  prodName: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  prodPrice: { color: '#F59E0B', fontSize: 12, marginTop: 4 },
  cartRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#3D201C' },
  cartFooter: { borderTopWidth: 1, borderColor: '#3D201C', paddingTop: 10 },
  totalText: { color: '#10B981', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  sendBtn: { backgroundColor: '#F59E0B', padding: 12, borderRadius: 6, alignItems: 'center' },
  sendBtnText: { color: '#FFF', fontWeight: 'bold' },
  payBox: { backgroundColor: '#1E1210', padding: 12, borderRadius: 6, alignItems: 'center', marginBottom: 10 },
  occupiedTotalText: { color: '#10B981', fontSize: 22, fontWeight: 'bold' },
  aliasContainer: { backgroundColor: '#3D201C', padding: 10, borderRadius: 6 },
  aliasLabel: { color: '#AAA', fontSize: 11 },
  aliasValue: { color: '#F59E0B', fontSize: 13, fontWeight: 'bold' },
});