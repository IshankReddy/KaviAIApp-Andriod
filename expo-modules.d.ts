/** Type declarations for Expo subpaths / packages that TS may not resolve. */
declare module 'expo-file-system/legacy' {
  export interface DownloadProgressData {
    totalBytesWritten: number;
    totalBytesExpectedToWrite: number;
  }
  export interface DownloadResumable {
    downloadAsync(): Promise<{ uri: string } | undefined>;
    pauseAsync(): Promise<{ fileUri: string; options: unknown }>;
    resumeAsync(): Promise<{ uri: string } | undefined>;
    savable(): Promise<{ fileUri: string; options: unknown }>;
  }
  export const documentDirectory: string | null;
  export function getInfoAsync(
    path: string,
    options?: { size?: boolean }
  ): Promise<{ exists: boolean; size?: number }>;
  export function makeDirectoryAsync(path: string, options?: { intermediates?: boolean }): Promise<void>;
  export function readDirectoryAsync(path: string): Promise<string[]>;
  export function deleteAsync(path: string): Promise<void>;
  export function createDownloadResumable(
    uri: string,
    fileUri: string,
    options?: { headers?: Record<string, string> },
    callback?: (progress: DownloadProgressData) => void
  ): DownloadResumable;
}

declare module 'expo-constants' {
  export enum ExecutionEnvironment {
    StoreClient = 'storeClient',
    Bare = 'bare',
    Standalone = 'standalone',
  }
  const Constants: {
    executionEnvironment: ExecutionEnvironment;
    [key: string]: unknown;
  };
  export default Constants;
}
