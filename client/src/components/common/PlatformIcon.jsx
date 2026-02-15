import { Instagram, Facebook, Linkedin, Twitter, Youtube } from "lucide-react";

const PlatformIcon = ({ platform, className = "h-6 w-6" }) => {
    switch (platform.toLowerCase()) {
        case "instagram":
            return <Instagram className={`${className} text-pink-500`} />;
        case "facebook":
            return <Facebook className={`${className} text-blue-600`} />;
        case "linkedin":
            return <Linkedin className={`${className} text-blue-700`} />;
        case "youtube":
            return <Youtube className={`${className} text-red-600`} />;
        case "x":
        case "twitter":
            return <Twitter className={`${className} text-black dark:text-white`} />;
        default:
            return <div className={`${className} rounded-full bg-gray-200`} />;
    }
};

export default PlatformIcon;
