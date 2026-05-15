import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { tag_id, anchor_id, limit = 100, offset = 0 } = req.query;
      let query = supabase.from('patrol_events').select('*, anchors(name, lat, lon)', { count: 'exact' })
        .order('timestamp_utc', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      if (tag_id) query = query.eq('tag_id', tag_id);
      if (anchor_id) query = query.eq('anchor_id', anchor_id);
      
      const { data, error } = await query;
      if (error) throw error;
      
      const flattened = (data || []).map(e => ({
        id: e.id, received_at: e.received_at, timestamp_utc: e.timestamp_utc,
        anchor_id: e.anchor_id, tag_id: e.tag_id, rssi: e.rssi,
        battery: e.battery, lat: e.anchors?.lat || null, lon: e.anchors?.lon || null,
      }));
      return res.status(200).json(flattened);
    }
    
    if (req.method === 'POST') {
      const events = Array.isArray(req.body) ? req.body : [req.body];
      const rows = events.map(e => ({
        timestamp_utc: e.timestamp_utc || new Date().toISOString(),
        anchor_id: e.anchor_id || 'demo-anchor',
        tag_id: e.tag_id || 'unknown-tag',
        rssi: e.rssi || -70, battery: e.battery || null, raw_json: e,
      }));
      const { data, error } = await supabase.from('patrol_events').insert(rows).select();
      if (error) throw error;
      return res.status(201).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Events error:', err);
    res.status(500).json({ error: err.message });
  }
}
