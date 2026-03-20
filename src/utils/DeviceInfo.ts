/**
 * DeviceInfo.ts
 * Detects device RAM and provides model size recommendations.
 */

import * as Device from 'expo-device';
import { Platform } from 'react-native';

/** Returns device total RAM in GB, or a safe default (4 GB) if unavailable. */
export function getDeviceRAMGb(): number {
  const totalBytes = Device.totalMemory;
  if (totalBytes && totalBytes > 0) {
    return Math.round((totalBytes / (1024 * 1024 * 1024)) * 10) / 10;
  }
  // Fallback: assume 4 GB for safety
  return 4;
}

/** Returns device model name (e.g. "iPhone 15 Pro", "Pixel 8"). */
export function getDeviceModelName(): string {
  return Device.modelName ?? (Platform.OS === 'ios' ? 'iPhone' : 'Android Device');
}

/** Maximum recommended model file size in bytes based on available RAM. */
export function getRecommendedMaxBytes(ramGb: number): number {
  // Rule of thumb: model should fit comfortably in ~25-40% of RAM
  // Plus leave room for OS and app overhead
  if (ramGb <= 3) return 500 * 1024 * 1024;        // 500 MB
  if (ramGb <= 4) return 1.0 * 1024 * 1024 * 1024;  // 1.0 GB
  if (ramGb <= 6) return 2.0 * 1024 * 1024 * 1024;  // 2.0 GB
  if (ramGb <= 8) return 2.5 * 1024 * 1024 * 1024;  // 2.5 GB
  return 4.0 * 1024 * 1024 * 1024;                   // 4.0 GB (8+ GB RAM)
}

export type DeviceCompatibility = 'recommended' | 'compatible' | 'too-large';

/** Determine how well a model fits this device. */
export function getDeviceCompatibility(modelSizeBytes: number, ramGb?: number): DeviceCompatibility {
  const ram = ramGb ?? getDeviceRAMGb();
  const maxRecommended = getRecommendedMaxBytes(ram);

  if (modelSizeBytes <= maxRecommended) return 'recommended';
  // Allow up to 1.5x recommended as "compatible but slow"
  if (modelSizeBytes <= maxRecommended * 1.5) return 'compatible';
  return 'too-large';
}

/** User-facing label for a compatibility level. */
export function compatibilityLabel(compat: DeviceCompatibility): string {
  switch (compat) {
    case 'recommended': return 'Recommended';
    case 'compatible': return 'May be slow';
    case 'too-large': return 'Too large for device';
  }
}

/** Icon name for compatibility badge. */
export function compatibilityIcon(compat: DeviceCompatibility): string {
  switch (compat) {
    case 'recommended': return 'check-circle';
    case 'compatible': return 'alert-circle-outline';
    case 'too-large': return 'close-circle-outline';
  }
}
