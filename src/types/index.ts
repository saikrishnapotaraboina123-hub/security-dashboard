export type GuardStatus = 'active' | 'offline' | 'delayed';

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