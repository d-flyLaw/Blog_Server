const express = require("express");
const { body } = require("express-validator");
const multer = require("multer");
const path = require("path");
const Post = require("../models/post");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error("只允许上传图片文件！"));
        }
    },
});

// 验证文章输入
const validatePost = [
    body("title").trim().isLength({ min: 2, max: 100 }).withMessage("标题长度必须在2-100个字符之间"),
    body("content").trim().isLength({ min: 10 }).withMessage("内容至少需要10个字符"),
    body("category").trim().notEmpty().withMessage("分类是必需的"),
];

// 创建新文章
router.post("/", protect, upload.single("coverImage"), validatePost, async (req, res) => {
    try {
        const postData = {
            ...req.body,
            author: req.user._id,
        };

        if (req.file) {
            postData.coverImage = `/uploads/${req.file.filename}`;
        }

        const post = await Post.create(postData);

        res.status(201).json({
            status: "success",
            data: { post },
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
});

// 获取所有文章（带分页和筛选）
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // 构建查询条件
        const query = {};
        if (req.query.category) query.category = req.query.category;
        if (req.query.tag) query.tags = req.query.tag;
        if (req.query.author) query.author = req.query.author;
        if (req.query.status) query.status = req.query.status;

        // 执行查询
        const posts = await Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

        // 获取总数
        const total = await Post.countDocuments(query);

        res.json({
            status: "success",
            data: {
                posts,
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

// 获取单个文章
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                status: "error",
                message: "文章不存在",
            });
        }

        // 更新浏览次数
        post.viewCount += 1;
        await post.save();

        res.json({
            status: "success",
            data: { post },
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
});

// 更新文章
router.put("/:id", protect, upload.single("coverImage"), validatePost, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                status: "error",
                message: "文章不存在",
            });
        }

        // 检查权限
        if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                status: "error",
                message: "您没有权限修改此文章",
            });
        }

        const updateData = { ...req.body };
        if (req.file) {
            updateData.coverImage = `/uploads/${req.file.filename}`;
        }

        const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

        res.json({
            status: "success",
            data: { post: updatedPost },
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
});

// 删除文章
router.delete("/:id", protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                status: "error",
                message: "文章不存在",
            });
        }

        // 检查权限
        if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                status: "error",
                message: "您没有权限删除此文章",
            });
        }

        await post.remove();

        res.json({
            status: "success",
            message: "文章已成功删除",
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
});

// 点赞文章
router.post("/:id/like", protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                status: "error",
                message: "文章不存在",
            });
        }

        post.likeCount += 1;
        await post.save();

        res.json({
            status: "success",
            data: { likeCount: post.likeCount },
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
});

module.exports = router;
