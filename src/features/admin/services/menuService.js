// src/features/admin/services/menuService.js
import { supabase } from '../../../config/supabase';

// 1. Obtener todas las categorías
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data;
};

// 2. Obtener productos con su precio activo
export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      category_id,
      name,
      description,
      is_available,
      image_url,
      product_prices ( price )
    `)
    .order('name', { ascending: true });

  if (error) throw error;
  
  // Mapeamos el precio de la relación de Supabase
  return data.map((p) => ({
    ...p,
    price: p.product_prices && p.product_prices.length > 0 ? p.product_prices[0].price : 0,
  }));
};

// 3. Crear un producto y asignarle un precio
export const createProduct = async (productData) => {
  const { name, description, price, category_id, image_url } = productData;

  // Insertar producto
  const { data: newProduct, error: prodError } = await supabase
    .from('products')
    .insert([
      {
        name,
        description,
        category_id,
        image_url: image_url || null,
        is_available: true,
      },
    ])
    .select()
    .single();

  if (prodError) throw prodError;

  // Insertar precio asociado
  const { error: priceError } = await supabase.from('product_prices').insert([
    {
      product_id: newProduct.id,
      price: parseFloat(price),
    },
  ]);

  if (priceError) throw priceError;

  return newProduct;
};

// 4. Eliminar producto
export const deleteProduct = async (productId) => {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
};
