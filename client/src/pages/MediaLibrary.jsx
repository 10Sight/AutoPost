import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    useGetMediaQuery,
    useDeleteMediaMutation,
    useGetFoldersQuery,
    useCreateFolderMutation,
    useDeleteFolderMutation,
    useMoveMediaMutation,
    useUploadMediaMutation,
} from "../features/media/mediaApi";
import MediaGrid from "../components/media/MediaGrid";
import MediaUploader from "../components/media/MediaUploader";
import MediaEditorModal from "../components/media/editor/MediaEditorModal";
import { Loader2, Search, Folder, FolderPlus, Trash2, Library, FolderOpen, Crop as CropIcon, FolderInput, Check, X, Wand2 } from "lucide-react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import getCroppedImg from "../utils/cropImage";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Skeleton } from "../components/ui/skeleton";

const MediaGridSkeleton = () => (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 mt-6">
        {[...Array(12)].map((_, i) => (
            <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-3 w-[40%]" />
                </div>
            </div>
        ))}
    </div>
);

import { useGetGroupsQuery } from "../features/accountGroups/accountGroupsApi";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Filter } from "lucide-react";

const MediaLibrary = () => {
    const navigate = useNavigate();
    const [selectedGroup, setSelectedGroup] = useState(() => {
        return localStorage.getItem("lastSelectedMediaGroup") || "all";
    });
    
    const [activeFolderId, setActiveFolderId] = useState(null); // null = All Media
    const [page, setPage] = useState(1);
    const [limit] = useState(24);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    
    const { data: groupsData } = useGetGroupsQuery();

    useEffect(() => {
        localStorage.setItem("lastSelectedMediaGroup", selectedGroup);
    }, [selectedGroup]);

    // Queries
    const { data: mediaData, isLoading, isFetching } = useGetMediaQuery({ 
        limit, 
        page, 
        folderId: activeFolderId,
        groupId: selectedGroup !== "all" ? selectedGroup : undefined,
        type: activeTab === "all" ? undefined : activeTab === "images" ? "image" : "video"
    });
    
    const { data: foldersData, isLoading: isLoadingFolders } = useGetFoldersQuery({
        groupId: selectedGroup !== "all" ? selectedGroup : undefined
    });

    const [allMedia, setAllMedia] = useState([]);

    // Reset and sync media
    useEffect(() => {
        if (page === 1) {
            setAllMedia(mediaData?.data?.media || []);
        } else if (mediaData?.data?.media) {
            setAllMedia(prev => {
                const newItems = mediaData.data.media.filter(
                    newItem => !prev.some(oldItem => oldItem._id === newItem._id)
                );
                return [...prev, ...newItems];
            });
        }
    }, [mediaData, page]);

    // Reset pagination when filters change
    useEffect(() => {
        setPage(1);
    }, [activeFolderId, activeTab, selectedGroup]); // Added selectedGroup here
    
    // Mutations
    const [deleteMedia] = useDeleteMediaMutation();
    const [createFolder, { isLoading: isCreatingFolder }] = useCreateFolderMutation();
    const [deleteFolder] = useDeleteFolderMutation();
    const [moveMedia, { isLoading: isMovingMedia }] = useMoveMediaMutation();
    const [uploadMedia, { isLoading: isUploadingCrop }] = useUploadMediaMutation();

    // Folder Modal State
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // Move to Folder State
    const [selectedMediaForMove, setSelectedMediaForMove] = useState(null);
    const [targetFolderId, setTargetFolderId] = useState("");

    // Crop State
    const [selectedMediaForCrop, setSelectedMediaForCrop] = useState(null);
    const [crop, setCrop] = useState({ unit: "%", width: 50, height: 50, x: 25, y: 25 });
    const [aspect, setAspect] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const imgRef = useRef(null);

    // Professional Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedMediaForEdit, setSelectedMediaForEdit] = useState(null);

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        try {
            await createFolder({ 
                name: newFolderName.trim(),
                groupId: selectedGroup !== "all" ? selectedGroup : undefined 
            }).unwrap();
            toast.success("Folder created successfully");
            setNewFolderName("");
            setIsCreateFolderOpen(false);
        } catch (error) {
            toast.error("Failed to create folder");
        }
    };

    const handleDeleteFolder = async (folderId) => {
        if (window.confirm("Delete this folder? Its media will be moved to the generic library.")) {
            try {
                await deleteFolder(folderId).unwrap();
                if (activeFolderId === folderId) setActiveFolderId(null);
                toast.success("Folder deleted");
            } catch (error) {
                toast.error("Failed to delete folder");
            }
        }
    };

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

    const handleMoveMedia = async () => {
        if (!selectedMediaForMove || !targetFolderId) return;
        try {
            await moveMedia({
                mediaId: selectedMediaForMove._id,
                folderId: targetFolderId === "root" ? null : targetFolderId,
            }).unwrap();
            toast.success("Media moved successfully");
            setSelectedMediaForMove(null);
            setTargetFolderId("");
        } catch (error) {
            toast.error("Failed to move media");
        }
    };

    const onCropComplete = useCallback((cropLocal) => {
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
        if (!selectedMediaForCrop || !croppedAreaPixels) return;

        try {
            const { file: croppedFile } = await getCroppedImg(
                selectedMediaForCrop.url,
                croppedAreaPixels
            );

            const formData = new FormData();
            formData.append("file", croppedFile);
            if (activeFolderId) {
                formData.append("folderId", activeFolderId);
            }
            if (selectedGroup && selectedGroup !== "all") {
                formData.append("groupId", selectedGroup);
            }

            await uploadMedia(formData).unwrap();
            toast.success("Cropped version uploaded successfully!");
            setSelectedMediaForCrop(null);
        } catch (e) {
            console.error(e);
            toast.error("Failed to save crop");
        }
    };

    // Client-side filtering (only search remains client-side)
    const filteredMedia = allMedia?.filter(item => {
        return item.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const hasMore = mediaData?.data?.pagination?.pages > page;

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Media Library</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Manage your creative assets in separate workspace folders.
                        </p>
                    </div>

                    {/* Group Filter Selector - Refined Premium Design */}
                    <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 group/select sm:ml-4">
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger className="w-[180px] h-8 border-none bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-400 focus:ring-0 transition-colors group-hover/select:text-primary">
                                <div className="flex items-center">
                                    <Filter className="h-3.5 w-3.5 mr-2.5 text-primary/60 group-hover/select:text-primary transition-colors" />
                                    <SelectValue placeholder="Select Group" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                <SelectItem value="all" className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer rounded-lg mx-1">
                                    Global Assets
                                </SelectItem>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                                {groupsData?.data?.map((group) => (
                                    <SelectItem 
                                        key={group._id} 
                                        value={group._id} 
                                        className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer rounded-lg mx-1"
                                    >
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <MediaUploader 
                    activeFolderId={activeFolderId} 
                    selectedGroupId={selectedGroup !== "all" ? selectedGroup : undefined} 
                />
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Sidebar - Folders */}
                <div className="w-full lg:w-64 shrink-0 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-sm font-semibold tracking-tight text-gray-500 uppercase">Folders</h2>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsCreateFolderOpen(true)}>
                            <FolderPlus className="h-4 w-4" />
                        </Button>
                    </div>

                    <ScrollArea className="h-[400px] lg:h-[calc(100vh-250px)] pr-4">
                        <div className="space-y-1">
                            {/* Generic All Media */}
                            <button
                                onClick={() => setActiveFolderId(null)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    activeFolderId === null
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                            >
                                <Library className="h-4 w-4" />
                                All Media
                            </button>

                            {isLoadingFolders ? (
                                <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-gray-400"/></div>
                            ) : (
                                foldersData?.data?.map((folder) => (
                                    <div 
                                        key={folder._id} 
                                        className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all ${
                                            activeFolderId === folder._id
                                            ? "bg-primary text-white shadow-md shadow-primary/20 font-medium"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
                                        }`}
                                    >
                                        <button
                                            onClick={() => setActiveFolderId(folder._id)}
                                            className="flex items-center gap-3 flex-1 h-full text-left"
                                        >
                                            {activeFolderId === folder._id ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                                            <span className="truncate max-w-[120px]">{folder.name}</span>
                                        </button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ${
                                                        activeFolderId === folder._id ? "text-white hover:bg-white/20 hover:text-white" : ""
                                                    }`}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem 
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                                    onClick={() => handleDeleteFolder(folder._id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Folder
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right Area - Media Grid */}
                <div className="flex-1 space-y-4">

                    {/* Filters and Search */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 border-b border-border/40 mt-2 mb-6">
                        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                            <TabsList className="bg-muted p-1 rounded-lg">
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
                        {isLoading && page === 1 ? (
                            <MediaGridSkeleton />
                        ) : filteredMedia?.length > 0 ? (
                            <div className="space-y-10">
                                <MediaGrid
                                    media={filteredMedia}
                                    onDelete={handleDelete}
                                    onMove={(item) => {
                                        setSelectedMediaForMove(item);
                                        setTargetFolderId(item.folderId || "root");
                                    }}
                                    onCrop={(item) => setSelectedMediaForCrop(item)}
                                    onEdit={(item) => {
                                        navigate(`/media/editor/${item._id}`);
                                    }}
                                />
                                
                                {hasMore && (
                                    <div className="flex justify-center pt-4 pb-12">
                                        <Button 
                                            variant="outline" 
                                            size="lg" 
                                            className="px-12 py-6 text-base rounded-full border-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                                            onClick={() => setPage(prev => prev + 1)}
                                            disabled={isFetching}
                                        >
                                            {isFetching ? (
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            ) : (
                                                "Load More Assets"
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Search className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-lg">No media assets found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Folder Modal */}
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleCreateFolder}>
                        <DialogHeader>
                            <DialogTitle>Create New Folder</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">Folder Name</label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Summer Campaign"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    maxLength={50}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreatingFolder || !newFolderName.trim()}>
                                {isCreatingFolder ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Create Folder
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Move to Folder Modal */}
            <Dialog open={!!selectedMediaForMove} onOpenChange={(open) => !open && setSelectedMediaForMove(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Move to Folder</DialogTitle>
                        <DialogDescription>
                            Select a destination folder for "{selectedMediaForMove?.originalName}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Destination Folder</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={targetFolderId}
                            onChange={(e) => setTargetFolderId(e.target.value)}
                        >
                            <option value="root">All Media (Root)</option>
                            {foldersData?.data?.map((f) => (
                                <option key={f._id} value={f._id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedMediaForMove(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleMoveMedia} disabled={isMovingMedia || !targetFolderId}>
                            {isMovingMedia ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FolderInput className="h-4 w-4 mr-2" />}
                            Move Media
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Library Crop Modal */}
            <Dialog open={!!selectedMediaForCrop} onOpenChange={(open) => !open && setSelectedMediaForCrop(null)}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Crop Image</DialogTitle>
                        <DialogDescription>
                            Create a cropped version of this image. It will be saved as a new file.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMediaForCrop && (
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
                                        src={selectedMediaForCrop.url}
                                        alt="Crop target"
                                        className="max-h-[400px] w-auto object-contain"
                                        crossOrigin="anonymous"
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
                                    <Button variant="ghost" onClick={() => setSelectedMediaForCrop(null)}>Cancel</Button>
                                    <Button onClick={handleSaveCrop} disabled={isUploadingCrop}>
                                        {isUploadingCrop ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                        Save Cropped Copy
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MediaLibrary;
