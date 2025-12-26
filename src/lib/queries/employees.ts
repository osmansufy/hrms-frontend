import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  searchManagers,
  updateEmployeeApi,
  assignManager,
  getSubordinates,
  type ApiEmployee,
  type ListEmployeesParams,
  type UpdateEmployeePayload,
  type AssignManagerPayload,
} from "@/lib/api/employees";
import type { Employee } from "@/lib/data/employees";
import { listDepartments } from "@/lib/api/departments";
import { listDesignations } from "@/lib/api/designations";

type ApiEmployeeShape = Pick<
  ApiEmployee,
  | "id"
  | "firstName"
  | "lastName"
  | "personalEmail"
  | "designation"
  | "department"
  | "employmentType"
  | "reportingManager"
  | "phone"
  | "joiningDate"
  | "user"
  | "employeeCode"
  | "reportingManagerId"
  | "departmentId"
  | "designationId"
  | "userId"
>;

const statusLabel = (status?: string): Employee["status"] => {
  if (!status) return "Active";
  const normalized = status.toUpperCase();
  if (normalized.includes("INACTIVE")) return "Inactive";
  if (normalized.includes("LEAVE")) return "On Leave";
  if (normalized.includes("ACTIVE")) return "Active";
  return "Active";
};

const formatEmploymentType = (type?: string | null) =>
  type
    ? type
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
    : "—";

const toEmployee = (
  apiEmp: ApiEmployeeShape & {
    workSchedule?: { id: string; name?: string } | null;
  }
): Employee => ({
  id: apiEmp.id,
  employeeCode: apiEmp.employeeCode,
  name:
    [apiEmp.firstName, apiEmp.lastName].filter(Boolean).join(" ") || "Unknown",
  email: apiEmp.personalEmail || apiEmp.user?.email || "unknown@company.com",
  title: apiEmp.designation?.name || apiEmp.designation?.title || "—",
  department: apiEmp.department?.name || "—",
  location: formatEmploymentType(apiEmp.employmentType),
  status: statusLabel(apiEmp.user?.status),
  manager: apiEmp.reportingManager
    ? `${apiEmp.reportingManager.firstName ?? ""} ${
        apiEmp.reportingManager.lastName ?? ""
      }`.trim()
    : undefined,
  phone: apiEmp.phone || undefined,
  startDate: apiEmp.joiningDate || "",
  userId: apiEmp.userId,
  workSchedule: apiEmp.workSchedule || null,
});

export const employeeKeys = {
  all: ["employees"] as const,
  list: (params?: ListEmployeesParams) =>
    [...employeeKeys.all, "list", params ?? {}] as const,
  detail: (id: string) => [...employeeKeys.all, "detail", id] as const,
  detailRaw: (id: string) => [...employeeKeys.all, "detail-raw", id] as const,
  subordinates: (id: string) =>
    [...employeeKeys.all, "subordinates", id] as const,
};

export function useEmployees(params?: ListEmployeesParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: async () => {
      const data = await listEmployees(params);
      return data.map(toEmployee);
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const data = await getEmployee(id);
      return toEmployee(data);
    },
    enabled: Boolean(id),
  });
}

export function useEmployeeDetail(id: string) {
  return useQuery({
    queryKey: employeeKeys.detailRaw(id),
    queryFn: () => getEmployee(id),
    enabled: Boolean(id),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.list() });
    },
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateEmployeePayload) =>
      updateEmployeeApi(id, payload),
    onSuccess: (data) => {
      if (!data) return;
      queryClient.setQueryData(employeeKeys.detail(id), toEmployee(data));
      queryClient.setQueryData(employeeKeys.detailRaw(id), data);
      queryClient.invalidateQueries({ queryKey: employeeKeys.list() });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.list() });
    },
  });
}

export const optionKeys = {
  departments: ["departments"] as const,
  designations: ["designations"] as const,
  managers: (search?: string) => ["managers", { search }] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: optionKeys.departments,
    queryFn: () => listDepartments(),
  });
}

export function useDesignations() {
  return useQuery({
    queryKey: optionKeys.designations,
    queryFn: () => listDesignations(),
  });
}

export function useManagers(search?: string) {
  return useQuery({
    queryKey: optionKeys.managers(search),
    queryFn: async () => {
      const data = await searchManagers(search);
      return data.map((emp) => ({
        id: emp.id,
        name: [emp.firstName, emp.lastName].filter(Boolean).join(" "),
        employeeCode: emp.employeeCode,
      }));
    },
    staleTime: 30_000,
  });
}

export function useAssignManager(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignManagerPayload) =>
      assignManager(employeeId, payload),
    onSuccess: (data) => {
      if (!data?.employee) return;
      queryClient.setQueryData(
        employeeKeys.detail(employeeId),
        toEmployee(data.employee)
      );
      queryClient.setQueryData(
        employeeKeys.detailRaw(employeeId),
        data.employee
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.list() });
    },
  });
}

export function useEmployeeSubordinates(employeeId?: string) {
  return useQuery({
    queryKey: employeeKeys.subordinates(employeeId || ""),
    queryFn: () => {
      if (!employeeId) throw new Error("Employee ID required");
      return getSubordinates(employeeId);
    },
    enabled: Boolean(employeeId),
  });
}
