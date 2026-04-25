import { Facebook, Instagram, Linkedin, Twitter, Youtube, Globe } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";

const PlatformSelector = ({
    accounts,
    selectedAccount,
    onSelect,
    className,
}) => {
    const getPlatformIcon = (platform) => {
        switch (platform?.toLowerCase()) {
            case 'facebook': return <Facebook className="h-4 w-4 text-blue-600" />;
            case 'instagram': return <Instagram className="h-4 w-4 text-pink-600" />;
            case 'linkedin': return <Linkedin className="h-4 w-4 text-blue-700" />;
            case 'youtube': return <Youtube className="h-4 w-4 text-red-600" />;
            case 'twitter': return <Twitter className="h-4 w-4 text-sky-500" />;
            default: return <Globe className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className={className}>
            <Label className="mb-2 block">Select Account</Label>
            <Select value={selectedAccount} onValueChange={onSelect}>
                <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select an account..." />
                </SelectTrigger>
                <SelectContent>
                    {accounts?.map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800 flex items-center justify-center bg-gray-50 shrink-0">
                                    <img 
                                        src={account.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.platformUserName || account.platform)}&background=random&color=fff`} 
                                        alt="" 
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        {getPlatformIcon(account.platform)}
                                        <span className="text-sm font-medium">{account.platformUserName || 'Account'}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground capitalize">{account.platform}</span>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                    {(!accounts || accounts.length === 0) && (
                        <div className="p-4 text-center text-xs text-muted-foreground italic">
                            No accounts found for this group.
                        </div>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
};

export default PlatformSelector;
