// ==========================================
// GUARD TYPE
// ==========================================
export interface SecurityGuard {

  id: string;

  name: string;

  mac_address: string;

  mobile_number: string;
}

// ==========================================
// PATROL LOG TYPE
// ==========================================
export interface PatrolLog {

  id?: string;

  created_at?: string;

  mac_address: string;

  device_name: string;

  rssi: number;

  esp32_location: string;
}

// ==========================================
// DASHBOARD EVENT TYPE
// ==========================================
export interface PatrolEvent {

  id: string;

  created_at: string;

  mac_address: string;

  device_name: string;

  rssi: number;

  esp32_location: string;
}

// ==========================================
// DASHBOARD STATS TYPE
// ==========================================
export interface DashboardStats {

  totalLogs: number;

  totalGuards: number;

  activeLocations: number;

  averageRSSI: number;
}

// ==========================================
// FILTER TYPE
// ==========================================
export interface PatrolFilters {

  guardMac?: string;

  location?: string;
}

// ==========================================
// RSSI STATUS TYPE
// ==========================================
export type SignalStatus =
  | 'strong'
  | 'medium'
  | 'weak';

// ==========================================
// GUARD STATUS TYPE
// ==========================================
export type GuardStatus =
  | 'active'
  | 'delayed'
  | 'offline';
