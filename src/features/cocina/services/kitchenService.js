// src/features/cocina/services/kitchenService.js
import { supabase } from '../../../config/supabase';

export const createOrder = async (tableId, tableNumber, items, orderType = 'dine_in') => {
  const totalAmount = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      table_id: tableId,
      table_number: Number(tableNumber),
      order_type: orderType,
      status: 'pending',
      total: totalAmount,
    }])
    .select()
    .single();

  if (orderError) throw new Error('Error al crear orden: ' + orderError.message);

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

  if (itemsError) throw new Error('Error al guardar items: ' + itemsError.message);

  return order;
};

export const getTableTotal = async (tableId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, total, status')
    .eq('table_id', tableId)
    .neq('status', 'completed')
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error al obtener total:', error);
    return { total: 0, orders: [] };
  }

  const total = (data || []).reduce((sum, order) => sum + Number(order.total || 0), 0);
  return { total, orders: data };
};

export const closeTableOrders = async (tableId) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'completed' })
    .eq('table_id', tableId)
    .neq('status', 'completed');

  if (error) {
    console.warn('Advertencia al cerrar pedidos:', error.message);
  }
  return data;
};