import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {

    const {
      mac_address,
      device_name,
      rssi,
      esp32_location
    } = req.body;

    const { data, error } =
      await supabase
        .from('patrol_logs')
        .insert([
          {
            mac_address,
            device_name,
            rssi,
            esp32_location
          }
        ]);

    if (error) {

      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });
  }
}
