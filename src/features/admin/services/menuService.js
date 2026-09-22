import { supabase } from '../../../config/supabase';

/**
 * Obtener todas las categorías ordenadas
 */
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Obtener productos con su precio vigente e información de modificadores
 */
export const getProductsWithPrices = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_prices!inner (
        price,
        valid_until
      ),
      option_groups (
        id,
        name,
        is_required,
        max_options,
        options (
          id,
          name,
          extra_price
        )
      )
    `)
    .is('product_prices.valid_until', null) // Filtra únicamente el precio activo
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Crear un producto e insertar su precio inicial
 */
export const createProductWithPrice = async ({
  category_id,
  name,
  description,
  image_url,
  price,
}) => {
  // 1. Crear el producto
  const { data: product, error: prodError } = await supabase
    .from('products')
    .insert([{ category_id, name, description, image_url }])
    .select()
    .single();

  if (prodError) throw prodError;

  // 2. Insertar el precio inicial en product_prices
  const { error: priceError } = await supabase
    .from('product_prices')
    .insert([{ product_id: product.id, price: parseFloat(price) }]);

  if (priceError) throw priceError;

  return product;
};