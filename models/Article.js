const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
const User = require("./User");
const Schema = mongoose.Schema;

mongoose.plugin(slug);

const articleSchema = new Schema(
  {
    slug: { type: String, slug: "title", unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    body: { type: String, required: true },
    tagList: [{ type: String }],
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    favoritedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

articleSchema.methods.articleJSON = function (currentUser) {
  let isFavorited, isFollowing;
  if (currentUser) {
    isFavorited = this.favoritedBy.includes(currentUser.id);
    isFollowing = currentUser.following.includes(this.author.id);
  } else {
    (isFavorited = false), (isFollowing = false);
  }

  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    tagList: this.tagList,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    favorited: isFavorited,
    favoritesCount: this.favoritedBy.length,
    author: {
      username: this.author.username,
      bio: this.author.bio,
      image: this.author.image,
      following: isFollowing,
    },
  };
};

const Article = mongoose.model("Article", articleSchema);

module.exports = Article;
