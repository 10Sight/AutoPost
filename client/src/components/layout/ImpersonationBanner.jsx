import React from "react";
import { useSelector } from "react-redux";
import { selectIsImpersonated, selectCurrentUser } from "../../features/auth/authSlice";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useLogoutMutation } from "../../features/auth/authApi";
import { useNavigate } from "react-router-dom";

const ImpersonationBanner = () => {
    const isImpersonated = useSelector(selectIsImpersonated);
    const user = useSelector(selectCurrentUser);
    const [logout] = useLogoutMutation();
    const navigate = useNavigate();

    if (!isImpersonated) return null;

    const handleExit = async () => {
        try {
            await logout().unwrap();
            // In a real production app, we might want to revert back to the superadmin token
            // instead of just logging out, but simple logout is safer for Phase 1.
            navigate("/auth/login");
        } catch (err) {
            console.error("Failed to exit impersonation", err);
        }
    };

    return (
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 text-white py-2 px-4 shadow-2xl relative z-[100] animate-in slide-in-from-top duration-500">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-1 rounded-lg animate-pulse">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                    <p className="text-xs md:text-sm font-bold tracking-tight">
                        <span className="opacity-80">IMPERSONATION MODE:</span> viewing workspace as <span className="underline decoration-white/30 underline-offset-4">{user?.email}</span>
                    </p>
                </div>
                
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleExit}
                    className="h-7 px-3 bg-white/10 hover:bg-white/20 text-white border-none rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    <LogOut className="w-3 h-3 mr-2" />
                    Exit Delegation
                </Button>
            </div>
        </div>
    );
};

export default ImpersonationBanner;
