"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, Search, ArrowUpDown, Edit, Trash2 } from "lucide-react";
import { API_ENDPOINTS } from "@/config/endpoints";

interface User {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin" | "developer";
  apiCredits: number;
  status: "active" | "inactive" | "suspended";
  subscriptionPlan:
    | "business"
    | "conglomerate"
    | "conglomerate-pro"
    | "enterprise"
    | "none";
  lastLogin: string;
  createdAt: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<keyof User>("username");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newUser, setNewUser] = useState<Omit<User, "id" | "lastLogin" | "createdAt">>({
    username: "",
    email: "",
    role: "user",
    apiCredits: 0,
    status: "active",
    subscriptionPlan: "none",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.USERS);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: keyof User) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedAndFilteredUsers = useMemo(() => {
    let filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.subscriptionPlan.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (sortKey) {
      filtered = filtered.sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }
    return filtered;
  }, [users, searchTerm, sortKey, sortDirection]);

  const openCreateDialog = () => {
    setEditingUser(null);
    setNewUser({
      username: "",
      email: "",
      role: "user",
      apiCredits: 0,
      status: "active",
      subscriptionPlan: "none",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setNewUser({
      username: user.username,
      email: user.email,
      role: user.role,
      apiCredits: user.apiCredits,
      status: user.status,
      subscriptionPlan: user.subscriptionPlan,
    });
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      const method = editingUser ? "PUT" : "POST";
      const url = editingUser
        ? `${API_ENDPOINTS.ADMIN.USERS}?id=${editingUser.id}`
        : API_ENDPOINTS.ADMIN.USERS;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) throw new Error(`Failed to ${editingUser ? "update" : "create"} user`);

      toast({
        title: "Success",
        description: `User ${editingUser ? "updated" : "created"} successfully.`,
      });
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description: `Failed to ${editingUser ? "update" : "create"} user.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");

      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant='default' className='bg-green-100 text-green-800'>
            Active
          </Badge>
        );
      case "inactive":
        return <Badge variant='secondary'>Inactive</Badge>;
      case "suspended":
        return <Badge variant='destructive'>Suspended</Badge>;
      default:
        return <Badge variant='outline'>Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant='default' className='bg-red-100 text-red-800'>
            Admin
          </Badge>
        );
      case "developer":
        return (
          <Badge variant='default' className='bg-blue-100 text-blue-800'>
            Developer
          </Badge>
        );
      case "user":
        return <Badge variant='outline'>User</Badge>;
      default:
        return <Badge variant='outline'>Unknown</Badge>;
    }
  };

  const getSubscriptionBadge = (plan: User["subscriptionPlan"]) => {
    switch (plan) {
      case "business":
        return (
          <Badge variant='default' className='bg-purple-100 text-purple-800'>
            Business
          </Badge>
        );
      case "conglomerate":
        return (
          <Badge variant='default' className='bg-blue-100 text-blue-800'>
            Conglomerate
          </Badge>
        );
      case "conglomerate-pro":
        return (
          <Badge variant='default' className='bg-orange-100 text-orange-800'>
            Conglomerate Pro
          </Badge>
        );
      case "enterprise":
        return (
          <Badge variant='default' className='bg-gray-100 text-gray-800'>
            Enterprise
          </Badge>
        );
      case "none":
        return <Badge variant='outline'>No Plan</Badge>;
      default:
        return <Badge variant='outline'>Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
        <div className='relative w-full md:w-1/2'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='Search users by username, email, role, or subscription plan...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-9'
          />
        </div>
        <Button onClick={openCreateDialog} className='w-full md:w-auto'>
          <PlusCircle className='mr-2 h-4 w-4' /> Create New User
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className='cursor-pointer'
                onClick={() => handleSort("username")}
              >
                Username
                <ArrowUpDown
                  className={cn(
                    "ml-2 inline-block h-4 w-4",
                    sortKey === "username" && "text-primary",
                  )}
                />
              </TableHead>
              <TableHead className='cursor-pointer' onClick={() => handleSort("email")}>
                Email
                <ArrowUpDown
                  className={cn(
                    "ml-2 inline-block h-4 w-4",
                    sortKey === "email" && "text-primary",
                  )}
                />
              </TableHead>
              <TableHead className='cursor-pointer' onClick={() => handleSort("role")}>
                Role
                <ArrowUpDown
                  className={cn(
                    "ml-2 inline-block h-4 w-4",
                    sortKey === "role" && "text-primary",
                  )}
                />
              </TableHead>
              <TableHead className='cursor-pointer' onClick={() => handleSort("status")}>
                Status
                <ArrowUpDown
                  className={cn(
                    "ml-2 inline-block h-4 w-4",
                    sortKey === "status" && "text-primary",
                  )}
                />
              </TableHead>
              <TableHead
                className='cursor-pointer'
                onClick={() => handleSort("apiCredits")}
              >
                API Credits
                <ArrowUpDown
                  className={cn(
                    "ml-2 inline-block h-4 w-4",
                    sortKey === "apiCredits" && "text-primary",
                  )}
                />
              </TableHead>
              <TableHead
                className='cursor-pointer'
                onClick={() => handleSort("subscriptionPlan")}
              >
                Subscription Plan
                <ArrowUpDown
                  className={cn(
                    "ml-2 inline-block h-4 w-4",
                    sortKey === "subscriptionPlan" && "text-primary",
                  )}
                />
              </TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredUsers.length > 0 ? (
              sortedAndFilteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className='font-medium'>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{user.apiCredits.toLocaleString()}</TableCell>
                  <TableCell>{getSubscriptionBadge(user.subscriptionPlan)}</TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end space-x-2'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => openEditDialog(user)}
                        className='h-8 w-8'
                      >
                        <Edit className='h-4 w-4' />
                        <span className='sr-only'>Edit user</span>
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleDeleteUser(user.id)}
                        className='h-8 w-8 text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                        <span className='sr-only'>Delete user</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className='h-24 text-center text-muted-foreground'>
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='username' className='text-right'>
                Username
              </Label>
              <Input
                id='username'
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='email' className='text-right'>
                Email
              </Label>
              <Input
                id='email'
                type='email'
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='role' className='text-right'>
                Role
              </Label>
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({
                    ...newUser,
                    role: value as "user" | "admin" | "developer",
                  })
                }
              >
                <SelectTrigger id='role' className='col-span-3'>
                  <SelectValue placeholder='Select a role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='user'>User</SelectItem>
                  <SelectItem value='developer'>Developer</SelectItem>
                  <SelectItem value='admin'>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='status' className='text-right'>
                Status
              </Label>
              <Select
                value={newUser.status}
                onValueChange={(value) =>
                  setNewUser({
                    ...newUser,
                    status: value as "active" | "inactive" | "suspended",
                  })
                }
              >
                <SelectTrigger id='status' className='col-span-3'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='suspended'>Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='apiCredits' className='text-right'>
                API Credits
              </Label>
              <Input
                id='apiCredits'
                type='number'
                value={newUser.apiCredits}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    apiCredits: Number.parseInt(e.target.value) || 0,
                  })
                }
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='subscriptionPlan' className='text-right'>
                Subscription Plan
              </Label>
              <Select
                value={newUser.subscriptionPlan}
                onValueChange={(value) =>
                  setNewUser({
                    ...newUser,
                    subscriptionPlan: value as User["subscriptionPlan"],
                  })
                }
              >
                <SelectTrigger id='subscriptionPlan' className='col-span-3'>
                  <SelectValue placeholder='Select subscription plan' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>No Plan</SelectItem>
                  <SelectItem value='business'>Business ($99/month)</SelectItem>
                  <SelectItem value='conglomerate'>Conglomerate ($299/month)</SelectItem>
                  <SelectItem value='conglomerate-pro'>
                    Conglomerate Pro ($599/month)
                  </SelectItem>
                  <SelectItem value='enterprise'>Enterprise (Custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              {editingUser ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
