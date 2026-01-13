import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSystemSettings,
  updateSystemSettings,
  rebuildEmployeeCodes,
  type SystemSettings,
  type UpdateSystemSettingsPayload,
} from "@/lib/api/system-settings";
import { toast } from "sonner";

export const systemSettingsKeys = {
  all: ["system-settings"] as const,
  current: () => [...systemSettingsKeys.all, "current"] as const,
};

export function useSystemSettings() {
  return useQuery({
    queryKey: systemSettingsKeys.current(),
    queryFn: getSystemSettings,
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSystemSettingsPayload) =>
      updateSystemSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: systemSettingsKeys.current(),
      });
      toast.success("System settings updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update system settings"
      );
    },
  });
}

export function useRebuildEmployeeCodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rebuildEmployeeCodes,
    onSuccess: (data) => {
      toast.success(
        `Successfully updated employee codes for ${data.updated} employees.`
      );
      // Refresh settings in case anything changed
      queryClient.invalidateQueries({
        queryKey: systemSettingsKeys.current(),
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to rebuild employee codes. Please check the logs."
      );
    },
  });
}
