// src/features/cocina/services/kitchenService.js
import { supabase } from '../../../config/supabase';

// 1. Exportación requerida por KitchenScreen
export const getActiveOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .in('status', ['pending', 'in_preparation'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al obtener órdenes activas:', error.message);
    throw error;
  }
  return data || [];
};

// 2. Cambiar estado de orden individual
export const updateOrderStatus = async (orderId, newStatus) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select();

  if (error) throw new Error(error.message);
  return data;
};

// 3. Crear orden desde Mozo
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

// 4. Obtener total acumulado de una mesa
export const getTableTotal = async (tableId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, total, status')
    .eq('table_id', tableId)
    .neq('status', 'completed')
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error al obtener total:', error.message);
    return { total: 0, orders: [] };
  }

  const total = (data || []).reduce((sum, order) => sum + Number(order.total || 0), 0);
  return { total, orders: data };
};

// 5. Cerrar pedidos al liberar la mesa
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