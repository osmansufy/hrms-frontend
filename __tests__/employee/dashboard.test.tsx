import { render, screen } from "@testing-library/react";

import EmployeeDashboard from "@/app/dashboard/employee/page";

describe("EmployeeDashboard", () => {
    it("renders the welcome header", () => {
        render(<EmployeeDashboard />);

        expect(screen.getByText("Welcome")).toBeInTheDocument();
        expect(screen.getByText("Your dashboard")).toBeInTheDocument();
    });

    it("renders all navigation cards", () => {
        render(<EmployeeDashboard />);

        // Card titles
        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("Attendance")).toBeInTheDocument();
        expect(screen.getByText("Leave")).toBeInTheDocument();
        expect(screen.getByText("Directory")).toBeInTheDocument();
    });

    it("renders card descriptions", () => {
        render(<EmployeeDashboard />);

        expect(screen.getByText("View and update your information.")).toBeInTheDocument();
        expect(screen.getByText(/Sign in\/out and view today/)).toBeInTheDocument();
        expect(screen.getByText("Apply for leave and track approvals.")).toBeInTheDocument();
        expect(screen.getByText("Browse colleagues and teams.")).toBeInTheDocument();
    });

    it("renders navigation links with correct hrefs", () => {
        render(<EmployeeDashboard />);

        const profileLink = screen.getByRole("link", { name: /go to profile/i });
        const attendanceLink = screen.getByRole("link", { name: /manage attendance/i });
        const leaveLink = screen.getByRole("link", { name: /request leave/i });
        const directoryLink = screen.getByRole("link", { name: /view directory/i });

        expect(profileLink).toHaveAttribute("href", "/dashboard/employee/profile");
        expect(attendanceLink).toHaveAttribute("href", "/dashboard/employee/attendance");
        expect(leaveLink).toHaveAttribute("href", "/dashboard/employee/leave");
        expect(directoryLink).toHaveAttribute("href", "/dashboard/employee/directory");
    });
});
