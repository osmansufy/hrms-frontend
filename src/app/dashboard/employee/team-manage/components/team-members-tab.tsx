"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useManagerSubordinates } from '@/lib/queries/employees';
import { useSession } from '@/components/auth/session-provider';
import { Eye, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const TeamMembersTab = () => {
    const router = useRouter();
    const { session } = useSession();
    const employeeId = session?.user.employeeId;

    const { data: managerSubordinates, isLoading: isManagerSubordinatesLoading, error: isManagerSubordinatesError } = useManagerSubordinates(employeeId);
    console.log("managerSubordinates", managerSubordinates);
    if (isManagerSubordinatesLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isManagerSubordinatesError && !isManagerSubordinatesLoading && !managerSubordinates) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">
                        No team members found
                    </p>
                </CardContent>
            </Card>
        );
    }

    const handleViewDetails = (employeeId: string) => {
        router.push(`/dashboard/employee/team-manage/${employeeId}`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[150px]">Name</TableHead>
                                <TableHead className="hidden sm:table-cell">Email</TableHead>
                                <TableHead className="hidden md:table-cell">Phone</TableHead>
                                <TableHead className="hidden lg:table-cell">Designation</TableHead>
                                <TableHead className="hidden lg:table-cell">Department</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {managerSubordinates && managerSubordinates.length > 0 ? (
                                managerSubordinates.map((subordinate) => {
                                    const fullName = `${subordinate.firstName} ${subordinate.lastName}`;
                                    return (
                                        <TableRow
                                            key={subordinate.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleViewDetails(subordinate.id)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{fullName}</span>
                                                    <span className="text-xs text-muted-foreground sm:hidden">
                                                        {subordinate.user?.email || "—"}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground md:hidden">
                                                        {subordinate.phone || "—"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">{subordinate.user?.email || "—"}</TableCell>
                                            <TableCell className="hidden md:table-cell">{subordinate.phone || "—"}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{subordinate.designation?.name || subordinate.designation?.title || "—"}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{subordinate.department?.name || "—"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(subordinate.id);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 sm:mr-2" />
                                                    <span className="hidden sm:inline">View Details</span>
                                                    <ArrowRight className="h-4 w-4 ml-1 hidden lg:inline" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        No team members found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export default TeamMembersTab;