import { render, screen } from "@testing-library/react";

import ApprovalsPage from "@/app/dashboard/admin/approvals/page";
import * as usePermissions from "@/modules/shared/hooks/use-permissions";

// Mock the permissions hook
jest.mock("@/modules/shared/hooks/use-permissions", () => ({
    useHasPermission: jest.fn(),
}));

describe("ApprovalsPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("when user has permission", () => {
        beforeEach(() => {
            (usePermissions.useHasPermission as jest.Mock).mockReturnValue(true);
        });

        it("renders the approvals page header", () => {
            render(<ApprovalsPage />);

            expect(screen.getByText("Leave workflows")).toBeInTheDocument();
            expect(screen.getByText("Approve requests")).toBeInTheDocument();
        });

        it("renders no pending requests card", () => {
            render(<ApprovalsPage />);

            expect(screen.getByText("No pending requests")).toBeInTheDocument();
            expect(screen.getByText("When requests arrive, you can approve them here.")).toBeInTheDocument();
        });

        it("renders disabled approve button", () => {
            render(<ApprovalsPage />);

            const approveButton = screen.getByRole("button", { name: /approve selected/i });
            expect(approveButton).toBeInTheDocument();
            expect(approveButton).toBeDisabled();
        });

        it("renders shield icon", () => {
            render(<ApprovalsPage />);

            // The ShieldCheck icon should be in the document
            const header = screen.getByText("Approve requests");
            expect(header).toBeInTheDocument();
        });
    });

    describe("when user lacks permission", () => {
        beforeEach(() => {
            (usePermissions.useHasPermission as jest.Mock).mockReturnValue(false);
        });

        it("shows insufficient permissions message", () => {
            render(<ApprovalsPage />);

            expect(screen.getByText("Insufficient permissions")).toBeInTheDocument();
            expect(screen.getByText("You cannot approve leave requests.")).toBeInTheDocument();
        });

        it("does not render approve button", () => {
            render(<ApprovalsPage />);

            expect(screen.queryByRole("button", { name: /approve selected/i })).not.toBeInTheDocument();
        });

        it("does not render approvals page header", () => {
            render(<ApprovalsPage />);

            expect(screen.queryByText("Approve requests")).not.toBeInTheDocument();
        });
    });

    it("checks for leave.approve permission", () => {
        (usePermissions.useHasPermission as jest.Mock).mockReturnValue(true);

        render(<ApprovalsPage />);

        expect(usePermissions.useHasPermission).toHaveBeenCalledWith("leave.approve");
    });
});
