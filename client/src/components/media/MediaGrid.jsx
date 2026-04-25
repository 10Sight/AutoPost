import React, { useState } from "react";
import { Trash2, FileVideo, ImageIcon, Maximize2, X, MoreHorizontal, Link as LinkIcon, Download, Crop as CropIcon, FolderInput, Wand2 } from "lucide-react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { AspectRatio } from "../ui/aspect-ratio";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

const optimizeCloudinaryUrl = (url, type) => {
    if (!url || !url.includes("cloudinary.com")) return url;
    if (type === "video") return url; // Don't transform video source directly in <img> tag

    // Inject transformation parameters: w_400 (width 400), c_fill (crop fill), q_auto (auto quality), f_auto (auto format)
    // Cloudinary URLs usually have /upload/s--xxxx--/v12345/ or just /upload/v12345/
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;

    return `${parts[0]}/upload/w_600,c_fill,q_auto,f_auto/${parts[1]}`;
};

const MediaGrid = ({ 
    media, 
    onDelete, 
    onSelect, 
    onMove, 
    onCrop, 
    onEdit,
    selectedMediaIds = [],
    gridClassName // Allow overriding the grid layout for different contexts
}) => {
    const [previewItem, setPreviewItem] = useState(null);

    const handleCopyLink = (url) => {
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
    };

    if (!media?.length) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-20 animate-in fade-in-50">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-full mb-4">
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">No media found</h3>
                <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">
                    Upload images or videos to your library to start creating engaging posts.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className={cn(
                "grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6",
                gridClassName
            )}>
                {media.map((item) => (
                    <Card
                        key={item._id}
                        className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-gray-200 dark:border-gray-800 cursor-pointer
                            ${selectedMediaIds.some(m => m._id === item._id) ? "ring-2 ring-primary border-primary bg-primary/5" : ""}
                        `}
                        onClick={() => onSelect ? onSelect(item) : setPreviewItem(item)}
                    >
                        <AspectRatio ratio={1 / 1} className="bg-gray-100 dark:bg-gray-900">
                            {item.type === "video" ? (
                                <div className="flex h-full w-full items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-800 transition-colors text-gray-400 hover:text-primary">
                                    <FileVideo className="h-16 w-16 transition-all duration-300 group-hover:scale-110" />
                                </div>
                            ) : (
                                <img
                                    src={optimizeCloudinaryUrl(item.url, item.type)}
                                    alt={item.originalName}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            )}
                        </AspectRatio>

                        {/* Type Badge */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                            <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit">
                                {item.type === 'video' ? 'Video' : 'Image'}
                            </span>
                            {item.type === 'video' && item.duration && (
                                <span className="bg-blue-600/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
                                    {(item.duration / 60).toFixed(0)}:{Math.floor(item.duration % 60).toString().padStart(2, '0')}
                                </span>
                            )}
                        </div>

                        {/* Overlay Actions */}
                        {!onSelect && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-sm transition-transform hover:scale-105 z-10"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setPreviewItem(item);
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <Maximize2 className="h-4 w-4 pointer-events-none" />
                                </Button>
                                <div
                                    className="z-10"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-sm transition-transform hover:scale-105"
                                            >
                                                <MoreHorizontal className="h-4 w-4 pointer-events-none" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="center">
                                            <DropdownMenuItem onClick={() => handleCopyLink(item.url)}>
                                                <LinkIcon className="mr-2 h-4 w-4" />
                                                Copy Link
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => window.open(item.url, '_blank')}>
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </DropdownMenuItem>
                                            {onMove && (
                                                <DropdownMenuItem onClick={() => onMove(item)}>
                                                    <FolderInput className="mr-2 h-4 w-4" />
                                                    Move to Folder
                                                </DropdownMenuItem>
                                            )}
                                            {onEdit && (
                                                <DropdownMenuItem onClick={() => onEdit(item)}>
                                                    <Wand2 className="mr-2 h-4 w-4" />
                                                    Professional Edit
                                                </DropdownMenuItem>
                                            )}
                                            {onCrop && !item.type.includes("video") && (
                                                <DropdownMenuItem onClick={() => onCrop(item)}>
                                                    <CropIcon className="mr-2 h-4 w-4" />
                                                    Crop Image
                                                </DropdownMenuItem>
                                            )}
                                            {onDelete && (
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(item._id)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}

                        {/* Title Bar */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <p className="truncate text-xs font-semibold text-white">
                                {item.originalName}
                            </p>
                            <p className="text-[10px] text-gray-300 mt-0.5">
                                {format(new Date(item.createdAt || Date.now()), "MMM d, yyyy")}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Preview Dialog */}
            <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-2xl [&>button]:hidden">
                    <DialogTitle className="sr-only">{previewItem?.originalName || "Media Preview"}</DialogTitle>
                    <DialogDescription className="sr-only">Preview of the selected media asset.</DialogDescription>
                    <div className="relative group/modal">
                        {previewItem?.type === "video" ? (
                            <video
                                src={previewItem.url}
                                controls
                                className="w-full h-auto max-h-[85vh] rounded-lg bg-black"
                            />
                        ) : (
                            <img
                                src={previewItem?.url}
                                alt={previewItem?.originalName}
                                className="w-full h-auto max-h-[85vh] object-contain rounded-lg bg-black/50 backdrop-blur-sm"
                            />
                        )}
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-4 right-4 h-10 w-10 rounded-full opacity-0 group-hover/modal:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 text-white border-white/20 border z-50 backdrop-blur-md"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreviewItem(null);
                            }}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent text-white opacity-0 group-hover/modal:opacity-100 transition-opacity rounded-b-lg">
                            <h3 className="font-semibold text-xl">{previewItem?.originalName}</h3>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm opacity-80">
                                    Added {previewItem?.createdAt && format(new Date(previewItem.createdAt), "PPP")}
                                </span>
                                {previewItem?.width && (
                                    <span className="text-sm px-2 py-0.5 bg-white/10 rounded-md border border-white/20">
                                        {previewItem.width}x{previewItem.height} ({previewItem.aspectRatio})
                                    </span>
                                )}
                                {previewItem?.type === 'video' && previewItem?.duration && (
                                    <span className="text-sm px-2 py-0.5 bg-blue-500/30 rounded-md border border-blue-400/30">
                                        {Math.floor(previewItem.duration / 60)}:{(Math.floor(previewItem.duration % 60)).toString().padStart(2, '0')}
                                    </span>
                                )}
                                <Button size="sm" variant="outline" className="h-8 gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white" onClick={() => handleCopyLink(previewItem?.url)}>
                                    <LinkIcon className="h-3 w-3" /> Copy Link
                                </Button>
                                {onEdit && (
                                    <Button 
                                        size="sm" 
                                        className="h-8 gap-2 bg-primary hover:bg-primary/90 text-white border-none" 
                                        onClick={() => {
                                            onEdit(previewItem);
                                            setPreviewItem(null);
                                        }}
                                    >
                                        <Wand2 className="h-3.5 w-3.5" /> Professional Edit
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default MediaGrid;
