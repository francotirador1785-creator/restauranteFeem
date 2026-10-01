// src/features/admin/services/tableService.js
import { supabase } from '../../../config/supabase';

export const getTables = async () => {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('table_number', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

export const createTable = async (customNumber = null) => {
  let tableNumber = customNumber;

  // Si no se especificó un número, se asigna el siguiente automáticamente
  if (!tableNumber) {
    const existingTables = await getTables();
    tableNumber = existingTables.length > 0 
      ? Math.max(...existingTables.map((t) => Number(t.table_number) || 0)) + 1 
      : 1;
  }

  const { data, error } = await supabase
    .from('tables')
    .insert([{ table_number: Number(tableNumber), status: 'available' }])
    .select();

  if (error) throw new Error('Error al crear la mesa: ' + error.message);
  return data;
};

export const deleteTable = async (tableId) => {
  const { data, error } = await supabase
    .from('tables')
    .delete()
    .eq('id', tableId);

  if (error) throw new Error('Error al eliminar la mesa: ' + error.message);
  return data;
};