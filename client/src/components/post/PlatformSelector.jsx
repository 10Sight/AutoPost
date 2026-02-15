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
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an account..." />
                </SelectTrigger>
                <SelectContent>
                    {accounts?.map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                            <div className="flex items-center gap-2">
                                {getPlatformIcon(account.platform)}
                                <span>{account.platform} - {account.platformUserName}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default PlatformSelector;
