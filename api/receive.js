import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- LOGIKA PEMBERSIH DARI LO (Regex Decoder) ---
const cleanEmail = (rawText) => {
  if (!rawText) return "<html><body>No content</body></html>";
  let content = rawText;
  try {
    content = content
      .replace(/=\r\n/g, '').replace(/=\n/g, '')
      .replace(/=([0-9A-F]{2})=([0-9A-F]{2})=([0-9A-F]{2})/gi, (m, h1, h2, h3) => { try { return decodeURIComponent(`%${h1}%${h2}%${h3}`) } catch(e){return m} })
      .replace(/=([0-9A-F]{2})=([0-9A-F]{2})/gi, (m, h1, h2) => { try { return decodeURIComponent(`%${h1}%${h2}`) } catch(e){return m} })
      .replace(/=([0-9A-F]{2})/gi, (m, hex) => {
        if (hex === '3D') return '=';
        if (hex === '20') return ' ';
        try { return String.fromCharCode(parseInt(hex, 16)); } catch(e) { return m; }
      });
  } catch (e) {}

  // Potong Header Sampah
  const htmlStart = content.search(/<!DOCTYPE|<html|<body|<div/i);
  if (htmlStart !== -1) {
    content = content.substring(htmlStart);
  } else {
    const parts = content.split('Content-Type: text/html');
    if (parts.length > 1) {
      let bodyPart = parts[1].replace(/Content-Transfer-Encoding:.*?\n\n/s, '');
      const firstTag = bodyPart.search(/</);
      if (firstTag !== -1) content = bodyPart.substring(firstTag);
    }
  }
  content = content.replace(/--[a-zA-Z0-9._-]+--\s*$/, '');
  
  // Tambah Base Target (Biar link aman)
  if (!content.includes('<base')) {
      content = '<base target="_blank">' + content;
  }
  return content;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const secret = req.headers['x-secret-key'];
  if (secret !== process.env.API_SECRET) return res.status(401).send('Unauthorized');

  const { from, to, subject, text } = req.body;

  try {
    // BERSIHKAN
    const finalHtml = cleanEmail(text);

    // SIMPAN
    const { error } = await supabase
      .from('emails')
      .insert([{
          sender: from, recipient: to, subject: subject,
          body_text: finalHtml, // HTML BERSIH
          created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
