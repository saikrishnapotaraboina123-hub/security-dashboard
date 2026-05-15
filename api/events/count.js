import supabase from './_supabase.js';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { tag_id, anchor_id } = req.query;
    let query = supabase.from('patrol_events').select('*', { count: 'exact', head: true });
    if (tag_id) query = query.eq('tag_id', tag_id);
    if (anchor_id) query = query.eq('anchor_id', anchor_id);
    const { count, error } = await query;
    if (error) throw error;
    return res.status(200).json({ count: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
