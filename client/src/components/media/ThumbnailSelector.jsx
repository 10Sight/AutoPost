import React, { useState } from "react";
import { Image as ImageIcon, Upload, Library, X, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { useGetMediaQuery } from "../../features/media/mediaApi";
import MediaGrid from "./MediaGrid";
import MediaUploader from "./MediaUploader";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const ThumbnailSelector = ({ videoUrl, onSelect, selectedThumbnail, groupId }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const { data: mediaData, isLoading } = useGetMediaQuery({ 
        limit: 20, 
        page: 1, 
        type: "image",
        groupId: groupId !== "all" ? groupId : undefined
    });

    const handleSelect = (media) => {
        onSelect(media);
        setIsOpen(false);
    };

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Video Thumbnail (Cover Image)
                </Label>
                {selectedThumbnail && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onSelect(null)}
                        className="h-7 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <X className="h-3 w-3 mr-1" /> Remove
                    </Button>
                )}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <div className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 transition-all hover:border-primary/50 hover:bg-primary/5 aspect-video flex flex-col items-center justify-center gap-2 bg-gray-50/50 dark:bg-gray-900/50">
                        {selectedThumbnail ? (
                            <>
                                <img 
                                    src={selectedThumbnail.url} 
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                    alt="Thumbnail"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="secondary" size="sm" className="gap-2">
                                        <Upload className="h-4 w-4" /> Change Cover
                                    </Button>
                                </div>
                                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400 group-hover:text-primary transition-colors">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">Select a custom cover</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Recommended: 1280x720 (16:9) or 9:16 for Stories/Reels</p>
                                </div>
                            </>
                        )}
                    </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Choose Thumbnail Image</DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="library" className="gap-2">
                                <Library className="h-4 w-4" /> Library
                            </TabsTrigger>
                            <TabsTrigger value="upload" className="gap-2">
                                <Upload className="h-4 w-4" /> Upload New
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="library" className="flex-1 overflow-hidden mt-0">
                            <ScrollArea className="h-[500px] pr-4">
                                <MediaGrid 
                                    media={mediaData?.data?.media} 
                                    onSelect={handleSelect}
                                    selectedMediaIds={selectedThumbnail ? [selectedThumbnail] : []}
                                    gridClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                                />
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="upload" className="flex-1 mt-0">
                            <div className="py-8">
                                <MediaUploader 
                                    selectedGroupId={groupId} 
                                    onUploadSuccess={(newMedia) => {
                                        if (newMedia.type === 'image') handleSelect(newMedia);
                                    }}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ThumbnailSelector;
