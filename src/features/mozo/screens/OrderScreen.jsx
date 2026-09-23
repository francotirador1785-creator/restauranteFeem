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
} from 'react-native';
import Header from '../../../components/common/Header';
import { getTables, updateTableStatus } from '../../admin/services/tableService';
import { getCategories, getProducts } from '../../admin/services/menuService';
import { useAuth } from '../../../context/AuthContext';

export default function OrderScreen({ activeTab, onSelectTab }) {
  const { signOut } = useAuth();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Datos del Menú
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Carrito / Comanda
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

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
      console.error('Error cargando datos del mozo:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setCart([]); // Limpiamos la comanda para la nueva mesa
  };

  const handleAddToCart = (product) => {
    if (!selectedTable) {
      alert('Por favor, selecciona primero una mesa.');
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

  // Enviar Pedido y cambiar estado de la Mesa a "Ocupada"
  const handleSendOrder = async () => {
    if (!selectedTable || cart.length === 0) return;

    try {
      setSending(true);
      // 1. Cambiamos el estado de la mesa a 'occupied' (rojo)
      await updateTableStatus(selectedTable.id, 'occupied', 'mozo');
      
      alert(`¡Pedido de la Mesa Nº ${selectedTable.table_number} enviado a Cocina!`);
      setSelectedTable(null);
      setCart([]);
      await loadInitialData(); // Recargar el plano de mesas
    } catch (err) {
      alert('Error al enviar el pedido: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <View style={styles.container}>
      <Header activeTab="Mesa" onSelectTab={onSelectTab} />

      <View style={styles.layout}>
        {/* COLUMNA 1: Selección de Mesas (Circulares) */}
        <View style={styles.tablesPanel}>
          <Text style={styles.sectionTitle}>1. Seleccionar Mesa</Text>
          {loading ? (
            <ActivityIndicator color="#F59E0B" />
          ) : (
            <FlatList
              data={tables}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
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

        {/* COLUMNA 2: Menú con Buscador */}
        <View style={styles.menuPanel}>
          <Text style={styles.sectionTitle}>
            2. Tomar Pedido {selectedTable ? `(Mesa ${selectedTable.table_number})` : ''}
          </Text>

          <TextInput
            style={styles.searchBar}
            placeholder="🔍 Buscar plato..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView horizontal style={styles.catScroll} showsHorizontalScrollIndicator={false}>
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
                <Text style={styles.prodPrice}>${item.price}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* COLUMNA 3: Comanda Actual */}
        <View style={styles.cartPanel}>
          <Text style={styles.sectionTitle}>3. Comanda</Text>
          <ScrollView style={{ flex: 1 }}>
            {cart.map((item) => (
              <View key={item.id} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFF' }}>{item.name}</Text>
                  <Text style={{ color: '#F59E0B' }}>${item.price * item.quantity}</Text>
                </View>
                <View style={styles.qtyBox}>
                  <TouchableOpacity onPress={() => handleRemoveFromCart(item.id)}>
                    <Text style={styles.qtyBtn}>-</Text>
                  </TouchableOpacity>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => handleAddToCart(item)}>
                    <Text style={styles.qtyBtn}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.cartFooter}>
            <Text style={{ color: '#AAA' }}>Total:</Text>
            <Text style={styles.totalText}>${cartTotal}</Text>
            <TouchableOpacity
              style={[styles.sendBtn, (!selectedTable || cart.length === 0) && { backgroundColor: '#555' }]}
              disabled={!selectedTable || cart.length === 0 || sending}
              onPress={handleSendOrder}
            >
              <Text style={styles.sendBtnText}>{sending ? 'Enviando...' : 'ENVIAR A COCINA'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1210' },
  layout: { flex: 1, flexDirection: 'row' },
  tablesPanel: { width: 220, backgroundColor: '#2D1815', padding: 10, borderRightWidth: 1, borderColor: '#3D201C' },
  menuPanel: { flex: 1, padding: 10 },
  cartPanel: { width: 280, backgroundColor: '#2D1815', padding: 10, borderLeftWidth: 1, borderColor: '#3D201C' },
  sectionTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  circleTable: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    backgroundColor: '#1E1210',
  },
  tableNum: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  badge: { paddingHorizontal: 4, borderRadius: 4, marginTop: 2 },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  searchBar: { backgroundColor: '#2D1815', color: '#FFF', padding: 8, borderRadius: 6, marginBottom: 8 },
  catScroll: { maxHeight: 35, marginBottom: 8 },
  chip: { backgroundColor: '#2D1815', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 6 },
  activeChip: { backgroundColor: '#F59E0B' },
  chipText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  productCard: { flex: 1, backgroundColor: '#2D1815', padding: 10, margin: 4, borderRadius: 6 },
  prodName: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  prodPrice: { color: '#F59E0B', fontSize: 12, marginTop: 4 },
  cartRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#3D201C' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { color: '#F59E0B', fontSize: 16, fontWeight: 'bold', paddingHorizontal: 6 },
  cartFooter: { borderTopWidth: 1, borderColor: '#3D201C', paddingTop: 10, marginTop: 10 },
  totalText: { color: '#10B981', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  sendBtn: { backgroundColor: '#F59E0B', padding: 10, borderRadius: 6, alignItems: 'center' },
  sendBtnText: { color: '#FFF', fontWeight: 'bold' },
});