const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "标题是必需的"],
        trim: true,
        minlength: [2, "标题至少需要2个字符"],
        maxlength: [100, "标题不能超过100个字符"],
    },
    content: {
        type: String,
        required: [true, "内容是必需的"],
        minlength: [10, "内容至少需要10个字符"],
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    tags: [
        {
            type: String,
            trim: true,
        },
    ],
    category: {
        type: String,
        required: [true, "分类是必需的"],
        trim: true,
    },
    coverImage: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["draft", "published"],
        default: "draft",
    },
    viewCount: {
        type: Number,
        default: 0,
    },
    likeCount: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// 更新时间中间件
postSchema.pre("save", function (next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});

// 文章查询中间件 - 自动填充作者信息
postSchema.pre(/^find/, function (next) {
    this.populate({
        path: "author",
        select: "username avatar",
    });
    next();
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
