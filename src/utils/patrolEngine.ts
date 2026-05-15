import type { PatrolEvent } from '../types';

/**
 * Converts raw timestamp into freshness-based status
 * This is the "brain" of your system
 */
export function getSmartStatus(event: PatrolEvent): string {
  const now = Date.now();
  const eventTime = new Date(event.created_at).getTime();

  const diffMinutes = (now - eventTime) / (1000 * 60);

  if (diffMinutes > 10) return 'offline';
  if (diffMinutes > 5) return 'delayed';
  return 'active';
}

/**
 * Detect if a device is missing (no recent data)
 */
export function isDeviceMissing(events: PatrolEvent[], mac: string): boolean {
  const latest = events
    .filter(e => e.mac_address === mac)
    .sort((a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    )[0];

  if (!latest) return true;

  const diffMinutes =
    (Date.now() - new Date(latest.created_at).getTime()) /
    (1000 * 60);

  return diffMinutes > 10;
}

/**
 * System health summary
 */
export function getSystemHealth(events: PatrolEvent[]) {
  const active = events.filter(e => getSmartStatus(e) === 'active').length;
  const delayed = events.filter(e => getSmartStatus(e) === 'delayed').length;
  const offline = events.filter(e => getSmartStatus(e) === 'offline').length;

  return {
    active,
    delayed,
    offline,
    total: events.length,
  };
}

/**
 * Simple RSSI strength classifier
 */
export function getSignalStrength(rssi: number) {
  if (rssi >= -50) return 'strong';
  if (rssi >= -70) return 'medium';
  return 'weak';
}
