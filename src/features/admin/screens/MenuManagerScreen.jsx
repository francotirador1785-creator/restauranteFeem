// src/features/admin/screens/MenuManagerScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import Header from '../../../components/common/Header';
import { getCategories, getProducts, createProduct, deleteProduct } from '../services/menuService';

export default function MenuManagerScreen({ activeTab, onSelectTab }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados Formulario Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catData, prodData] = await Promise.all([getCategories(), getProducts()]);
      setCategories(catData || []);
      setProducts(prodData || []);
      if (catData && catData.length > 0) {
        setCategoryId(catData[0].id);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!name.trim() || !price || !categoryId) {
      alert('Completa el nombre, precio y selecciona una categoría.');
      return;
    }

    try {
      setSubmitting(true);
      await createProduct({
        name,
        description,
        price,
        category_id: categoryId,
      });

      setName('');
      setDescription('');
      setPrice('');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      alert('Error al crear producto: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm(`¿Deseas eliminar "${product.name}"?`)
      : true;

    if (confirm) {
      try {
        await deleteProduct(product.id);
        await loadData();
      } catch (err) {
        alert('Error al borrar: ' + err.message);
      }
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  return (
    <View style={styles.container}>
      <Header activeTab={activeTab || 'Menu'} onSelectTab={onSelectTab} />

      {/* Control Bar Compacta */}
      <View style={styles.topBar}>
        <View style={styles.leftTitleGroup}>
          <Text style={styles.screenTitle}>Catálogo del Menú</Text>
          <Text style={styles.countBadge}>{filteredProducts.length} ítems</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalOpen(true)}>
          <Text style={styles.addButtonText}>+ Nuevo Ítem</Text>
        </TouchableOpacity>
      </View>

      {/* Categorías Horizontal */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === null && styles.activeChip]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.chipText, selectedCategory === null && styles.activeChipText]}>
              Todos
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.id && styles.activeChip]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.chipText, selectedCategory === cat.id && styles.activeChipText]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grilla de Productos Compacta */}
      {loading ? (
        <ActivityIndicator size="large" color="#F59E0B" style={{ flex: 1 }} />
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay productos en esta categoría.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={Platform.OS === 'web' ? 4 : 2}
          contentContainerStyle={styles.listGrid}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>${item.price.toLocaleString('es-AR')}</Text>
              </View>
              <Text style={styles.productDesc} numberOfLines={2}>
                {item.description || 'Sin descripción'}
              </Text>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteProduct(item)}
              >
                <Text style={styles.deleteBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal Agregar Producto */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Producto</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Hamburguesa Doble"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Categoría *</Text>
            <ScrollView horizontal style={{ marginBottom: 12 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.selectChip, categoryId === cat.id && styles.activeSelectChip]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text style={{ color: categoryId === cat.id ? '#FFF' : '#333', fontWeight: 'bold' }}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Precio ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="4500"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, { height: 50 }]}
              placeholder="Ingredientes..."
              placeholderTextColor="#888"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#555' }]}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
                onPress={handleCreateProduct}
                disabled={submitting}
              >
                <Text style={styles.btnText}>{submitting ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1210' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  screenTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  countBadge: {
    backgroundColor: '#3B1F1B',
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    cursor: 'pointer',
  },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  categoryContainer: { paddingHorizontal: 16, marginBottom: 12 },
  categoryChip: {
    backgroundColor: '#2D1815',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#44221D',
  },
  activeChip: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  chipText: { color: '#AAA', fontSize: 13, fontWeight: '600' },
  activeChipText: { color: '#FFF', fontWeight: 'bold' },
  listGrid: { paddingHorizontal: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#AAA', fontSize: 14 },
  
  /* Tarjeta de Producto Compacta */
  cardContainer: {
    flex: 1,
    backgroundColor: '#2D1815',
    margin: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D201C',
    maxWidth: '24%', // En Web acomoda 4 tarjetas compactas por fila
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  productName: { color: '#FFF', fontSize: 14, fontWeight: 'bold', flex: 1, marginRight: 4 },
  productPrice: { color: '#F59E0B', fontSize: 14, fontWeight: 'bold' },
  productDesc: { color: '#888', fontSize: 11, marginBottom: 10 },
  deleteBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  /* Modal Formulario */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#111' },
  label: { fontSize: 11, fontWeight: 'bold', color: '#444', marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    color: '#000',
    fontSize: 13,
  },
  selectChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#EEE',
    borderRadius: 12,
    marginRight: 6,
  },
  activeSelectChip: { backgroundColor: '#F59E0B' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});