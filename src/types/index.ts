export type GuardStatus =
  | 'active'
  | 'offline'
  | 'delayed';

export interface PatrolEvent {
  id: string;
  guardId: string;
  guardName: string;
  checkpoint: string;
  time: string;
  rssi: number;
  status: GuardStatus;
}

export interface Guard {
  id: string;
  name: string;
  status: GuardStatus;
  checkpoint: string;
  lastSeen: string;
}

export interface AttendanceRecord {
  id: number;
  guard_name: string;
  check_in: string;
  check_out?: string;
  status: string;
}
export interface SecurityGuard {
  id: string;
  name: string;
  mac_address: string;
  mobile_number?: string;
  created_at?: string;
}
