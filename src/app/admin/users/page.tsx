'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { columns } from '@/components/columns';
import UserDialog from '@/components/UserDialog';
interface UserData {
  _id: string;
  subs_credentials: {
    user_name: string;
  };
  other_preferences: {
    plan: string;
    plan_expiry: Date;
  };
  devices: string[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.map(user => ({
        ...user,
        plan_expiry: new Date(user.other_preferences.plan_expiry)
      })));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Users</CardTitle>
          <Button onClick={() => setOpenDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            New User
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            searchKey="subs_credentials.user_name"
            onRefresh={fetchUsers}
          />
        </CardContent>
      </Card>

      <UserDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
