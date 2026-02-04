import { apiClient } from "@/lib/api/client";

export type ApiEmployeeUser = {
  id: string;
  name: string;
  email: string;
  status?: string;
  roleAssignments?: Array<{
    role: { code: string; name?: string };
    isPrimary?: boolean;
  }>;
};

export type ApiEmployee = {
  id: string;
  userId: string;
  employeeCode?: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  bloodGroup?: string | null;
  nationality?: string | null;
  personalEmail?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  reportingManagerId?: string | null;
  employmentType?: string | null;
  joiningDate?: string | null;
  confirmationDate?: string | null;
  probationPeriod?: number | null;
  noticePeriod?: number | null;
  workScheduleId?: string | null;
  profilePicture?: string | null;
  notes?: string | null;
  department?: { id: string; name: string; code?: string } | null;
  designation?: {
    id: string;
    title?: string;
    code?: string;
    name?: string;
  } | null;
  reportingManager?: {
    id: string;
    employeeCode?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  workSchedule?: { id: string; name?: string } | null;
  user?: ApiEmployeeUser;
};

export type ListEmployeesParams = Partial<{
  search: string;
  departmentId: string;
  designationId: string;
}>;

export type CreateEmployeePayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  phone: string;
  employmentType:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERN"
    | "TEMPORARY"
    | "CONSULTANT";
  joiningDate: string;
  middleName?: string;
  maritalStatus?: "SINGLE" | "MARRIED";
  bloodGroup?: string;
  nationality?: string;
  personalEmail?: string;
  alternatePhone?: string;
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string | null;
  confirmationDate?: string;
  probationPeriod?: number;
  noticePeriod?: number;
  workScheduleId?: string;
  profilePicture?: string;
  notes?: string;
  address?: {
    type: "CURRENT" | "PERMANENT";
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  department?: string;
  designation?: string;
};

export type UpdateEmployeePayload = Partial<
  Omit<CreateEmployeePayload, "password">
> & {
  employeeCode?: string;
};

export type UpdatePersonalInfoPayload = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  maritalStatus?: "SINGLE" | "MARRIED";
  bloodGroup?: string;
  nationality?: string;
  personalEmail?: string;
  phone?: string;
  alternatePhone?: string;
};

export async function listEmployees(params?: ListEmployeesParams) {
  const response = await apiClient.get<ApiEmployee[]>("/employees", {
    params,
  });
  return response.data;
}

export async function getEmployee(id: string) {
  const response = await apiClient.get<ApiEmployee>(`/employees/${id}`);
  return response.data;
}

export async function createEmployee(payload: CreateEmployeePayload) {
  const response = await apiClient.post<ApiEmployee>("/employees", payload);
  return response.data;
}
export async function bulkCreateEmployees(payload: CreateEmployeePayload[]) {
  const response = await apiClient.post<ApiEmployee[]>(
    "/employees/bulk",
    payload,
  );
  return response.data;
}

export async function updateEmployeeApi(
  id: string,
  payload: UpdateEmployeePayload,
) {
  const response = await apiClient.patch<ApiEmployee>(
    `/employees/${id}`,
    payload,
  );
  return response.data;
}

export async function updatePersonalInfo(
  id: string,
  payload: UpdatePersonalInfoPayload,
) {
  const response = await apiClient.patch<ApiEmployee>(
    `/employees/${id}/personal-info`,
    payload,
  );
  return response.data;
}

export async function deleteEmployee(id: string) {
  const response = await apiClient.delete<{ success: boolean }>(
    `/employees/${id}`,
  );
  return response.data;
}

export type DepartmentDto = { id: string; name: string; code?: string };
export type DesignationDto = {
  id: string;
  title?: string;
  name?: string;
  code?: string;
};

export async function listDepartments() {
  const response = await apiClient.get<DepartmentDto[]>("/departments");
  return response.data;
}

export async function listDesignations() {
  const response = await apiClient.get<DesignationDto[]>("/designations");
  return response.data;
}

export async function searchManagers(search?: string) {
  const response = await apiClient.get<ApiEmployee[]>("/employees", {
    params: search ? { search } : undefined,
  });
  return response.data;
}

// Line Manager Assignment API
export type AssignManagerPayload = {
  reportingManagerId: string | null;
  skipRoleValidation?: boolean;
  requireSameDepartment?: boolean;
};

export type AssignManagerResponse = {
  message: string;
  employee: ApiEmployee;
  previousManager?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
};

export async function assignManager(
  employeeId: string,
  payload: AssignManagerPayload,
) {
  const response = await apiClient.patch<AssignManagerResponse>(
    `/employees/${employeeId}/manager`,
    payload,
  );
  return response.data;
}

export async function getSubordinates(employeeId: string) {
  const response = await apiClient.get<ApiEmployee[]>(
    `/employees/${employeeId}/subordinates`,
  );
  return response.data;
}

// Get the currently authenticated employee's own profile
export async function getMyEmployeeProfile(): Promise<ApiEmployee | null> {
  const response = await apiClient.get<ApiEmployee | null>(`/employees/me`);
  return response.data;
}

// Manager endpoint: Get subordinate employee details (job card)
export async function getSubordinateDetails(subordinateUserId: string) {
  const response = await apiClient.get<ApiEmployee>(
    `/employees/manager/subordinate/${subordinateUserId}`,
  );
  return response.data;
}

// Profile Picture APIs
export type ProfilePictureUploadResponse = {
  message: string;
  profilePicture: string;
  profilePictureUrl: string;
  isPublic: boolean;
  employee: ApiEmployee;
};

export type ProfilePictureUrlResponse = {
  url: string;
  originalUrl: string;
  expiresIn: number | null;
  isPublic: boolean;
  employeeId: string;
  employeeName: string;
};

export async function uploadProfilePicture(
  employeeId: string,
  file: File,
): Promise<ProfilePictureUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<ProfilePictureUploadResponse>(
    `/employees/${employeeId}/profile-picture`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function getProfilePictureUrl(
  employeeId: string,
): Promise<ProfilePictureUrlResponse> {
  const response = await apiClient.get<ProfilePictureUrlResponse>(
    `/employees/${employeeId}/profile-picture-url`,
  );
  return response.data;
}

export async function deleteProfilePicture(
  employeeId: string,
): Promise<{ message: string; employee: ApiEmployee }> {
  const response = await apiClient.delete<{
    message: string;
    employee: ApiEmployee;
  }>(`/employees/${employeeId}/profile-picture`);
  return response.data;
}
