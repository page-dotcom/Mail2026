import { createClient } from '@supabase/supabase-js';
import { simpleParser } from 'mailparser';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const secret = req.headers['x-secret-key'];
  if (secret !== process.env.API_SECRET) return res.status(401).send('Unauthorized');

  const { from, to, subject, text } = req.body;

  try {
    // KITA PARSE TAPI KITA AMBIL HTML ASLINYA
    const parsed = await simpleParser(text);
    
    // PENTING: Ambil .html (format asli), kalau gak ada baru ambil .textAsHtml
    const originalHtml = parsed.html || parsed.textAsHtml || parsed.text;

    const { error } = await supabase
      .from('emails')
      .insert([{
          sender: from,
          recipient: to,
          subject: subject,
          body_text: originalHtml, // KITA SIMPAN HTML ASLINYA DISINI
          created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    res.status(200).json({ message: 'HTML Asli Disimpan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
