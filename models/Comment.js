const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    body: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    articleId: { type: Schema.Types.ObjectId, ref: "Article", required: true },
  },
  { timestamps: true }
);

commentSchema.methods.commentJSON = function (user) {
  let following;
  if (!user) {
    following = false;
  } else {
    following = user.following.includes(this.author.id);
  }
  return {
    id: this.id,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    body: this.body,
    author: this.author.profileJSON(following),
  };
};

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
