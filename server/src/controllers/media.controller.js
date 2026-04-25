import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    uploadMediaService,
    getMediaService,
    deleteMediaService,
    createFolderService,
    getFoldersService,
    deleteFolderService,
    moveMediaService,
    getMediaByIdService
} from "../services/media.service.js";

const uploadMedia = asyncHandler(async (req, res) => {
    // console.log(req.files);
    // console.log(req.file);

    const localFilePath = req.file?.path;
    const { folderId, groupId } = req.body;

    if (!localFilePath) {
        throw new ApiError(400, "File is required");
    }

    try {
        const media = await uploadMediaService(req.file, req.user, folderId, groupId);
        return res.status(201).json(new ApiResponse(201, media, "Media uploaded successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to upload file");
    }
});

const getMedia = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type, folderId, groupId } = req.query;
    
    const { mediaList, total } = await getMediaService(
        req.user.organizationId, 
        { type, folderId, groupId },
        { page: parseInt(page), limit: parseInt(limit) }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                media: mediaList,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
            "Media fetched successfully"
        )
    );
});

const getMediaById = asyncHandler(async (req, res) => {
    const { mediaId } = req.params;
    const media = await getMediaByIdService(mediaId, req.user.organizationId);
    return res.status(200).json(new ApiResponse(200, media, "Media fetched successfully"));
});

const deleteMedia = asyncHandler(async (req, res) => {
    const { mediaId } = req.params;

    try {
        await deleteMediaService(mediaId, req.user.organizationId);
        return res.status(200).json(new ApiResponse(200, {}, "Media deleted successfully"));
    } catch (error) {
        throw new ApiError(404, error.message || "Failed to delete media");
    }
});

// FOLDER CONTROLLERS
const createFolder = asyncHandler(async (req, res) => {
    const { name, groupId } = req.body;
    if (!name) throw new ApiError(400, "Folder name is required");

    const folder = await createFolderService(name, req.user._id, req.user.organizationId, groupId);
    return res.status(201).json(new ApiResponse(201, folder, "Folder created"));
});

const getFolders = asyncHandler(async (req, res) => {
    const { groupId } = req.query;
    const folders = await getFoldersService(req.user.organizationId, groupId);
    return res.status(200).json(new ApiResponse(200, folders, "Folders fetched"));
});

const deleteFolder = asyncHandler(async (req, res) => {
    const { folderId } = req.params;
    try {
        await deleteFolderService(folderId, req.user.organizationId);
        return res.status(200).json(new ApiResponse(200, {}, "Folder deleted"));
    } catch (error) {
        throw new ApiError(404, error.message || "Failed to delete folder");
    }
});

const moveMedia = asyncHandler(async (req, res) => {
    const { mediaId } = req.params;
    const { folderId } = req.body;

    try {
        const media = await moveMediaService(mediaId, folderId, req.user.organizationId);
        return res.status(200).json(new ApiResponse(200, media, "Media moved"));
    } catch (error) {
        throw new ApiError(404, error.message || "Failed to move media");
    }
});

export { uploadMedia, getMedia, getMediaById, deleteMedia, createFolder, getFolders, deleteFolder, moveMedia };
