const express = require("express");
const { body } = require("express-validator");
const Comment = require("../models/comment");
const { protect } = require("../middleware/auth");

const router = express.Router();

// 验证评论输入
const validateComment = [
    body("content").trim().isLength({ min: 1, max: 500 }).withMessage("评论内容长度必须在1-500个字符之间"),
    body("post").notEmpty().withMessage("文章ID是必需的"),
];

// 创建新评论
router.post("/", protect, validateComment, async (req, res) => {
    try {
        const comment = await Comment.create({
            content: req.body.content,
            post: req.body.post,
            author: req.user._id,
            parentComment: req.body.parentComment || null,
        });

        await comment.populate("author", "username avatar");

        res.status(201).json({
            status: "success",
            data: { comment },
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
});

// 获取文章的所有评论
router.get("/post/:postId", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const comments = await Comment.find({ post: req.params.postId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Comment.countDocuments({ post: req.params.postId });

        res.json({
            status: "success",
            data: {
                comments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
});

// 更新评论
router.put("/:id", protect, validateComment, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({
                status: "error",
                message: "评论不存在",
            });
        }

        // 检查权限
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: "error",
                message: "您没有权限修改此评论",
            });
        }

        comment.content = req.body.content;
        await comment.save();

        res.json({
            status: "success",
            data: { comment },
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
});

// 删除评论
router.delete("/:id", protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({
                status: "error",
                message: "评论不存在",
            });
        }

        // 检查权限
        if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                status: "error",
                message: "您没有权限删除此评论",
            });
        }

        await comment.remove();

        res.json({
            status: "success",
            message: "评论已成功删除",
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
});

// 点赞评论
router.post("/:id/like", protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({
                status: "error",
                message: "评论不存在",
            });
        }

        // 检查用户是否已经点赞
        const hasLiked = comment.likes.includes(req.user._id);
        if (hasLiked) {
            // 取消点赞
            comment.likes = comment.likes.filter(userId => userId.toString() !== req.user._id.toString());
        } else {
            // 添加点赞
            comment.likes.push(req.user._id);
        }

        await comment.save();

        res.json({
            status: "success",
            data: {
                likes: comment.likes.length,
                hasLiked: !hasLiked,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
});

module.exports = router;
