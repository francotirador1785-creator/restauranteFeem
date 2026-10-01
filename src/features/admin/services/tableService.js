// src/features/admin/services/tableService.js
import { supabase } from '../../../config/supabase';

export const getTables = async () => {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('table_number', { ascending: true });

  if (error) {
    console.error('Error cargando mesas:', error);
    throw error;
  }
  return data;
};

export const updateTableStatus = async (tableId, status) => {
  const { data, error } = await supabase
    .from('tables')
    .update({ status })
    .eq('id', tableId)
    .select();

  if (error) {
    console.error(`Error cambiando estado de mesa ${tableId} a ${status}:`, error);
    throw error;
  }
  return data;
};