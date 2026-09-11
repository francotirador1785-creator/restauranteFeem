import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {
  getCategories,
  getProductsWithPrices,
  createProductWithPrice,
} from '../services/menuService';

export default function MenuManagerScreen() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados del Modal de alta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catData, prodData] = await Promise.all([
        getCategories(),
        getProductsWithPrices(),
      ]);

      setCategories(catData || []);
      setProducts(prodData || []);

      if (catData?.length > 0) {
        setSelectedCategory(catData[0].id);
        setCategoryId(catData[0].id);
      }
    } catch (err) {
      Alert.alert('Error al cargar datos', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!name.trim() || !price || !categoryId) {
      Alert.alert('Atención', 'Nombre, precio y categoría son obligatorios');
      return;
    }

    try {
      setSubmitting(true);
      await createProductWithPrice({
        name: name.trim(),
        description: description.trim(),
        price,
        image_url: imageUrl.trim() || 'https://via.placeholder.com/150',
        category_id: categoryId,
      });

      Alert.alert('¡Éxito!', 'Producto registrado en el menú');
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      Alert.alert('Error al guardar', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setImageUrl('');
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carta / Menú (Admin)</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalOpen(true)}
        >
          <Text style={styles.addButtonText}>+ Nuevo Ítem</Text>
        </TouchableOpacity>
      </View>

      {/* Categorías */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => {
                setSelectedCategory(cat.id);
                setCategoryId(cat.id);
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grilla de productos */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const currentPrice = item.product_prices?.[0]?.price ?? '0.00';

          return (
            <View style={styles.card}>
              <Image
                source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                style={styles.cardImage}
              />
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardPrice}>${currentPrice}</Text>
            </View>
          );
        }}
      />

      {/* Modal para alta */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Ítem de Menú</Text>

            <TextInput
              placeholder="Nombre del producto"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              placeholder="Descripción"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
            />
            <TextInput
              placeholder="Precio ($)"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="URL de la imagen"
              value={imageUrl}
              onChangeText={setImageUrl}
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProduct}
                disabled={submitting}
              >
                <Text style={styles.modalButtonText}>
                  {submitting ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 50 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  addButton: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontWeight: 'bold' },
  categoryContainer: { paddingHorizontal: 16, marginBottom: 16 },
  categoryChip: { backgroundColor: '#E9ECEF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  categoryChipActive: { backgroundColor: '#FF5722' },
  categoryText: { color: '#495057', fontWeight: '600' },
  categoryTextActive: { color: '#FFF' },
  listContainer: { paddingHorizontal: 10 },
  card: { flex: 1, backgroundColor: '#FFF', margin: 6, borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  cardImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 8 },
  cardTitle: { fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  cardPrice: { color: '#10B981', fontWeight: 'bold', fontSize: 14, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#FFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#CED4DA', borderRadius: 8, padding: 10, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  cancelButton: { backgroundColor: '#6C757D' },
  saveButton: { backgroundColor: '#10B981' },
  modalButtonText: { color: '#FFF', fontWeight: 'bold' },
});