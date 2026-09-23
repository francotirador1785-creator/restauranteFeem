// src/features/admin/services/tableService.js
import { supabase } from '../../../config/supabase';

/**
 * Obtiene todas las mesas ordenadas por su número
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
 * Crear una nueva mesa (Solo Administrador)
 */
export const createTable = async (tableNumber = null, userRole = '') => {
  if (userRole !== 'admin') {
    throw new Error('Permiso denegado: Solo el Administrador puede crear mesas.');
  }

  let finalNumber = tableNumber;

  if (!finalNumber) {
    const { data, error: maxError } = await supabase
      .from('tables')
      .select('table_number')
      .order('table_number', { ascending: false })
      .limit(1);

    if (maxError) throw maxError;

    const highestNumber = data && data.length > 0 ? data[0].table_number : 0;
    finalNumber = highestNumber + 1;
  }

  const { data, error } = await supabase
    .from('tables')
    .insert([
      {
        table_number: Number(finalNumber),
        status: 'available',
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`La mesa número ${finalNumber} ya existe.`);
    }
    throw error;
  }

  return data;
};

/**
 * Eliminar una mesa (Solo Administrador)
 */
export const deleteTable = async (tableId, userRole = '') => {
  if (userRole !== 'admin') {
    throw new Error('Permiso denegado: Solo el Administrador puede eliminar mesas.');
  }

  const { error } = await supabase
    .from('tables')
    .delete()
    .eq('id', tableId);

  if (error) throw error;
};

/**
 * Actualizar estado de la mesa
 */
export const updateTableStatus = async (tableId, status, userRole = '') => {
  if (!['admin', 'mozo'].includes(userRole)) {
    throw new Error('Permiso denegado: Tu usuario no puede cambiar el estado de la mesa.');
  }

  const { data, error } = await supabase
    .from('tables')
    .update({ status })
    .eq('id', tableId)
    .select()
    .single();

  if (error) throw error;
  return data;
};