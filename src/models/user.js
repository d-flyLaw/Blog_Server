const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "用户名是必需的"],
        unique: true,
        trim: true,
        minlength: [3, "用户名至少需要3个字符"],
        maxlength: [20, "用户名不能超过20个字符"],
    },
    email: {
        type: String,
        required: [true, "邮箱是必需的"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "请提供有效的邮箱地址"],
    },
    password: {
        type: String,
        required: [true, "密码是必需的"],
        minlength: [6, "密码至少需要6个字符"],
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    avatar: {
        type: String,
        default: "",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// 密码加密中间件
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 验证密码的方法
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
