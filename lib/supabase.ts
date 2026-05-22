import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tcwhnoxzqibqtpgedvbv.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fIU5XfFPF_EZaLv1o4SZCA_iK0sw8KW';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Utility to upload a file to Supabase Storage
 */
export async function uploadFileToSupabase(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });
  if (error) throw error;
  return data;
}

/**
 * Utility to get a public URL for a file in Supabase Storage
 */
export function getSupabasePublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
