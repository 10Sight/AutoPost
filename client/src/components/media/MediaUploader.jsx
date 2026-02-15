import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileImage, FileVideo, AlertCircle, CheckCircle2, CloudUpload } from "lucide-react";
import { useUploadMediaMutation } from "../../features/media/mediaApi";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

const MediaUploader = () => {
    const [uploadMedia] = useUploadMediaMutation();
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        // Add new files to local state with initial status
        const newFiles = acceptedFiles.map(file => ({
            file,
            id: Math.random().toString(36).substring(7),
            progress: 0,
            status: 'pending', // pending, uploading, success, error
            error: null
        }));
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'video/*': []
        },
        maxSize: 50 * 1024 * 1024, // 50MB
    });

    const handleUploadAll = async () => {
        setUploading(true);
        let completedCount = 0;

        // Process files that are not yet uploaded
        const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');

        // Parallel uploads would be faster but for progress tracking clarity let's do one by one or Promise.all with individual tracking
        // For simplicity and clear UI updates, let's iterate.

        for (const fileObj of pendingFiles) {
            // Update status to uploading
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading', progress: 10 } : f));

            const formData = new FormData();
            formData.append("file", fileObj.file);

            try {
                // Simulate progress step
                setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress: 60 } : f));

                await uploadMedia(formData).unwrap();

                setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'success', progress: 100 } : f));
                completedCount++;
            } catch (error) {
                console.error(`Failed to upload ${fileObj.file.name}:`, error);
                setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error', error: 'Upload failed' } : f));
            }
        }

        setUploading(false);
        if (completedCount > 0) {
            toast.success(`Successfully uploaded ${completedCount} files`);
            // Optional: Auto-close if all success?
            // if (files.every(f => f.status === 'success')) setIsOpen(false);
        }
    };

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearCompleted = () => {
        setFiles(prev => prev.filter(f => f.status !== 'success'));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                    <CloudUpload className="mr-2 h-4 w-4" />
                    Upload Media
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Upload Media</DialogTitle>
                    <DialogDescription>
                        Add images or videos to your library.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`
                            relative overflow-hidden rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300
                            ${isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-900"}
                            ${uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className={`rounded-full p-4 transition-colors ${isDragActive ? "bg-primary/10 text-primary" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                                <CloudUpload className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {isDragActive ? "Drop files here" : "Click or drag files to upload"}
                                </p>
                                <p className="text-xs text-gray-500 max-w-[200px] mx-auto">
                                    Supports JPG, PNG, MP4 up to 50MB
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                                <span>{files.length} files selected</span>
                                {files.some(f => f.status === 'success') && (
                                    <button onClick={clearCompleted} className="text-primary hover:underline">
                                        Clear completed
                                    </button>
                                )}
                            </div>
                            <ScrollArea className="h-[200px] w-full rounded-md border border-gray-100 dark:border-gray-800 p-2">
                                <div className="space-y-2">
                                    {files.map((fileObj) => (
                                        <div key={fileObj.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 relative group">
                                            {/* Icon */}
                                            <div className="h-10 w-10 flex-shrink-0 rounded-md bg-white dark:bg-gray-800 border flex items-center justify-center">
                                                {fileObj.file.type.startsWith('video') ? <FileVideo className="h-5 w-5 text-blue-500" /> : <FileImage className="h-5 w-5 text-purple-500" />}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{fileObj.file.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Progress value={fileObj.progress} className="h-1 flex-1" />
                                                    <span className="text-[10px] text-gray-500 w-8 text-right">{fileObj.progress}%</span>
                                                </div>
                                            </div>

                                            {/* Status/Action */}
                                            <div className="flex-shrink-0">
                                                {fileObj.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                                {fileObj.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                                                {fileObj.status === 'pending' && !uploading && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={() => removeFile(fileObj.id)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)} disabled={uploading}>
                            {files.some(f => f.status === 'success') ? "Done" : "Cancel"}
                        </Button>
                        <Button
                            onClick={handleUploadAll}
                            disabled={uploading || files.filter(f => f.status === 'pending' || f.status === 'error').length === 0}
                        >
                            {uploading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Uploading...
                                </>
                            ) : (
                                "Upload Files"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MediaUploader;
