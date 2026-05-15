import type { Guard, PatrolEvent } from '../types';

export const mockGuards: Guard[] = [
  { id: 'G001', name: 'Ravi Kumar',    status: 'active',  checkpoint: 'Gate A',         lastSeen: '2 min ago'  },
  { id: 'G002', name: 'Suresh Reddy',  status: 'active',  checkpoint: 'Block B',         lastSeen: '5 min ago'  },
  { id: 'G003', name: 'Nagaraju P',    status: 'delayed', checkpoint: 'Perimeter East',  lastSeen: '18 min ago' },
  { id: 'G004', name: 'Anjaiah M',     status: 'offline', checkpoint: 'Parking Lot',     lastSeen: '45 min ago' },
  { id: 'G005', name: 'Venkat Rao',    status: 'active',  checkpoint: 'Main Lobby',      lastSeen: '1 min ago'  },
];

export const mockEvents: PatrolEvent[] = [
  { id: 'E001', guardId: 'G001', guardName: 'Ravi Kumar',   checkpoint: 'Gate A',         time: '22:43:11', rssi: -62, status: 'active'  },
  { id: 'E002', guardId: 'G005', guardName: 'Venkat Rao',   checkpoint: 'Main Lobby',     time: '22:42:05', rssi: -55, status: 'active'  },
  { id: 'E003', guardId: 'G002', guardName: 'Suresh Reddy', checkpoint: 'Block B',        time: '22:38:47', rssi: -70, status: 'active'  },
  { id: 'E004', guardId: 'G003', guardName: 'Nagaraju P',   checkpoint: 'Perimeter East', time: '22:25:30', rssi: -81, status: 'delayed' },
  { id: 'E005', guardId: 'G004', guardName: 'Anjaiah M',    checkpoint: 'Parking Lot',    time: '21:58:00', rssi: -95, status: 'offline' },
];
