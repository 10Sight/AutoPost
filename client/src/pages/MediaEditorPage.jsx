import React, { useEffect, useState, Suspense, lazy } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetMediaByIdQuery, useSaveEditedMediaMutation } from "../features/media/mediaApi";
import { Loader2, ArrowLeft, Wand2, Save } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

// Lazy load actual editors for performance
const ImageCanvasEditor = lazy(() => import("../components/media/editor/ImageCanvasEditor"));
const VideoTrimmer = lazy(() => import("../components/media/editor/VideoTrimmer"));

const MediaEditorPage = () => {
    const { mediaId } = useParams();
    const navigate = useNavigate();
    const [saveEditedMedia, { isLoading: isSaving }] = useSaveEditedMediaMutation();
    
    // Fetch specifically this media
    const { data: mediaData, isLoading: isFetching } = useGetMediaByIdQuery(mediaId, {
        skip: !mediaId || mediaId === "undefined"
    });
    
    const media = mediaData?.data;

    const handleSave = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("originalId", media._id);
        formData.append("folderId", media.folderId || "");
        
        try {
            await saveEditedMedia(formData).unwrap();
            toast.success("Media saved successfully!");
            navigate(-1); // Go back to library
        } catch (error) {
            console.error("Failed to save edited media:", error);
            toast.error("Failed to save edited media");
        }
    };

    if (isFetching) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium animate-pulse">Loading Media Asset...</p>
            </div>
        );
    }

    if (!media) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
                <p className="text-lg font-bold">Media not found</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    const isVideo = media.type === "video";

    return (
        <div className="h-screen w-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
            {/* Immersive Header */}
            <header className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-950 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Wand2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">
                                {isVideo ? "Video Trimmer" : "Image Editor"}
                            </h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                {media.originalName}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground mr-4 hidden sm:block">
                        Changes are saved as a new version
                    </span>
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Discard
                    </Button>
                </div>
            </header>

            {/* Editor Workspace */}
            <main className="flex-1 overflow-hidden p-4 md:p-8 bg-gray-100 dark:bg-gray-900/50">
                <div className="h-full max-w-7xl mx-auto">
                    <Suspense fallback={
                        <div className="h-full w-full flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm font-medium animate-pulse">Launching Editor Engine...</p>
                        </div>
                    }>
                        {isVideo ? (
                            <VideoTrimmer 
                                videoUrl={media.url} 
                                onSave={handleSave} 
                                onCancel={() => navigate(-1)}
                            />
                        ) : (
                            <ImageCanvasEditor 
                                imageUrl={media.url} 
                                onSave={handleSave} 
                                onCancel={() => navigate(-1)}
                            />
                        )}
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

export default MediaEditorPage;
