import React, { useState } from "react";
import { Trash2, FileVideo, ImageIcon, Maximize2, X, MoreHorizontal, Link as LinkIcon, Download } from "lucide-react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { toast } from "sonner";

const MediaGrid = ({ media, onDelete, onSelect, selectedMedia }) => {
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
                {media.map((item) => (
                    <Card
                        key={item._id}
                        className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-gray-200 dark:border-gray-800 cursor-pointer
                            ${selectedMedia?._id === item._id ? "ring-2 ring-primary border-primary" : ""}
                        `}
                        onClick={() => onSelect ? onSelect(item) : setPreviewItem(item)}
                    >
                        <AspectRatio ratio={1 / 1} className="bg-gray-100 dark:bg-gray-900">
                            {item.type === "video" ? (
                                <div className="flex h-full w-full items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-800 transition-colors">
                                    <FileVideo className="h-10 w-10 text-gray-400 group-hover:text-primary transition-colors" />
                                </div>
                            ) : (
                                <img
                                    src={item.url}
                                    alt={item.originalName}
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
                                    className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-sm transition-transform hover:scale-105"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewItem(item);
                                    }}
                                >
                                    <Maximize2 className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-sm transition-transform hover:scale-105"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
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
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-2xl">
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
                            className="absolute top-4 right-4 h-10 w-10 rounded-full opacity-0 group-hover/modal:opacity-100 transition-opacity"
                            onClick={() => setPreviewItem(null)}
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
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default MediaGrid;
