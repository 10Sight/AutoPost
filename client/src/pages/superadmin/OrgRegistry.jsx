import React, { useState } from "react";
import { 
    useGetAllOrganizationsQuery, 
    useCreateOrganizationMutation,
    useUpdateOrganizationStatusMutation, 
    useUpdateOrganizationQuotaMutation,
    useImpersonateUserMutation
} from "../../features/superadmin/superadminApi";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "../../components/ui/table";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { 
    Building2, 
    ShieldCheck, 
    ShieldAlert, 
    Settings2, 
    ExternalLink, 
    Loader2, 
    Users, 
    Share2,
    Calendar,
    Search,
    Plus,
    Mail,
    UserCircle
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from "../../components/ui/dialog";

const OrgRegistry = () => {
    const { data: orgs, isLoading, isError } = useGetAllOrganizationsQuery();
    const [createOrg, { isLoading: isCreating }] = useCreateOrganizationMutation();
    const [updateStatus] = useUpdateOrganizationStatusMutation();
    const [updateQuota] = useUpdateOrganizationQuotaMutation();
    const [impersonate] = useImpersonateUserMutation();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [isProvisioningOpen, setIsProvisioningOpen] = useState(false);
    const [provisionForm, setProvisionForm] = useState({ 
        companyName: "", 
        adminName: "", 
        adminEmail: "" 
    });
    const [quotaForm, setQuotaForm] = useState({ 
        maxAccounts: 0, 
        maxPostsPerMonth: 0,
        storageLimitGB: 0 
    });

    const filteredOrgs = orgs?.data?.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleProvision = async () => {
        try {
            await createOrg(provisionForm).unwrap();
            toast.success("Client provisioned and welcome email sent!");
            setIsProvisioningOpen(false);
            setProvisionForm({ companyName: "", adminName: "", adminEmail: "" });
        } catch (err) {
            toast.error(err.data?.message || "Failed to provision client");
        }
    };

    const handleUpdateStatus = async (orgId, currentStatus) => {
        const nextStatus = currentStatus === "active" ? "suspended" : "active";
        try {
            await updateStatus({ orgId, status: nextStatus }).unwrap();
            toast.success(`Organization ${nextStatus === "active" ? "Activated" : "Suspended"}`);
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleOpenQuota = (org) => {
        setSelectedOrg(org);
        setQuotaForm({
            maxAccounts: org.quota?.maxAccounts || 5,
            maxPostsPerMonth: org.quota?.maxPostsPerMonth || 100,
            storageLimitGB: org.quota?.storageLimitGB || 1
        });
    };

    const handleSaveQuota = async () => {
        try {
            await updateQuota({ orgId: selectedOrg._id, quota: quotaForm }).unwrap();
            toast.success("Authority limits updated");
            setSelectedOrg(null);
        } catch (err) {
            toast.error("Failed to update limits");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Organization Registry</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage global authority and quotas for all client tenants.</p>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search companies..." 
                            className="pl-9 h-11 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={() => setIsProvisioningOpen(true)}
                        className="h-11 px-6 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" /> Provision New Client
                    </Button>
                </div>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Client Workspace Inventory
                    </CardTitle>
                    <CardDescription>Direct control over tenant status and resource access.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                            <p className="text-sm text-slate-500 animate-pulse">Accessing registry...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                    <TableHead className="w-[300px]">Organization</TableHead>
                                    <TableHead>Authority Status</TableHead>
                                    <TableHead>Assets / Limit</TableHead>
                                    <TableHead>Posts / Limit</TableHead>
                                    <TableHead>Storage / Limit</TableHead>
                                    <TableHead className="text-right">Management</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrgs.map((org) => (
                                    <TableRow key={org._id} className="group border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <TableCell className="font-semibold py-4">
                                            <div className="flex flex-col">
                                                <span>{org.name}</span>
                                                <span className="text-[10px] font-mono text-slate-400">ID: {org._id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {org.status === "active" ? (
                                                <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1"><ShieldCheck className="w-3 h-3" /> Active</Badge>
                                            ) : (
                                                <Badge variant="destructive" className="gap-1 bg-rose-500 hover:bg-rose-600"><ShieldAlert className="w-3 h-3" /> {org.status}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                {org.stats?.totalAccounts} / <span className="text-primary">{org.quota?.maxAccounts || 5}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                Active / <span className="text-primary">{org.quota?.maxPostsPerMonth || 100}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                {(org.stats?.storageUsed / (1024 * 1024)).toFixed(1)}MB / <span className="text-primary">{org.quota?.storageLimitGB || 1}GB</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="outline" className="h-8 gap-2 border-slate-200 dark:border-slate-700 hover:bg-primary hover:text-white" onClick={() => handleOpenQuota(org)}>
                                                    <Settings2 className="w-3.5 h-3.5" /> Limits
                                                </Button>
                                                <Button size="sm" variant={org.status === "active" ? "destructive" : "secondary"} className="h-8 px-3" onClick={() => handleUpdateStatus(org._id, org.status)}>
                                                    {org.status === "active" ? "Suspend" : "Restore"}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Quota Management Modal */}
            <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
                <DialogContent className="sm:max-w-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-primary" />
                            Manage Authority: {selectedOrg?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Max Social Accounts</label>
                            <Input 
                                type="number" 
                                value={quotaForm.maxAccounts} 
                                onChange={(e) => setQuotaForm(prev => ({ ...prev, maxAccounts: parseInt(e.target.value) }))}
                                className="h-12 text-lg font-bold border-slate-200 dark:border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Post Limit</label>
                            <Input 
                                type="number" 
                                value={quotaForm.maxPostsPerMonth} 
                                onChange={(e) => setQuotaForm(prev => ({ ...prev, maxPostsPerMonth: parseInt(e.target.value) }))}
                                className="h-12 text-lg font-bold border-slate-200 dark:border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Storage Limit (GB)</label>
                            <Input 
                                type="number" 
                                step="0.1"
                                value={quotaForm.storageLimitGB} 
                                onChange={(e) => setQuotaForm(prev => ({ ...prev, storageLimitGB: parseFloat(e.target.value) }))}
                                className="h-12 text-lg font-bold border-slate-200 dark:border-slate-800"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="rounded-xl" onClick={() => setSelectedOrg(null)}>Cancel</Button>
                        <Button className="h-11 px-8 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleSaveQuota}>Apply Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Provisioning Modal */}
            <Dialog open={isProvisioningOpen} onOpenChange={setIsProvisioningOpen}>
                <DialogContent className="sm:max-w-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-primary"></div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                            Provision New Client
                        </DialogTitle>
                        <DialogDescription>
                            Create a fresh workspace and invite the primary administrator.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-5 py-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Building2 className="w-3 h-3" /> Company Name
                            </label>
                            <Input 
                                placeholder="Acme Corp" 
                                value={provisionForm.companyName}
                                onChange={(e) => setProvisionForm(prev => ({ ...prev, companyName: e.target.value }))}
                                className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <UserCircle className="w-3 h-3" /> Admin Name
                                </label>
                                <Input 
                                    placeholder="John Doe" 
                                    value={provisionForm.adminName}
                                    onChange={(e) => setProvisionForm(prev => ({ ...prev, adminName: e.target.value }))}
                                    className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> Admin Email
                                </label>
                                <Input 
                                    placeholder="john@acme.com" 
                                    value={provisionForm.adminEmail}
                                    onChange={(e) => setProvisionForm(prev => ({ ...prev, adminEmail: e.target.value }))}
                                    className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                                <strong>Note:</strong> A temporary password will be generated and sent directly to the client along with their workspace login link.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsProvisioningOpen(false)}
                            className="rounded-xl h-12 px-6"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleProvision}
                            disabled={isCreating}
                            className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20 min-w-[140px]"
                        >
                            {isCreating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Launch Workspace"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OrgRegistry;
