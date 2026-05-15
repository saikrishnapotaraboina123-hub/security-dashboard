import { createClient } from '@supabase/supabase-js';

// ================================
// SUPABASE CONFIG
// ================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey);

// ================================
// API HANDLER
// ================================
export default async function handler(req, res) {

  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {

    // ================================
    // GET DATA FROM ESP32
    // ================================
    const {
      mac_address,
      device_name,
      rssi,
      esp32_location
    } = req.body;

    // ================================
    // VALIDATION
    // ================================
    if (!mac_address || rssi === undefined) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    console.log('Received Data:', req.body);

    // ================================
    // INSERT INTO patrol_logs
    // ================================
    const { data, error } = await supabase
      .from('patrol_logs')
      .insert([
        {
          mac_address,
          device_name,
          rssi,
          esp32_location
        }
      ]);

    // ================================
    // HANDLE DATABASE ERROR
    // ================================
    if (error) {

      console.error('Supabase Insert Error:', error);

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // ================================
    // SUCCESS RESPONSE
    // ================================
    return res.status(200).json({
      success: true,
      message: 'Data inserted successfully',
      data
    });

  } catch (err) {

    console.error('Server Error:', err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
