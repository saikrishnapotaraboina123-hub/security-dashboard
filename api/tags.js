import supabase from './_supabase.js';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { data: tags } = await supabase.from('tags').select('*').order('id');
      const result = [];
      for (const t of (tags || [])) {
        const { count } = await supabase.from('patrol_events').select('*', { count: 'exact', head: true }).eq('tag_id', t.id);
        result.push({ ...t, event_count: count || 0 });
      }
      return res.status(200).json(result);
    }
    if (req.method === 'POST') {
      const { id, name } = req.body;
      const { data, error } = await supabase.from('tags').insert({ id, name }).select().single();
      if (error) throw error;
      return res.status(201).json({ ...data, event_count:0 });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
