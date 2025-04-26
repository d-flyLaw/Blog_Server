const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, "评论内容是必需的"],
        trim: true,
        minlength: [1, "评论内容不能为空"],
        maxlength: [500, "评论内容不能超过500个字符"],
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
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
commentSchema.pre("save", function (next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});

// 评论查询中间件 - 自动填充作者信息
commentSchema.pre(/^find/, function (next) {
    this.populate({
        path: "author",
        select: "username avatar",
    });
    next();
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
