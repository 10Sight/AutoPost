import { Media } from "../models/media.model.js";
import { MediaFolder } from "../models/mediaFolder.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { validateLimit, updateUsage } from "./usage.service.js";

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const calculateAspectRatio = (w, h) => {
    const common = gcd(w, h);
    return `${w / common}:${h / common}`;
};

export const uploadMediaService = async (file, user, folderId = null, groupId = null) => {
    const localFilePath = file.path;

    // Usage Tracking: Validate storage limit before uploading
    await validateLimit(user.organizationId, 'storage', file.size);

    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

    if (!cloudinaryResponse) {
        throw new Error("Failed to upload file to cloud");
    }

    const media = await Media.create({
        userId: user._id,
        organizationId: user.organizationId,
        url: cloudinaryResponse.secure_url,
        publicId: cloudinaryResponse.public_id,
        type: cloudinaryResponse.resource_type === "video" ? "video" : "image",
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        width: cloudinaryResponse.width,
        height: cloudinaryResponse.height,
        aspectRatio: cloudinaryResponse.width && cloudinaryResponse.height
            ? calculateAspectRatio(cloudinaryResponse.width, cloudinaryResponse.height)
            : undefined,
        duration: cloudinaryResponse.duration || undefined,
        metadata: cloudinaryResponse,
        folderId: folderId || null,
        groupId: groupId || null,
    });

    // Usage Tracking: Increment storage usage
    await updateUsage(user.organizationId, 'storage', file.size, 'inc');

    return media;
};

export const getMediaService = async (organizationId, filters = {}, pagination = { page: 1, limit: 20 }) => {
    const { type, folderId, groupId } = filters;
    const { page, limit } = pagination;

    const query = { organizationId };

    if (type) query.type = type;
    if (folderId !== undefined) {
        query.folderId = folderId === "null" || folderId === "" ? null : folderId;
    }
    if (groupId) {
        query.groupId = groupId === "all" ? null : groupId;
    }

    const mediaList = await Media.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await Media.countDocuments(query);

    return { mediaList, total };
};

export const getMediaByIdService = async (mediaId, organizationId) => {
    const media = await Media.findOne({ _id: mediaId, organizationId });
    if (!media) throw new Error("Media not found");
    return media;
};

export const deleteMediaService = async (mediaId, organizationId) => {
    const media = await Media.findOneAndDelete({
        _id: mediaId,
        organizationId,
    });

    if (!media) {
        throw new Error("Media not found in your organization");
    }

    // Usage Tracking: Decrement storage usage
    await updateUsage(organizationId, 'storage', media.size || 0, 'dec');
    
    // Cloudinary deletion could be added here
    return media;
};

// --- FOLDER SERVICES ---

export const createFolderService = async (name, userId, organizationId, groupId = null) => {
    const folder = await MediaFolder.create({
        name,
        userId,
        organizationId,
        groupId: groupId || null,
    });
    return folder;
};

export const getFoldersService = async (organizationId, groupId = null) => {
    const query = { organizationId };
    if (groupId) query.groupId = groupId === "all" ? null : groupId;
    const folders = await MediaFolder.find(query).sort({ createdAt: -1 });
    return folders;
};

export const deleteFolderService = async (folderId, organizationId) => {
    const folder = await MediaFolder.findOneAndDelete({ _id: folderId, organizationId });
    if (!folder) throw new Error("Folder not found");
    
    // Move media back to generic root (null)
    await Media.updateMany({ folderId }, { $set: { folderId: null } });
    return folder;
};

export const moveMediaService = async (mediaId, folderId, organizationId) => {
    const media = await Media.findOneAndUpdate(
        { _id: mediaId, organizationId },
        { folderId: folderId || null },
        { new: true }
    );
    if (!media) throw new Error("Media not found");
    return media;
};
