import React from "react";
import { useGetSmartSuggestionsQuery } from "../../features/posts/postsApi"; // Fixed import path - relative to components/post
import { Button } from "../ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover";

const SmartSuggestions = ({ platform, onSelect }) => {
    const { data, isLoading, isError } = useGetSmartSuggestionsQuery(
        { platform },
        { skip: !platform }
    );

    const isDisabled = !platform;

    return (
        <div className="flex items-center gap-2 mt-2">
            <Popover>
                <PopoverTrigger asChild>
                    <div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isDisabled}
                            className="text-xs h-8 gap-1.5 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors disabled:opacity-50"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                            Get AI Suggestions
                        </Button>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-3 bg-gradient-to-br from-primary/5 to-transparent border-b border-gray-100 dark:border-gray-800">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            Smart Schedule
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                            Best posting times based on your engagement history.
                        </p>
                    </div>

                    <div className="p-2 space-y-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-6 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <span className="text-xs">Analyzing best times...</span>
                            </div>
                        ) : isError ? (
                            <div className="p-4 text-xs text-center text-red-500 bg-red-50/50 rounded-md">
                                Failed to load suggestions. Try again later.
                            </div>
                        ) : data?.data?.length > 0 ? (
                            data.data.map((slot, index) => (
                                <button
                                    key={index}
                                    onClick={() => onSelect(slot.date)}
                                    className="w-full text-left flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group transition-all"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-medium">
                                            {format(new Date(slot.date), "EEEE, h:mm a")}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            {format(new Date(slot.date), "MMM d")} • {slot.reason}
                                        </span>
                                    </div>
                                    {slot.score > 0 && (
                                        <div className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                            {slot.score.toFixed(1)} score
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-xs text-center text-muted-foreground">
                                No suggestions available for this platform right now.
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
            <span className="text-[10px] text-muted-foreground italic">
                {isDisabled ? "Select an account to get AI suggestions" : "AI-powered analysis"}
            </span>
        </div>
    );
};

export default SmartSuggestions;
