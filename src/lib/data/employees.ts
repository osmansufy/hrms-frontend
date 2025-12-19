export type Employee = {
  id: string;
  employeeCode?: string;
  name: string;
  email: string;
  title: string;
  department: string;
  location: string;
  status: "Active" | "On Leave" | "Inactive";
  manager?: string;
  phone?: string;
  startDate: string;
  userId?: string;
};

export const employees: Employee[] = [
  {
    id: "emp-001",
    name: "Ava Thompson",
    email: "ava.thompson@acme.com",
    title: "People Operations Manager",
    department: "HR",
    location: "New York, NY",
    status: "Active",
    manager: "COO",
    phone: "+1 (917) 555-0112",
    startDate: "2021-04-15",
  },
  {
    id: "emp-002",
    name: "Liam Chen",
    email: "liam.chen@acme.com",
    title: "Recruiting Lead",
    department: "Talent",
    location: "Remote - US",
    status: "Active",
    manager: "Ava Thompson",
    phone: "+1 (425) 555-2291",
    startDate: "2022-02-01",
  },
  {
    id: "emp-003",
    name: "Sofia Martinez",
    email: "sofia.martinez@acme.com",
    title: "HR Business Partner",
    department: "HR",
    location: "Austin, TX",
    status: "On Leave",
    manager: "COO",
    phone: "+1 (737) 555-8891",
    startDate: "2020-10-10",
  },
  {
    id: "emp-004",
    name: "Noah Patel",
    email: "noah.patel@acme.com",
    title: "People Analyst",
    department: "People Analytics",
    location: "Toronto, CA",
    status: "Active",
    manager: "Ava Thompson",
    phone: "+1 (647) 555-4432",
    startDate: "2023-06-20",
  },
  {
    id: "emp-005",
    name: "Maya Singh",
    email: "maya.singh@acme.com",
    title: "Learning & Development Lead",
    department: "L&D",
    location: "London, UK",
    status: "Active",
    manager: "COO",
    phone: "+44 20 7946 0341",
    startDate: "2019-01-05",
  },
  {
    id: "emp-006",
    name: "Ethan Johnson",
    email: "ethan.johnson@acme.com",
    title: "HR Coordinator",
    department: "HR",
    location: "Chicago, IL",
    status: "Active",
    manager: "Ava Thompson",
    phone: "+1 (312) 555-1178",
    startDate: "2024-03-12",
  },
  {
    id: "emp-007",
    name: "Zara Ali",
    email: "zara.ali@acme.com",
    title: "Compensation Specialist",
    department: "Total Rewards",
    location: "Remote - EU",
    status: "Active",
    manager: "COO",
    phone: "+45 32 66 12 10",
    startDate: "2022-08-30",
  },
  {
    id: "emp-008",
    name: "Miles Carter",
    email: "miles.carter@acme.com",
    title: "HRIS Administrator",
    department: "Systems",
    location: "Remote - US",
    status: "Inactive",
    manager: "COO",
    phone: "+1 (206) 555-7766",
    startDate: "2018-11-18",
  },
];

export const employeesMap = new Map(
  employees.map((employee) => [employee.id, employee])
);
