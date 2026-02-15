

import React, { useState } from "react";
import {
    useGetMediaQuery,
    useDeleteMediaMutation,
} from "../features/media/mediaApi";
import MediaGrid from "../components/media/MediaGrid";
import MediaUploader from "../components/media/MediaUploader";
import { Loader2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const MediaLibrary = () => {
    const { data: mediaData, isLoading } = useGetMediaQuery({ limit: 100 });
    const [deleteMedia] = useDeleteMediaMutation();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const handleDelete = async (mediaId) => {
        if (window.confirm("Are you sure you want to delete this media?")) {
            try {
                await deleteMedia(mediaId).unwrap();
                toast.success("Media deleted");
            } catch (error) {
                console.error("Failed to delete media:", error);
                toast.error("Failed to delete media");
            }
        }
    };

    // Client-side filtering
    const filteredMedia = mediaData?.data?.media?.filter(item => {
        const matchesSearch = item.originalName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeTab === "all"
            ? true
            : activeTab === "images"
                ? !item.type.includes("video")
                : item.type.includes("video");

        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-8 p-4 md:p-8 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Media Library</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your creative assets, images, and videos.
                    </p>
                </div>
                <MediaUploader />
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl py-4 -my-4 px-1 rounded-xl">
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <TabsTrigger value="all" className="px-6 rounded-md">All Media</TabsTrigger>
                        <TabsTrigger value="images" className="px-6 rounded-md">Images</TabsTrigger>
                        <TabsTrigger value="videos" className="px-6 rounded-md">Videos</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search media..."
                        className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <MediaGrid media={filteredMedia} onDelete={handleDelete} />
                )}
            </div>
        </div>
    );
};

export default MediaLibrary;
