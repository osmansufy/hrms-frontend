import { apiClient } from "./client";

export interface BackupStatus {
  enabled: boolean;
  retentionDays: number;
  backupCount: number;
  latestBackup?: {
    filename: string;
    date: string;
    size: number;
  };
  totalSize: number;
  totalSizeMB: string;
}

export interface TriggerBackupResponse {
  filename: string;
  size: number;
  duration: number;
}

export interface BackupFile {
  filename: string;
  date: string;
  size: number;
  sizeMB: string;
}

/**
 * Get current backup status
 */
export async function getBackupStatus(): Promise<BackupStatus> {
  const response = await apiClient.get<{
    statusCode: number;
    data: BackupStatus;
  }>("/backup/status");
  return response.data.data;
}

/**
 * Trigger a manual database backup
 * Note: This operation may take several minutes for large databases
 */
export async function triggerBackup(): Promise<TriggerBackupResponse> {
  const response = await apiClient.post<{
    statusCode: number;
    data: TriggerBackupResponse;
  }>(
    "/backup/trigger",
    {},
    {
      timeout: 300000, // 5 minutes timeout for large backups
    },
  );
  return response.data.data;
}

/**
 * Get list of all backup files
 */
export async function listBackups(): Promise<BackupFile[]> {
  const response = await apiClient.get<{
    statusCode: number;
    data: BackupFile[];
  }>("/backup/list", {
    timeout: 60000, // 1 minute timeout for listing
  });
  return response.data.data;
}

/**
 * Delete a specific backup file
 */
export async function deleteBackup(filename: string): Promise<void> {
  await apiClient.delete(`/backup/${filename}`, {
    timeout: 60000, // 1 minute timeout for delete
  });
}

/**
 * Get presigned download URL for a backup file
 */
export async function getDownloadUrl(filename: string): Promise<string> {
  const response = await apiClient.get<{
    statusCode: number;
    data: { url: string; expiresIn: number };
  }>(`/backup/download/${filename}`);
  return response.data.data.url;
}

/**
 * Restore database from a backup file
 * WARNING: This will overwrite the current database!
 */
export async function restoreBackup(filename: string): Promise<void> {
  await apiClient.post(
    `/backup/restore/${filename}`,
    {},
    {
      timeout: 600000, // 10 minutes timeout for restore operations
    },
  );
}
