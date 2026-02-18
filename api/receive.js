import { createClient } from '@supabase/supabase-js';
import PostalMime from 'postal-mime';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const secret = req.headers['x-secret-key'];
  if (secret !== process.env.API_SECRET) return res.status(401).send('Unauthorized');

  // Ambil data mentah yang dikirim Worker
  const { from, to, subject, text } = req.body;

  try {
    let cleanText = text;

    // Jika pesan mengandung kode-kode aneh (MIME), kita bedah pakai PostalMime
    if (text.includes("Content-Type:")) {
      const parser = new PostalMime();
      const emailData = await parser.parse(text);
      // Ambil versi teks murni, kalau gak ada ambil versi HTML (tanpa tag)
      cleanText = emailData.text || emailData.html.replace(/<[^>]*>?/gm, '');
    }

    const { error } = await supabase
      .from('emails')
      .insert([{
          sender: from,
          recipient: to,
          subject: subject,
          body_text: cleanText.trim(), // Teks yang sudah bersih
          created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    res.status(200).json({ message: 'Clean mail saved!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
