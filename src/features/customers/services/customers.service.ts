import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Customer } from '@/types/database';

export const getCustomers = cache(async (): Promise<Customer[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, email, phone, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customers:', error.message);
    return [];
  }

  return data || [];
});
