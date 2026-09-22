import { supabase } from '../../../config/supabase';

/**
 * Obtener todas las mesas ordenadas por número
 */
export const getTables = async () => {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('table_number', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Crear una nueva mesa en la base de datos
 */
export const createTable = async (tableNumber, capacity = 4) => {
  const { data, error } = await supabase
    .from('tables')
    .insert([
      {
        table_number: parseInt(tableNumber, 10),
        capacity: parseInt(capacity, 10),
        status: 'available', // disponible por defecto
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};