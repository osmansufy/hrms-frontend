import { render, screen } from "@testing-library/react";

import { DashboardOverview } from "@/app/dashboard/admin/page";

// Mock recharts to avoid rendering issues in tests
jest.mock("recharts", () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
}));

// Mock employees data
jest.mock("@/lib/data/employees", () => ({
    employees: [
        { id: "1", name: "John Doe", department: "Engineering", status: "Active" },
        { id: "2", name: "Jane Smith", department: "Engineering", status: "Active" },
        { id: "3", name: "Bob Wilson", department: "HR", status: "On Leave" },
        { id: "4", name: "Alice Brown", department: "Design", status: "Active" },
        { id: "5", name: "Charlie Davis", department: "Design", status: "Inactive" },
    ],
}));

describe("DashboardOverview", () => {
    it("renders the welcome header", () => {
        render(<DashboardOverview />);

        expect(screen.getByText("Welcome back")).toBeInTheDocument();
        expect(screen.getByText("People overview")).toBeInTheDocument();
    });

    it("renders mock data badge", () => {
        render(<DashboardOverview />);

        expect(screen.getByText("Mock data — ready for backend wiring")).toBeInTheDocument();
    });

    it("renders headcount metric card", () => {
        render(<DashboardOverview />);

        expect(screen.getByText("Headcount")).toBeInTheDocument();
        expect(screen.getByText("Total employees")).toBeInTheDocument();
    });

    it("renders active employees metric card", () => {
        render(<DashboardOverview />);

        // "Active" appears multiple times (card title + status badges), use getAllByText
        const activeElements = screen.getAllByText("Active");
        expect(activeElements.length).toBeGreaterThan(0);
        expect(screen.getByText("Currently active")).toBeInTheDocument();
    });

    it("renders on leave metric card", () => {
        render(<DashboardOverview />);

        expect(screen.getByText("On leave")).toBeInTheDocument();
        expect(screen.getByText("Leave this month")).toBeInTheDocument();
    });

    it("renders teams metric card", () => {
        render(<DashboardOverview />);

        expect(screen.getByText("Teams")).toBeInTheDocument();
        expect(screen.getByText("Departments represented")).toBeInTheDocument();
    });

    it("renders workforce by department chart section", () => {
        render(<DashboardOverview />);

        expect(screen.getByText("Workforce by department")).toBeInTheDocument();
        expect(screen.getByText("Active vs on-leave by department")).toBeInTheDocument();
    });

    it("renders the bar chart", () => {
        render(<DashboardOverview />);

        expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("renders recent activity section", () => {
        render(<DashboardOverview />);

        expect(screen.getByText("Recent activity")).toBeInTheDocument();
        expect(screen.getByText("Latest people moves")).toBeInTheDocument();
    });
});
