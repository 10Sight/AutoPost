import React, { useState } from 'react';
import {
    Users,
    Settings,
    Shield,
    Plus,
    MoreHorizontal,
    Mail,
    CheckCircle2,
    Clock,
    X,
    Loader2
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { useGetAllUsersQuery, useCreateUserMutation } from "../features/auth/authApi";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";

const TeamSettings = () => {
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const { data: usersData, isLoading, isError } = useGetAllUsersQuery();
    const members = usersData?.data || [];

    const [selectedRole, setSelectedRole] = useState('user');
    const [createUser, { isLoading: isCreating }] = useCreateUserMutation();

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            await createUser({ ...data, role: selectedRole }).unwrap();
            setIsInviteOpen(false);
            toast.success("User created successfully");
        } catch (error) {
            console.error("Failed to create user:", error);
            toast.error(error?.data?.message || "Failed to create user");
        }
    };

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Team & Workspace</h2>
                    <p className="text-muted-foreground">Manage your team members and their permissions.</p>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                            <Plus className="mr-2 h-4 w-4" /> Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Team Member</DialogTitle>
                            <DialogDescription>
                                Create a new user account with specific role access.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                                    <Input id="firstName" name="firstName" placeholder="John" required />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                                    <Input id="lastName" name="lastName" placeholder="Doe" required />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="email" className="text-sm font-medium">Email address</label>
                                <Input id="email" name="email" placeholder="colleague@company.com" type="email" required />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="password" className="text-sm font-medium">Password</label>
                                <Input id="password" name="password" type="password" placeholder="••••••••" required />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Role</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['user', 'creator', 'reviewer', 'publisher', 'admin'].map((role) => (
                                        <div
                                            key={role}
                                            className={`border rounded-md p-3 cursor-pointer transition-all ${selectedRole === role
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                            onClick={() => setSelectedRole(role)}
                                        >
                                            <div className="font-semibold text-sm capitalize">{role}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {role === 'admin' && "Full access"}
                                                {role === 'creator' && "Can create drafts"}
                                                {role === 'reviewer' && "Can approve posts"}
                                                {role === 'publisher' && "Can schedule posts"}
                                                {role === 'user' && "Standard access"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Account"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Team Members
                        </CardTitle>
                        <CardDescription>
                            People with access to this workspace.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {isLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading team members...</div>
                            ) : isError ? (
                                <div className="text-center py-8 text-destructive">Failed to load team members.</div>
                            ) : (
                                members.map((member) => (
                                    <div key={member._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} />
                                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium leading-none">{member.name}</p>
                                                <p className="text-sm text-muted-foreground">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                                                </Badge>
                                                <Badge variant="outline" className="capitalize">{member.role}</Badge>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600">Remove Member</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-500" />
                                Permissions Overview
                            </CardTitle>
                            <CardDescription>
                                Role-based access control settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Admins</span>
                                    <span className="text-muted-foreground">Full System Access</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 w-full"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Publishers</span>
                                    <span className="text-muted-foreground">Schedule & Publish Content</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[80%]"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Reviewers</span>
                                    <span className="text-muted-foreground">Approve & Reject Drafts</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 w-[60%]"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Creators</span>
                                    <span className="text-muted-foreground">Create & Edit Drafts</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-300 w-[40%]"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Users</span>
                                    <span className="text-muted-foreground">View Only Access</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-200 w-[20%]"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-none">
                        <CardHeader>
                            <CardTitle className="text-indigo-900 dark:text-indigo-100">Upgrade Plan</CardTitle>
                            <CardDescription className="text-indigo-700 dark:text-indigo-300">
                                Need more seats? Upgrade to Pro.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                View Plans
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TeamSettings;
