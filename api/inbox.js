// api/inbox.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Hanya boleh GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Gunakan metode GET' });
  }

  // Ambil alamat email yang mau dicek dari URL
  // Contoh: https://domain-vercel-kamu/api/inbox?address=budi@domain.com
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Mau cek inbox siapa? Masukkan parameter address' });
  }

  try {
    // Ambil data dari Supabase
    // Urutkan dari yang terbaru (descending)
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('recipient', address) // Filter hanya email milik 'address'
      .order('created_at', { ascending: false })
      .limit(20); // Ambil 20 email terakhir aja biar cepet

    if (error) throw error;

    return res.status(200).json({ inbox: data });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
