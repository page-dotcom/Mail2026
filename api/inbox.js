import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // --- IZIN AKSES (CORS) BIAR BLOGGER BISA BACA ---
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // ------------------------------------------------

  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Parameter address wajib diisi' });
  }

  try {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('recipient', address)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return res.status(200).json({ inbox: data });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
