import { createClient } from '@supabase/supabase-js';

// --- 1. INISIALISASI DATABASE ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- 2. FUNGSI DECODER CANGGIH (PUNYA KAMU) ---
const processEmailContent = (rawText) => {
  if (!rawText) return "<html><body><p>No message content.</p></body></html>";
  
  let content = rawText;
  
  try {
    // Decode Quoted-Printable (=3D jadi =, =20 jadi spasi, dll)
    content = content
      .replace(/=\r\n/g, '').replace(/=\n/g, '')
      // Coba decode karakter Hex kompleks
      .replace(/=([0-9A-F]{2})=([0-9A-F]{2})=([0-9A-F]{2})/gi, (m, h1, h2, h3) => {
          try { return decodeURIComponent(`%${h1}%${h2}%${h3}`); } catch(e) { return m; }
      })
      .replace(/=([0-9A-F]{2})=([0-9A-F]{2})/gi, (m, h1, h2) => {
          try { return decodeURIComponent(`%${h1}%${h2}`); } catch(e) { return m; }
      })
      .replace(/=([0-9A-F]{2})/gi, (m, hex) => {
        if (hex === '3D') return '=';
        if (hex === '20') return ' ';
        try { return String.fromCharCode(parseInt(hex, 16)); } catch(e) { return m; }
      });
  } catch (e) { console.log("Error decoding:", e); }

  // Potong Header (Cari start HTML)
  const htmlStart = content.search(/<!DOCTYPE|<html|<body|<div/i);
  if (htmlStart !== -1) {
    content = content.substring(htmlStart);
  } else {
    // Kalau gak ketemu tag HTML, coba cari boundary content type
    const parts = content.split('Content-Type: text/html');
    if (parts.length > 1) {
      let bodyPart = parts[1].replace(/Content-Transfer-Encoding:.*?\n\n/s, '');
      const firstTag = bodyPart.search(/</);
      if (firstTag !== -1) content = bodyPart.substring(firstTag);
    }
  }

  // Bersihkan boundary akhir
  content = content.replace(/--[a-zA-Z0-9._-]+--\s*$/, '');
  
  // Tambahkan Style Dasar biar gambar/link rapi
  const baseTag = '<base target="_blank"><style>body{margin:0;font-family:Arial,sans-serif; overflow-wrap: break-word;} img{max-width:100%;height:auto;} a{color:blue; font-weight:bold;}</style>';
  
  if (content.includes('<head>')) {
    content = content.replace('<head>', '<head>' + baseTag);
  } else {
    content = baseTag + content;
  }
  
  return content;
};

// --- 3. HANDLER UTAMA ---
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const secret = req.headers['x-secret-key'];
  if (secret !== process.env.API_SECRET) return res.status(401).send('Unauthorized');

  // Ambil data mentah
  const { from, to, subject, text } = req.body;

  try {
    // BERSIHKAN DULU SEBELUM DISIMPAN!
    const cleanHtml = processEmailContent(text);

    const { error } = await supabase
      .from('emails')
      .insert([{
          sender: from,
          recipient: to,
          subject: subject,
          body_text: cleanHtml, // Data yang masuk database sudah berupa HTML BERSIH
          created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    res.status(200).json({ message: 'Email cleaned & saved!' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
