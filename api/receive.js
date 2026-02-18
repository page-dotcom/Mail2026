import { createClient } from '@supabase/supabase-js';

// Setup Database
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  // 1. Cek Metode (Harus POST)
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // 2. Cek Password Rahasia (Biar gak dispam orang lain)
  const secret = req.headers['x-secret-key'];
  if (secret !== process.env.API_SECRET) return res.status(401).send('Unauthorized');

  // 3. Ambil Data dari Cloudflare
  const { from, to, subject, text } = req.body;

  try {
    // 4. LANGSUNG SIMPAN (Tanpa Edit-Edit Biar Gak Error)
    const { error } = await supabase
      .from('emails')
      .insert([{
          sender: from,
          recipient: to,
          subject: subject,
          body_text: text, // Simpan mentahannya
          created_at: new Date().toISOString()
      }]);

    if (error) throw error;

    return res.status(200).json({ message: 'Sukses disimpan!' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
