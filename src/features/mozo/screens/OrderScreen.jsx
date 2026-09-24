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
} from 'react-native';
import Header from '../../../components/common/Header';
import { getTables, updateTableStatus } from '../../admin/services/tableService';
import { getCategories, getProducts } from '../../admin/services/menuService';
import { createOrder } from '../../cocina/services/kitchenService';
import { useAuth } from '../../../context/AuthContext';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function OrderScreen({ activeTab, onSelectTab }) {
  const { signOut } = useAuth();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);

  // Menú
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Comanda
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Pestaña activa dentro de la vista móvil: 'mesas' | 'menu' | 'comanda'
  const [step, setStep] = useState('mesas');

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
      console.error('Error cargando datos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setCart([]);
    if (isMobile) setStep('menu'); // En celular pasa automáticamente al menú
  };

  const handleAddToCart = (product) => {
    if (!selectedTable) {
      alert('Por favor, selecciona primero una mesa.');
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

      alert(`¡Pedido de Mesa Nº ${selectedTable.table_number} enviado a Cocina!`);
      setSelectedTable(null);
      setCart([]);
      if (isMobile) setStep('mesas');
      await loadInitialData();
    } catch (err) {
      alert('Error al enviar el pedido: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch = p.name ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchesCat && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={styles.container}>
      <Header activeTab="Mesa" onSelectTab={onSelectTab} />

      {/* Barra de navegación de pasos exclusiva para celulares */}
      {isMobile && (
        <View style={styles.mobileNav}>
          <TouchableOpacity
            style={[styles.navBtn, step === 'mesas' && styles.navBtnActive]}
            onPress={() => setStep('mesas')}
          >
            <Text style={[styles.navBtnText, step === 'mesas' && styles.navBtnTextActive]}>
              1. Mesas {selectedTable ? `(#${selectedTable.table_number})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, step === 'menu' && styles.navBtnActive]}
            onPress={() => setStep('menu')}
          >
            <Text style={[styles.navBtnText, step === 'menu' && styles.navBtnTextActive]}>
              2. Menú
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, step === 'comanda' && styles.navBtnActive]}
            onPress={() => setStep('comanda')}
          >
            <Text style={[styles.navBtnText, step === 'comanda' && styles.navBtnTextActive]}>
              3. Comanda ({totalItemsCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.layout, isMobile && { flexDirection: 'column' }]}>
        {/* PANEL 1: MESAS */}
        {(!isMobile || step === 'mesas') && (
          <View style={[styles.panel, isMobile ? { flex: 1 } : styles.tablesPanel]}>
            <Text style={styles.sectionTitle}>Seleccionar Mesa</Text>
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

        {/* PANEL 2: MENÚ */}
        {(!isMobile || step === 'menu') && (
          <View style={[styles.panel, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>
              Menú {selectedTable ? `(Mesa Nº ${selectedTable.table_number})` : ''}
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
                  <Text style={styles.prodPrice}>${item.price || 0}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* PANEL 3: COMANDA */}
        {(!isMobile || step === 'comanda') && (
          <View style={[styles.panel, isMobile ? { flex: 1 } : styles.cartPanel]}>
            <Text style={styles.sectionTitle}>
              Comanda {selectedTable ? `Mesa #${selectedTable.table_number}` : ''}
            </Text>

            <ScrollView style={{ flex: 1 }}>
              {cart.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>
                  Aún no agregaste productos
                </Text>
              ) : (
                cart.map((item) => (
                  <View key={item.id} style={styles.cartRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{item.name}</Text>
                      <Text style={{ color: '#F59E0B' }}>${(item.price || 0) * item.quantity}</Text>
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
                ))
              )}
            </ScrollView>

            <View style={styles.cartFooter}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ color: '#AAA', fontSize: 16 }}>Total:</Text>
                <Text style={styles.totalText}>${cartTotal}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!selectedTable || cart.length === 0) && { backgroundColor: '#555' },
                ]}
                disabled={!selectedTable || cart.length === 0 || sending}
                onPress={handleSendOrder}
              >
                <Text style={styles.sendBtnText}>{sending ? 'Enviando...' : 'ENVIAR A COCINA'}</Text>
              </TouchableOpacity>
            </View>
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
  tablesPanel: { width: 220, backgroundColor: '#2D1815', borderRightWidth: 1, borderColor: '#3D201C' },
  cartPanel: { width: 280, backgroundColor: '#2D1815', borderLeftWidth: 1, borderColor: '#3D201C' },
  sectionTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  mobileNav: {
    flexDirection: 'row',
    backgroundColor: '#2D1815',
    borderBottomWidth: 1,
    borderColor: '#3D201C',
  },
  navBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  navBtnActive: { borderBottomWidth: 3, borderColor: '#F59E0B' },
  navBtnText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  navBtnTextActive: { color: '#F59E0B' },
  circleTable: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    backgroundColor: '#1E1210',
  },
  tableNum: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  badge: { paddingHorizontal: 4, borderRadius: 3, marginTop: 2 },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  searchBar: { backgroundColor: '#2D1815', color: '#FFF', padding: 8, borderRadius: 6, marginBottom: 8 },
  catScroll: { maxHeight: 38, marginBottom: 8 },
  chip: { backgroundColor: '#2D1815', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 6 },
  activeChip: { backgroundColor: '#F59E0B' },
  chipText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  productCard: { flex: 1, backgroundColor: '#2D1815', padding: 10, margin: 4, borderRadius: 6 },
  prodName: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  prodPrice: { color: '#F59E0B', fontSize: 12, marginTop: 4 },
  cartRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#3D201C', alignItems: 'center' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1E1210', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  qtyBtn: { color: '#F59E0B', fontSize: 18, fontWeight: 'bold', paddingHorizontal: 6 },
  cartFooter: { borderTopWidth: 1, borderColor: '#3D201C', paddingTop: 10, marginTop: 10 },
  totalText: { color: '#10B981', fontSize: 18, fontWeight: 'bold' },
  sendBtn: { backgroundColor: '#F59E0B', padding: 12, borderRadius: 6, alignItems: 'center' },
  sendBtnText: { color: '#FFF', fontWeight: 'bold' },
});