import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { useManagerSubordinates } from '@/lib/queries/employees';
import { useSession } from '@/components/auth/session-provider';

export const TeamMembersTab = () => {
    const { session } = useSession();
    const userId = session?.user.id;
    const { data: managerSubordinates, isLoading: isManagerSubordinatesLoading, error: isManagerSubordinatesError } = useManagerSubordinates(userId);
    if (isManagerSubordinatesError && !isManagerSubordinatesLoading && !managerSubordinates) {
        return (
            <div>
                <h1>No team members found</h1>
            </div>
        )
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Department</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {managerSubordinates && managerSubordinates.length > 0 && managerSubordinates.map((subordinate) => (
                            <TableRow key={subordinate.id}>
                                <TableCell>{subordinate.firstName} {subordinate.lastName}</TableCell>
                                <TableCell>{subordinate.user?.email || "—"}</TableCell>
                                <TableCell>{subordinate.phone || "—"}</TableCell>
                                <TableCell>{subordinate.designation?.name || subordinate.designation?.title || "—"}</TableCell>
                                <TableCell>{subordinate.department?.name || "—"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default TeamMembersTab;