import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileImage, FileVideo, AlertCircle, CheckCircle2, CloudUpload, Crop as CropIcon, Loader2 } from "lucide-react";
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
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import getCroppedImg from "../../utils/cropImage";

const MediaUploader = ({ activeFolderId, selectedGroupId, onUploadSuccess }) => {
    const [uploadMedia] = useUploadMediaMutation();
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Crop States
    const [cropFileId, setCropFileId] = useState(null);
    const [crop, setCrop] = useState({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
    const [aspect, setAspect] = useState(1); // Default 1:1
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const imgRef = useRef(null);

    // Cleanup object URLs on unmount to avoid memory leaks
    useEffect(() => {
        return () => files.forEach(f => {
            if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
    }, [files]);

    const onDrop = useCallback((acceptedFiles) => {
        const newFiles = acceptedFiles.map(file => ({
            file,
            id: Math.random().toString(36).substring(7),
            progress: 0,
            status: 'pending',
            error: null,
            previewUrl: URL.createObjectURL(file), // Staged preview
            isVideo: file.type.startsWith("video")
        }));
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
        const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');

        for (const fileObj of pendingFiles) {
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading', progress: 10 } : f));
            const formData = new FormData();
            formData.append("file", fileObj.file);
            if (activeFolderId) {
                formData.append("folderId", activeFolderId);
            }
            if (selectedGroupId && selectedGroupId !== "all") {
                formData.append("groupId", selectedGroupId);
            }

            try {
                setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress: 60 } : f));
                const result = await uploadMedia(formData).unwrap();
                setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'success', progress: 100 } : f));
                
                if (onUploadSuccess && result?.data) {
                    onUploadSuccess(result.data);
                }

                completedCount++;
            } catch (error) {
                console.error(`Failed to upload ${fileObj.file.name}:`, error);
                setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error', error: 'Upload failed' } : f));
            }
        }

        setUploading(false);
        if (completedCount > 0) {
            toast.success(`Successfully uploaded ${completedCount} files`);
        }
    };

    const removeFile = (id) => {
        setFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
            return prev.filter(f => f.id !== id);
        });
    };

    const clearCompleted = () => {
        setFiles(prev => prev.filter(f => f.status !== 'success'));
    };

    const onCropComplete = useCallback((cropLocal, percentCrop) => {
        if (!imgRef.current) return;
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        setCroppedAreaPixels({
            x: cropLocal.x * scaleX,
            y: cropLocal.y * scaleY,
            width: cropLocal.width * scaleX,
            height: cropLocal.height * scaleY,
        });
    }, []);

    const handleSaveCrop = async () => {
        if (!cropFileId || !croppedAreaPixels) return;

        try {
            const fileObj = files.find(f => f.id === cropFileId);
            const { file: croppedFile, url: newPreviewUrl } = await getCroppedImg(
                fileObj.previewUrl,
                croppedAreaPixels
            );

            // Replace original staged file with cropped one
            setFiles(prev => prev.map(f => {
                if (f.id === cropFileId) {
                    URL.revokeObjectURL(f.previewUrl); // Clear old preview
                    return { ...f, file: croppedFile, previewUrl: newPreviewUrl };
                }
                return f;
            }));

            toast.success("Image cropped successfully");
            setCropFileId(null);
        } catch (e) {
            console.error(e);
            toast.error("Failed to crop image");
        }
    };

    const fileToCrop = files.find(f => f.id === cropFileId);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) { setCropFileId(null); setFiles([]); }
            setIsOpen(open);
        }}>
            <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                    <CloudUpload className="mr-2 h-4 w-4" />
                    Upload Media
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{cropFileId ? "Crop Image" : "Upload Media"}</DialogTitle>
                    <DialogDescription>
                        {cropFileId ? "Adjust the boundaries or select a ratio preset." : "Add images or videos to your library."}
                    </DialogDescription>
                </DialogHeader>

                {cropFileId && fileToCrop ? (
                    <div className="space-y-4">
                        <div className="relative w-full h-[400px] bg-black rounded-lg flex items-center justify-center overflow-hidden overflow-y-auto">
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={onCropComplete}
                                aspect={aspect === 0 ? undefined : aspect}
                                className="max-h-[400px]"
                            >
                                <img
                                    ref={imgRef}
                                    src={fileToCrop.previewUrl}
                                    alt="Crop target"
                                    className="max-h-[400px] w-auto object-contain"
                                    onLoad={(e) => {
                                        // Optional: Do initial crop setup based on image load
                                    }}
                                />
                            </ReactCrop>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <Button variant={aspect === 1 ? "default" : "outline"} size="sm" onClick={() => setAspect(1)}>1:1</Button>
                                <Button variant={aspect === 4/5 ? "default" : "outline"} size="sm" onClick={() => setAspect(4/5)}>4:5</Button>
                                <Button variant={aspect === 16/9 ? "default" : "outline"} size="sm" onClick={() => setAspect(16/9)}>16:9</Button>
                                <Button variant={aspect === 0 ? "default" : "outline"} size="sm" onClick={() => setAspect(0)}>Free</Button>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setCropFileId(null)}>Cancel</Button>
                                <Button onClick={handleSaveCrop}>Apply Crop</Button>
                            </div>
                        </div>
                    </div>
                ) : (
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

                        {/* File Staging List */}
                        {files.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                                    <span>{files.length} files staged</span>
                                    {files.some(f => f.status === 'success') && (
                                        <button onClick={clearCompleted} className="text-primary hover:underline">
                                            Clear completed
                                        </button>
                                    )}
                                </div>
                                <ScrollArea className="h-[250px] w-full rounded-md border border-gray-100 dark:border-gray-800 p-2">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {files.map((fileObj) => (
                                            <div key={fileObj.id} className="flex flex-col p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 relative group overflow-hidden">
                                                
                                                {/* Visual Preview */}
                                                <div className="h-24 w-full bg-black/5 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                                                    {fileObj.isVideo ? (
                                                        <video src={fileObj.previewUrl} className="h-full w-full object-cover" controls />
                                                    ) : (
                                                        <img src={fileObj.previewUrl} className="h-full w-full object-cover relative z-0" alt="Preview" />
                                                    )}
                                                </div>

                                                {/* Info & Status */}
                                                <div className="flex items-center justify-between gap-2 mt-auto">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate" title={fileObj.file.name}>{fileObj.file.name}</p>
                                                        {(fileObj.status === 'uploading' || fileObj.status === 'success') && (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Progress value={fileObj.progress} className="h-1 flex-1" />
                                                                <span className="text-[10px] text-gray-500">{fileObj.progress}%</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {fileObj.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                        {fileObj.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" title={fileObj.error} />}
                                                        {fileObj.status === 'pending' && !uploading && (
                                                            <>
                                                                {!fileObj.isVideo && (
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-primary" onClick={() => setCropFileId(fileObj.id)}>
                                                                        <CropIcon className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={() => removeFile(fileObj.id)}>
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2 border-t pt-4 border-gray-100 dark:border-gray-800">
                            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={uploading}>
                                {files.some(f => f.status === 'success') ? "Done" : "Cancel"}
                            </Button>
                            <Button
                                onClick={handleUploadAll}
                                disabled={uploading || files.filter(f => f.status === 'pending' || f.status === 'error').length === 0}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Upload Staged Files"
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default MediaUploader;
