import React from "react";
import { ShieldAlert, LogOut, Mail, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { useLogoutMutation } from "../../features/auth/authApi";
import { useNavigate } from "react-router-dom";

const SuspendedScreen = ({ status = "suspended" }) => {
    const [logout] = useLogoutMutation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout().unwrap();
        navigate("/auth/login");
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="max-w-md w-full p-8 mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500 animate-pulse"></div>
                
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-950/30 ring-8 ring-rose-500/10 animate-bounce">
                        <ShieldAlert className="w-12 h-12 text-rose-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                            Workspace {status === "suspended" ? "Suspended" : "Restricted"}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            Your organization's access to the 10Sight platform has been 
                            <span className="text-rose-500 font-bold mx-1 capitalize">{status}</span> 
                            by a system administrator.
                        </p>
                    </div>

                    <div className="w-full space-y-3 pt-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-left">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Common reasons:</h4>
                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-medium">
                                <li className="flex items-center gap-2">• Subscription plan expiration</li>
                                <li className="flex items-center gap-2">• Policy compliance violation</li>
                                <li className="flex items-center gap-2">• Scheduled system maintenance</li>
                            </ul>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full pt-4">
                        <Button 
                            variant="outline" 
                            className="rounded-2xl h-12 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold gap-2"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </Button>
                        <Button 
                            className="rounded-2xl h-12 bg-slate-900 dark:bg-white dark:text-slate-900 font-bold gap-2 shadow-xl hover:scale-105 transition-transform"
                            asChild
                        >
                            <a href="mailto:support@10sight.ai">
                                <Mail className="w-4 h-4" /> Support
                            </a>
                        </Button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium">
                        Platform Authority: 10Sight Control Plane v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SuspendedScreen;
