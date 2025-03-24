import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PencilIcon, UserCog, Shield, ShieldAlert, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function UserManagement() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case "moderator":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Moderator
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
            <User className="h-3 w-3 mr-1" />
            User
          </Badge>
        );
    }
  };
  
  const getKycLevelBadge = (level: number) => {
    switch (level) {
      case 0:
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Not Verified</Badge>;
      case 1:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">Tier 1</Badge>;
      case 2:
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Tier 2</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };
  
  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Username",
      accessorKey: "username",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Full Name",
      accessorKey: "fullName",
      cell: (user: any) => user.fullName || "-",
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: (user: any) => getRoleBadge(user.role),
    },
    {
      header: "KYC Level",
      accessorKey: "kycLevel",
      cell: (user: any) => getKycLevelBadge(user.kycLevel),
    },
    {
      header: "Created At",
      accessorKey: (user: any) => formatDate(user.createdAt),
    },
    {
      header: "Actions",
      accessorKey: (user: any) => (
        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
          <PencilIcon className="h-4 w-4" />
        </Button>
      ),
    },
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">User Management</h3>
        <div className="flex gap-2">
          <Input 
            placeholder="Search users..." 
            className="max-w-xs" 
          />
          <Button>
            <UserCog className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable
          data={users || []}
          columns={columns}
          searchColumn="username"
        />
      )}
      
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Username</label>
                  <Input defaultValue={selectedUser.username} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input defaultValue={selectedUser.email} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Full Name</label>
                  <Input defaultValue={selectedUser.fullName || ""} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Role</label>
                  <select 
                    className="w-full p-2 rounded-md border border-input bg-background" 
                    defaultValue={selectedUser.role}
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">KYC Level</label>
                  <select 
                    className="w-full p-2 rounded-md border border-input bg-background" 
                    defaultValue={selectedUser.kycLevel}
                  >
                    <option value="0">Not Verified</option>
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                  </select>
                </div>
                <div className="pt-2 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
