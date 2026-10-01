// src/features/cocina/services/kitchenService.js
import { supabase } from '../../../config/supabase';

// Obtener pedidos activos (pendientes o en preparación)
export const getActiveOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .in('status', ['pending', 'in_preparation'])
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

// Cambiar estado del pedido (ej: pending -> in_preparation -> ready)
export const updateOrderStatus = async (orderId, newStatus) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select();

  if (error) throw error;
  return data;
};

// Crear un nuevo pedido desde la pantalla del Mozo
export const createOrder = async (tableId, tableNumber, items, orderType = 'dine_in') => {
  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  // 1. Insertar el pedido principal (pasando el objeto directo sin los corchetes [ ])
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_id: tableId,
      table_number: tableNumber,
      order_type: orderType,
      status: 'pending',
      total: total,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 2. Insertar los ítems del detalle
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    product_name: item.name,
    quantity: item.quantity,
    notes: item.notes || '',
    unit_price: item.price || 0,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  return order;
};