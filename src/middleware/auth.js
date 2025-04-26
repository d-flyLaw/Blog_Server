const jwt = require("jsonwebtoken");
const User = require("../models/user");

// 验证JWT Token的中间件
exports.protect = async (req, res, next) => {
    try {
        // 获取token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "未登录，请先登录",
            });
        }

        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 检查用户是否仍然存在
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({
                status: "error",
                message: "此token所属用户不存在",
            });
        }

        // 将用户信息添加到请求对象中
        req.user = currentUser;
        next();
    } catch (error) {
        return res.status(401).json({
            status: "error",
            message: "无效的token或token已过期",
        });
    }
};

// 限制角色访问的中间件
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: "error",
                message: "您没有权限执行此操作",
            });
        }
        next();
    };
};
