import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { ScheduledPost } from "../models/scheduledPost.model.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import YouTubeService from "../services/youtube.service.js";
import InstagramService from "../services/instagram.service.js";
import FacebookService from "../services/facebook.service.js";
import LinkedInService from "../services/linkedin.service.js";
import XService from "../services/x.service.js";

/**
 * @desc    Get real-time engagement stats for a specific post
 * @route   GET /api/v1/engagement/:postId
 */
const getPostEngagement = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await ScheduledPost.findOne({
        _id: postId,
        organizationId: req.user.organizationId
    });

    if (!post) {
        throw new ApiError(404, "Post not found or unauthorized");
    }

    if (!post.platformPostId) {
        throw new ApiError(400, "This post has not been published to a platform yet.");
    }

    let account = await SocialAccount.findById(post.socialAccountId);

    // Fallback: If original account ID is gone (due to reconnect), find current active account for this platform
    if (!account) {
        account = await SocialAccount.findOne({
            organizationId: req.user.organizationId,
            platform: post.platform
        });
    }

    if (!account) {
        throw new ApiError(404, "No active social account found for this platform. Please reconnect.");
    }

    let stats;
    switch (post.platform) {
        case "youtube":
            stats = await YouTubeService.getVideoStats(account, post.platformPostId);
            break;
        case "instagram":
            // IG uses Media endpoint
            const igComments = await InstagramService.getComments(account, post.platformPostId);
            stats = {
                likes: post.analytics?.likes || 0, // Need insights API for real likes
                comments: igComments.length,
                views: 0
            };
            break;
        case "facebook":
            const fbComments = await FacebookService.getComments(account, post.platformPostId);
            stats = {
                likes: post.analytics?.likes || 0,
                comments: fbComments.length,
                views: 0
            };
            break;
        case "x":
            const xComments = await XService.getComments(account, post.platformPostId);
            stats = {
                likes: post.analytics?.likes || 0,
                comments: xComments.length,
                views: post.analytics?.views || 0
            };
            break;
        case "linkedin":
            const liComments = await LinkedInService.getComments(account, post.platformPostId);
            stats = {
                likes: post.analytics?.likes || 0,
                comments: liComments.length,
                views: 0
            };
            break;
        default:
            throw new ApiError(400, `Engagement tracking is not yet supported for ${post.platform}`);
    }

    // Update local analytics for caching/history
    post.analytics = {
        ...post.analytics,
        likes: stats.likes || 0,
        comments: stats.comments || 0,
        views: stats.views || 0,
        lastUpdated: new Date()
    };
    await post.save();

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Engagement stats fetched successfully"));
});

/**
 * @desc    Get comments for a specific post
 * @route   GET /api/v1/engagement/:postId/comments
 */
const getPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await ScheduledPost.findOne({
        _id: postId,
        organizationId: req.user.organizationId
    });

    if (!post || !post.platformPostId) {
        throw new ApiError(404, "Post not found or not published");
    }

    let account = await SocialAccount.findById(post.socialAccountId);
    
    // Fallback: If original account ID is gone (due to reconnect), find current active account for this platform
    if (!account) {
        account = await SocialAccount.findOne({
            organizationId: req.user.organizationId,
            platform: post.platform
        });
    }

    if (!account) {
        throw new ApiError(404, "No active social account found for this platform. Please reconnect.");
    }

    let comments;
    switch (post.platform) {
        case "youtube":
            comments = await YouTubeService.getVideoComments(account, post.platformPostId);
            break;
        case "instagram":
            comments = await InstagramService.getComments(account, post.platformPostId);
            break;
        case "facebook":
            comments = await FacebookService.getComments(account, post.platformPostId);
            break;
        case "linkedin":
            comments = await LinkedInService.getComments(account, post.platformPostId);
            break;
        case "x":
            comments = await XService.getComments(account, post.platformPostId);
            break;
        default:
            throw new ApiError(400, `Commenting is not yet supported for ${post.platform}`);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

/**
 * @desc    Post a comment or reply
 * @route   POST /api/v1/engagement/:postId/comments
 */
const addPostComment = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { text, parentId } = req.body;

    if (!text) {
        throw new ApiError(400, "Comment text is required");
    }

    const post = await ScheduledPost.findOne({
        _id: postId,
        organizationId: req.user.organizationId
    });

    if (!post || !post.platformPostId) {
        throw new ApiError(404, "Post not found or not published");
    }

    let account = await SocialAccount.findById(post.socialAccountId);

    // Fallback logic
    if (!account) {
        account = await SocialAccount.findOne({
            organizationId: req.user.organizationId,
            platform: post.platform
        });
    }

    if (!account) {
        throw new ApiError(404, "No active social account found for this platform. Please reconnect.");
    }

    let result;
    switch (post.platform) {
        case "youtube":
            result = await YouTubeService.postVideoComment(account, post.platformPostId, text, parentId);
            break;
        case "instagram":
            result = await InstagramService.addComment(account, post.platformPostId, text);
            break;
        case "facebook":
            result = await FacebookService.addComment(account, post.platformPostId, text);
            break;
        case "linkedin":
            result = await LinkedInService.addComment(account, post.platformPostId, text);
            break;
        case "x":
            result = await XService.addComment(account, post.platformPostId, text);
            break;
        default:
            throw new ApiError(400, `Commenting is not yet supported for ${post.platform}`);
    }

    return res
        .status(201)
        .json(new ApiResponse(201, result, "Comment posted successfully"));
});

/**
 * @desc    Like or Unlike a comment
 * @route   POST /api/v1/engagement/:postId/comments/:commentId/like
 */
const likeComment = asyncHandler(async (req, res) => {
    const { postId, commentId } = req.params;
    const { rating } = req.body; // 'like' or 'none'

    console.log(`[DEBUG] Liking comment: postId=${postId}, commentId=${commentId}, rating=${rating}`);

    const post = await ScheduledPost.findOne({
        _id: postId,
        organizationId: req.user.organizationId
    });

    if (!post || !post.platformPostId) {
        throw new ApiError(404, "Post not found or not published");
    }

    let account = await SocialAccount.findById(post.socialAccountId);

    if (!account) {
        account = await SocialAccount.findOne({
            organizationId: req.user.organizationId,
            platform: post.platform
        });
    }

    if (!account) {
        throw new ApiError(404, "No active social account found for this platform. Please reconnect.");
    }

    let result;
    switch (post.platform) {
        case "youtube":
            // YouTube removed setRating from public API for comments
            throw new ApiError(400, "YouTube no longer supports liking comments via API.");
        case "instagram":
            result = await InstagramService.setCommentRating(account, commentId, rating || "like");
            break;
        case "facebook":
            result = await FacebookService.setCommentRating(account, commentId, rating || "like");
            break;
        case "linkedin":
            result = await LinkedInService.setCommentRating(account, commentId, rating || "like");
            break;
        case "x":
            result = await XService.setCommentRating(account, commentId, rating || "like");
            break;
        default:
            throw new ApiError(400, `Liking is not yet supported for ${post.platform}`);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Comment rated successfully"));
});

/**
 * @desc    Like or Unlike a post
 * @route   POST /api/v1/engagement/:postId/like
 */
const likePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { rating } = req.body; // 'like' or 'none'

    const post = await ScheduledPost.findOne({
        _id: postId,
        organizationId: req.user.organizationId
    });

    if (!post || !post.platformPostId) {
        throw new ApiError(404, "Post not found or not published");
    }

    let account = await SocialAccount.findById(post.socialAccountId);

    if (!account) {
        account = await SocialAccount.findOne({
            organizationId: req.user.organizationId,
            platform: post.platform
        });
    }

    if (!account) {
        throw new ApiError(404, "No active social account found");
    }

    let result;
    switch (post.platform) {
        case "youtube":
            result = await YouTubeService.setRating(account, post.platformPostId, rating || "like");
            break;
        case "instagram":
            result = await InstagramService.setCommentRating(account, post.platformPostId, rating || "like");
            break;
        case "facebook":
            result = await FacebookService.setCommentRating(account, post.platformPostId, rating || "like");
            break;
        case "linkedin":
            result = await LinkedInService.setCommentRating(account, post.platformPostId, rating || "like");
            break;
        case "x":
            result = await XService.setCommentRating(account, post.platformPostId, rating || "like");
            break;
        default:
            throw new ApiError(400, `Liking is not yet supported for ${post.platform}`);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Post rating updated successfully"));
});

export {
    getPostEngagement,
    getPostComments,
    addPostComment,
    likeComment,
    likePost
};
