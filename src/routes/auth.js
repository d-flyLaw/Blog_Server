const express = require("express");
const { body } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { protect } = require("../middleware/auth");

const router = express.Router();

// 输入验证中间件
const validateRegister = [
    body("username").trim().isLength({ min: 3, max: 20 }).withMessage("用户名长度必须在3-20个字符之间"),
    body("email").trim().isEmail().withMessage("请提供有效的邮箱地址"),
    body("password").isLength({ min: 6 }).withMessage("密码至少需要6个字符"),
];

// 生成JWT Token
const generateToken = userId => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// 注册新用户
router.post("/register", validateRegister, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 检查用户是否已存在
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({
                status: "error",
                message: "用户名或邮箱已被注册",
            });
        }

        // 创建新用户
        const user = await User.create({
            username,
            email,
            password,
        });

        // 生成token
        const token = generateToken(user._id);

        res.status(201).json({
            status: "success",
            token,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
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

// 用户登录
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 检查用户是否存在
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                status: "error",
                message: "邮箱或密码错误",
            });
        }

        // 生成token
        const token = generateToken(user._id);

        res.json({
            status: "success",
            token,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
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

// 获取当前用户信息
router.get("/me", protect, async (req, res) => {
    res.json({
        status: "success",
        data: {
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
                avatar: req.user.avatar,
            },
        },
    });
});

module.exports = router;
