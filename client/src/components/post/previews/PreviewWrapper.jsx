import React from "react";
import { Youtube, Globe } from "lucide-react";

export const MobileMockup = ({ children, platform }) => {
    return (
        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[680px] w-[310px] shadow-xl ring-1 ring-gray-900/5 transition-all duration-500">
            {/* Notch Area */}
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-30"></div>
            
            {/* Status Bar Mock */}
            <div className="absolute top-[10px] left-0 right-0 px-6 flex justify-between items-center z-20 text-[10px] font-bold dark:text-white pointer-events-none">
                <span>9:41</span>
                <div className="flex gap-1 items-center">
                    <div className="w-3 h-2 border border-current rounded-[2px]" />
                    <div className="w-2.5 h-2.5 bg-current rounded-full opacity-80" />
                </div>
            </div>

            {/* Physical Buttons */}
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>

            {/* Screen Content */}
            <div className="rounded-[2.2rem] overflow-hidden w-full h-full bg-white dark:bg-gray-950 flex flex-col relative pt-[30px] pb-[10px]">
                {children}

                {/* Home Indicator */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-200 dark:bg-gray-800 rounded-full z-20"></div>
            </div>
        </div>
    );
};

export const DesktopMockup = ({ children }) => {
    return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden ring-1 ring-gray-900/5">
            {/* Browser Header */}
            <div className="h-9 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
                <div className="flex-1 mx-4 h-6 bg-white dark:bg-gray-700 rounded text-[10px] text-gray-400 flex items-center px-2 font-mono">
                    social-media.com/feed
                </div>
            </div>

            {/* Browser Content */}
            <div className="p-6 bg-gray-50 dark:bg-gray-950/50 min-h-[400px]">
                <div className="max-w-[480px] mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                    {children}
                </div>
            </div>
        </div>
    );
};
