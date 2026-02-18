// api/receive.js
import { createClient } from '@supabase/supabase-js';

// Inisialisasi koneksi ke Supabase
// (Nanti kita isi variabel ini di Setting Vercel)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const apiSecret = process.env.API_SECRET; // Password biar aman

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // 1. Cek Metode Request (Harus POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Cek Password Rahasia (Security)
  // Nanti di Cloudflare kita set header 'x-secret-key'
  const secret = req.headers['x-secret-key'];
  if (secret !== apiSecret) {
    return res.status(401).json({ error: 'Unauthorized: Salah password bos!' });
  }

  // 3. Ambil Data dari Body Request
  // Data ini nanti dikirim oleh Cloudflare Worker
  const { from, to, subject, text, html } = req.body;

  if (!from || !to || !subject) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  try {
    // 4. Masukkan ke Database Supabase
    const { data, error } = await supabase
      .from('emails') // Nama tabel di Supabase nanti
      .insert([
        {
          sender: from,
          recipient: to, // Ini email fake kamu (misal: budi@domain.com)
          subject: subject,
          body_text: text,
          body_html: html,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) throw error;

    return res.status(200).json({ message: 'Email berhasil disimpan!', data });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
