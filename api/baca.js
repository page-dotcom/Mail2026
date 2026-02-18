import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  // Ambil alamat email dari URL
  const { email } = req.query;

  if (!email) return res.status(400).send('ERROR: Masukkan alamat email di URL. Contoh: /api/baca?email=user123@domain.com');

  try {
    // AMBIL 1 PESAN TERAKHIR
    const { data, error } = await supabase
      .from('emails')
      .select('body_text')
      .eq('recipient', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
        // Tampilan kalau belum ada pesan (Polos aja)
        res.setHeader('Content-Type', 'text/html');
        return res.send('<h3 style="font-family:sans-serif; text-align:center; color:#888; margin-top:50px;">Belum ada pesan masuk untuk: ' + email + '</h3>');
    }

    // TAMPILKAN HTML ASLI (RENDER)
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(data.body_text);

  } catch (err) {
    res.status(500).send('Server Error');
  }
}
