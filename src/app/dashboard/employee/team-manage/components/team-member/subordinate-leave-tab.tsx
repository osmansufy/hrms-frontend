import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubordinateLeaveBalances } from './subordinate-leave-balances';
import { SubordinateLeaveRecordsTab } from './subordinate-leave-records-tab';
import { SubordinateLedgerHistory } from './subordinate-ledger-history';
import { FileText, Wallet, History } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    const SubordinateLeaveTab = ({ userId }: { userId: string }) => {
    return (
        <div>
            {/* Member Leave Details */}
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Member Leave Details</CardTitle>
                    <CardDescription>View the leave details for the selected employee.</CardDescription>
                </CardHeader>
            </Card>
            {/* Tabs */}
            <Tabs defaultValue="balances">
                <TabsList className="grid w-full grid-cols-3"       >
                    <TabsTrigger value="balances" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Balances
                    </TabsTrigger>
                    <TabsTrigger value="records" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Records
                    </TabsTrigger>
                    <TabsTrigger value="ledger" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Ledger</TabsTrigger>
                </TabsList>
                <TabsContent value="balances">
                    <SubordinateLeaveBalances userId={userId || ""} />
                </TabsContent>
                <TabsContent value="records">
                    <SubordinateLeaveRecordsTab userId={userId} />
                </TabsContent>
                <TabsContent value="ledger">
                    <SubordinateLedgerHistory userId={userId || ""} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SubordinateLeaveTab;