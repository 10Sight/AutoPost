import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const SchedulePicker = ({ scheduledAt, onChange, className }) => {
    // scheduledAt is expected to be an ISO string or Date object string
    const date = scheduledAt ? new Date(scheduledAt) : undefined;

    const handleDateSelect = (newDate) => {
        if (!newDate) return;

        const currentTime = date ? date : new Date();
        newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
        onChange(newDate.toISOString());
    };

    const handleTimeChange = (e) => {
        const timeValue = e.target.value;
        if (!timeValue) return;

        const [hours, minutes] = timeValue.split(':');
        const newDate = date ? new Date(date) : new Date();
        newDate.setHours(parseInt(hours), parseInt(minutes));
        onChange(newDate.toISOString());
    };

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="flex flex-col gap-2">
                <Label>Schedule Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex flex-col gap-2">
                <Label>Schedule Time</Label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                        type="time"
                        className="pl-10"
                        value={date ? format(date, "HH:mm") : ""}
                        onChange={handleTimeChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default SchedulePicker;
