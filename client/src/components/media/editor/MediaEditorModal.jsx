import React, { Suspense, lazy } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription
} from "../../ui/dialog";
import { Loader2, Wand2 } from "lucide-react";
import { useSaveEditedMediaMutation } from "../../../features/media/mediaApi";
import { toast } from "sonner";

// Lazy load actual editors for performance
const ImageCanvasEditor = lazy(() => import("./ImageCanvasEditor"));
const VideoTrimmer = lazy(() => import("./VideoTrimmer"));

const MediaEditorModal = ({ isOpen, onClose, media, onEditSuccess }) => {
    const [saveEditedMedia, { isLoading: isUploading }] = useSaveEditedMediaMutation();

    if (!media) return null;

    const isVideo = media.type === "video";

    const handleSaveEdited = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("originalId", media._id);
        formData.append("folderId", media.folderId || "");
        
        try {
            const result = await saveEditedMedia(formData).unwrap();
            toast.success("Media edited and saved as new version!");
            if (onEditSuccess) onEditSuccess(result.data);
            onClose();
        } catch (error) {
            console.error("Failed to save edited media:", error);
            toast.error("Failed to save edited media");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden border-none bg-transparent shadow-none">
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl">
                    <DialogHeader className="px-6 py-4 border-b bg-white dark:bg-gray-950 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Wand2 className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    Edit {isVideo ? "Video" : "Image"}
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    {isVideo 
                                        ? "Trim your video to the perfect length for social media." 
                                        : "Add text, stickers, and filters to enhance your post."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden p-6">
                        <Suspense fallback={
                            <div className="h-full w-full flex flex-col items-center justify-center gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm font-medium animate-pulse">Initializing Editor Tools...</p>
                            </div>
                        }>
                            {isVideo ? (
                                <VideoTrimmer 
                                    videoUrl={media.url} 
                                    onSave={handleSaveEdited} 
                                    onCancel={onClose}
                                />
                            ) : (
                                <ImageCanvasEditor 
                                    imageUrl={media.url} 
                                    onSave={handleSaveEdited} 
                                    onCancel={onClose}
                                />
                            )}
                        </Suspense>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MediaEditorModal;
