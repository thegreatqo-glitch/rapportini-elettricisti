import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials mancanti. Imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============ DATABASE HELPERS ============
export const db = {
  users: {
    list: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('cognome', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    findByToken: async (token) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('token', token)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    create: async ({ nome, cognome, token }) => {
      const { data, error } = await supabase
        .from('users')
        .insert({ nome, cognome, token })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    },
  },

  commesse: {
    list: async () => {
      const { data, error } = await supabase
        .from('commesse')
        .select('*')
        .order('is_system', { ascending: false })
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    create: async (nome) => {
      const { data, error } = await supabase
        .from('commesse')
        .insert({ nome, is_system: false })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, nome) => {
      const { data, error } = await supabase
        .from('commesse')
        .update({ nome })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('commesse').delete().eq('id', id);
      if (error) throw error;
    },
  },

  reports: {
    list: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (report) => {
      const { data, error } = await supabase
        .from('reports')
        .insert(report)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, fields) => {
      const { data, error } = await supabase
        .from('reports')
        .update(fields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
    },
  },

  settings: {
    get: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      return data || { company_name: 'Studio Elettrico', google_drive_folder_id: '' };
    },
    update: async (fields) => {
      const { data, error } = await supabase
        .from('settings')
        .update(fields)
        .eq('id', 1)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },
};
