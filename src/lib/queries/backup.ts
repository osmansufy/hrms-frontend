import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getBackupStatus,
  triggerBackup,
  listBackups,
  deleteBackup,
  getDownloadUrl,
  restoreBackup,
} from "@/lib/api/backup";

export const backupKeys = {
  status: ["backup", "status"] as const,
  list: ["backup", "list"] as const,
};

/**
 * Hook to fetch backup status
 */
export function useBackupStatus() {
  return useQuery({
    queryKey: backupKeys.status,
    queryFn: getBackupStatus,
    refetchInterval: false, // Manual refresh only
    retry: 1,
  });
}

/**
 * Hook to fetch list of all backups
 */
export function useListBackups() {
  return useQuery({
    queryKey: backupKeys.list,
    queryFn: listBackups,
    refetchInterval: false, // Manual refresh only
    retry: 1,
  });
}

/**
 * Hook to trigger manual backup
 */
export function useTriggerBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerBackup,
    onMutate: () => {
      // Show progress toast
      toast.loading(
        "Creating backup... This may take several minutes for large databases.",
        {
          id: "backup-progress",
          duration: Infinity, // Keep toast visible until completion
        },
      );
    },
    onSuccess: (data) => {
      // Dismiss loading toast
      toast.dismiss("backup-progress");

      queryClient.invalidateQueries({ queryKey: backupKeys.status });
      queryClient.invalidateQueries({ queryKey: backupKeys.list });

      toast.success(`Successfully created backup: ${data.filename}`, {
        duration: 5000,
      });
    },
    onError: (error: any) => {
      // Dismiss loading toast
      toast.dismiss("backup-progress");

      const errorMessage = error.response?.data?.message || error.message;

      if (error.code === "ECONNABORTED" || errorMessage?.includes("timeout")) {
        toast.error(
          "Backup is taking longer than expected. It may still be processing in the background. Please check the backup list in a few minutes.",
          { duration: 8000 },
        );

        // Auto-refresh backup list after 30 seconds to check if backup completed
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: backupKeys.status });
          queryClient.invalidateQueries({ queryKey: backupKeys.list });
          toast.info(
            "Backup list refreshed. Check if your backup has completed.",
            {
              duration: 4000,
            },
          );
        }, 30000);
      } else {
        toast.error(
          errorMessage || "Failed to trigger backup. Please try again.",
          { duration: 5000 },
        );
      }
    },
  });
}

/**
 * Hook to delete a backup
 */
export function useDeleteBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBackup,
    onMutate: () => {
      toast.loading("Deleting backup...", {
        id: "delete-backup",
        duration: Infinity,
      });
    },
    onSuccess: (_, filename) => {
      toast.dismiss("delete-backup");

      queryClient.invalidateQueries({ queryKey: backupKeys.status });
      queryClient.invalidateQueries({ queryKey: backupKeys.list });

      toast.success(`Backup ${filename} deleted successfully`, {
        duration: 4000,
      });
    },
    onError: (error: any, filename) => {
      toast.dismiss("delete-backup");

      toast.error(
        error.response?.data?.message ||
          `Failed to delete backup ${filename}. Please try again.`,
        { duration: 5000 },
      );
    },
  });
}

/**
 * Hook to download a backup file
 */
export function useDownloadBackup() {
  return useMutation({
    mutationFn: async (filename: string) => {
      const url = await getDownloadUrl(filename);

      // Trigger browser download
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return filename;
    },
    onMutate: () => {
      toast.loading("Preparing download...", {
        id: "download-backup",
        duration: Infinity,
      });
    },
    onSuccess: (filename) => {
      toast.dismiss("download-backup");
      toast.success(`Download started for ${filename}`, {
        duration: 4000,
      });
    },
    onError: (error: any) => {
      toast.dismiss("download-backup");
      toast.error(
        error.response?.data?.message ||
          "Failed to download backup. Please try again.",
        { duration: 5000 },
      );
    },
  });
}

/**
 * Hook to restore database from a backup
 * WARNING: This will overwrite the entire database!
 */
export function useRestoreBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreBackup,
    onMutate: () => {
      toast.loading(
        "Restoring database... This may take several minutes. DO NOT close this page or refresh!",
        {
          id: "restore-progress",
          duration: Infinity,
        },
      );
    },
    onSuccess: (_, filename) => {
      toast.dismiss("restore-progress");

      queryClient.invalidateQueries({ queryKey: backupKeys.status });
      queryClient.invalidateQueries({ queryKey: backupKeys.list });

      toast.success(
        `Database successfully restored from ${filename}. Please reload the page.`,
        {
          duration: 10000,
        },
      );

      // Auto-reload after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    },
    onError: (error: any, filename) => {
      toast.dismiss("restore-progress");

      const errorMessage = error.response?.data?.message || error.message;

      if (error.code === "ECONNABORTED" || errorMessage?.includes("timeout")) {
        toast.error(
          "Restore is taking longer than expected. It may still be processing. Please wait a few minutes before checking.",
          { duration: 10000 },
        );
      } else {
        toast.error(
          errorMessage ||
            `Failed to restore backup ${filename}. Please try again.`,
          { duration: 7000 },
        );
      }
    },
  });
}
