import supabase from './_supabase.js';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { tag_id, anchor_id } = req.query;
    let query = supabase.from('patrol_events').select('timestamp_utc, anchor_id, tag_id, rssi, battery, anchors(lat, lon)').order('timestamp_utc');
    if (tag_id) query = query.eq('tag_id', tag_id);
    if (anchor_id) query = query.eq('anchor_id', anchor_id);
    const { data, error } = await query;
    if (error) throw error;
    const header = 'timestamp_utc,anchor_id,tag_id,rssi,battery,lat,lon';
    const rows = (data || []).map(r => [r.timestamp_utc||'',r.anchor_id||'',r.tag_id||'',r.rssi??'',r.battery??'',r.anchors?.lat??'',r.anchors?.lon??''].join(','));
    const csv = [header,...rows].join('\n');
    const filename = `patrol_events_${new Date().toISOString().slice(0,19).replace(/[:-]/g,'')}.csv`;
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition',`attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
