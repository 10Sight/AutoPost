import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Media } from "../models/media.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { validateLimit, updateUsage } from "../services/usage.service.js";

const uploadMedia = asyncHandler(async (req, res) => {
    // console.log(req.files);
    // console.log(req.file);

    const localFilePath = req.file?.path;

    if (!localFilePath) {
        throw new ApiError(400, "File is required");
    }

    // Usage Tracking: Validate storage limit before uploading
    await validateLimit(req.user.organizationId, 'storage', req.file.size);

    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

    if (!cloudinaryResponse) {
        throw new ApiError(500, "Failed to upload file to cloud");
    }

    // Helper to get greatest common divisor for aspect ratio
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const calculateAspectRatio = (w, h) => {
        const common = gcd(w, h);
        return `${w / common}:${h / common}`;
    };

    const media = await Media.create({
        userId: req.user._id,
        organizationId: req.user.organizationId,
        url: cloudinaryResponse.secure_url,
        publicId: cloudinaryResponse.public_id,
        type: cloudinaryResponse.resource_type === "video" ? "video" : "image",
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        width: cloudinaryResponse.width,
        height: cloudinaryResponse.height,
        aspectRatio: cloudinaryResponse.width && cloudinaryResponse.height
            ? calculateAspectRatio(cloudinaryResponse.width, cloudinaryResponse.height)
            : undefined,
        duration: cloudinaryResponse.duration || undefined,
        metadata: cloudinaryResponse,
    });

    // Usage Tracking: Increment storage usage
    await updateUsage(req.user.organizationId, 'storage', req.file.size, 'inc');

    return res
        .status(201)
        .json(new ApiResponse(201, media, "Media uploaded successfully and intelligence data extracted"));
});

const getMedia = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type } = req.query;
    const query = { organizationId: req.user.organizationId };

    if (type) {
        query.type = type;
    }

    const mediaList = await Media.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await Media.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                media: mediaList,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
            "Media fetched successfully"
        )
    );
});

const deleteMedia = asyncHandler(async (req, res) => {
    const { mediaId } = req.params;

    const media = await Media.findOneAndDelete({
        _id: mediaId,
        organizationId: req.user.organizationId,
    });

    if (!media) {
        throw new ApiError(404, "Media not found in your organization");
    }

    // Usage Tracking: Decrement storage usage
    await updateUsage(req.user.organizationId, 'storage', media.size || 0, 'dec');

    // TODO: Ideally delete from Cloudinary as well using media.publicId

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Media deleted successfully"));
});

export { uploadMedia, getMedia, deleteMedia };
