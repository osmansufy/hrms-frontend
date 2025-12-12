import { employees, employeesMap, type Employee } from "@/lib/data/employees";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type EmployeeUpdate = Partial<
  Pick<
    Employee,
    "title" | "department" | "location" | "status" | "manager" | "phone"
  >
>;

export async function fetchEmployees(search?: string) {
  await delay(250);
  if (!search) return employees;

  const lowered = search.toLowerCase();
  return employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(lowered) ||
      emp.email.toLowerCase().includes(lowered) ||
      emp.department.toLowerCase().includes(lowered)
  );
}

export async function fetchEmployee(id: string) {
  await delay(150);
  return employeesMap.get(id) ?? null;
}

export async function updateEmployee(id: string, patch: EmployeeUpdate) {
  await delay(200);
  const current = employeesMap.get(id);
  if (!current) return null;
  const updated = { ...current, ...patch };
  employeesMap.set(id, updated);
  return updated;
}
