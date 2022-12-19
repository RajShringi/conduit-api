const express = require("express");
const auth = require("../middleware/auth");
const Article = require("../models/Article");
const Comment = require("../models/Comment");
const User = require("../models/User");
const router = express.Router();

// List Articles
router.get("/", auth.optionalVerify, async (req, res, next) => {
  const { tag, author, favorited, limit = 10, offset = 0 } = req.query;
  const query = {};
  if (tag) {
    query.tagList = tag;
  }
  if (author) {
    const { _id: authorId } = await User.findOne({ username: author });
    query.author = authorId;
  }
  if (favorited) {
    const { _id: favoritedById } = await User.findOne({ username: favorited });
    query.favoritedBy = favoritedById;
  }

  try {
    // const articles = await Article.find(query)
    //   .populate("author")
    //   .sort({ createdAt: -1 })
    //   .skip(offset)
    //   .limit(limit);

    let articles = await Article.find(query)
      .populate("author")
      .sort({ createdAt: -1 });

    const length = articles.length;
    articles.splice(0, offset);

    articles = articles.slice(0, limit);

    const currentUser = req.user && (await User.findById(req.user.userId));
    const returnArticlesFormat = articles.map((article) =>
      article.articleJSON(currentUser)
    );
    res.status(200).json({
      articles: returnArticlesFormat,
      articlesCount: length,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// Feed Articles
router.get("/feed", auth.verifyToken, async (req, res, next) => {
  const { limit = 10, offset = 0 } = req.query;
  try {
    const currentUser = await User.findById(req.user.userId);

    // const articles = await Article.find({
    //   author: { $in: currentUser.following },
    // })
    //   .populate("author")
    //   .sort({ createdAt: -1 })
    //   .skip(offset)
    //   .limit(limit);

    let articles = await Article.find({
      author: { $in: currentUser.following },
    })
      .populate("author")
      .sort({ createdAt: -1 });

    const length = articles.length;
    articles.splice(0, offset);

    articles = articles.slice(0, limit);

    const returnArticlesFormat = articles.map((article) =>
      article.articleJSON(currentUser)
    );
    res.status(200).json({
      articles: returnArticlesFormat,
      articlesCount: length,
    });
  } catch (error) {
    next(error);
  }
});

// Create Article
router.post("/", auth.verifyToken, async (req, res, next) => {
  try {
    const { title, description, body } = req.body.article;
    if (!title || !description || !body) {
      return res.status(400).json({
        errors: {
          error: "fields can't be empty",
        },
      });
    }
    req.body.article.author = req.user.userId;
    const article = await Article.create(req.body.article);
    const populateArticle = await article.populate("author");
    const currentUser = req.user && (await User.findById(req.user.userId));
    res.status(200).json({ article: populateArticle.articleJSON(currentUser) });
  } catch (error) {
    next(error);
  }
});

// Get Article
router.get("/:slug", auth.optionalVerify, async (req, res, next) => {
  const slug = req.params.slug;

  try {
    const article = await Article.findOne({ slug });
    if (!article) {
      return res
        .status(400)
        .json({ errors: { error: "can't find article in database" } });
    }

    const populateArticle = await article.populate("author");
    const currentUser = req.user && (await User.findById(req.user.userId));

    res.status(200).json({
      article: populateArticle.articleJSON(currentUser),
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// Update Article
router.put("/:slug", auth.verifyToken, async (req, res, next) => {
  const slug = req.params.slug;
  try {
    const article = await Article.findOne({ slug });

    if (!article) {
      return res
        .status(400)
        .json({ errors: { error: "can't find article in database" } });
    }

    if (!article.author.equals(req.user.userId)) {
      return res
        .status(400)
        .json({ errors: { error: "You don't own this article" } });
    }

    const updatedArticle = await Article.findOneAndUpdate(
      { slug },
      req.body.article,
      {
        new: true,
      }
    );
    const populateArticle = await updatedArticle.populate("author");
    const currentUser = req.user && (await User.findById(req.user.userId));

    res.status(200).json({ article: populateArticle.articleJSON(currentUser) });
  } catch (error) {
    next(error);
  }
});

// Delete Article
router.delete("/:slug", auth.verifyToken, async (req, res, next) => {
  const slug = req.params.slug;
  try {
    const article = await Article.findOne({ slug });
    if (!article) {
      return res
        .status(400)
        .json({ errors: { error: "can't find article in database" } });
    }
    if (!article.author.equals(req.user.userId)) {
      return res
        .status(400)
        .json({ errors: { error: "You don't own this article" } });
    }
    const deletedArticle = await Article.findOneAndDelete({ slug });
    await Comment.deleteMany({ articleId: article.id });
    const populateArticle = await deletedArticle.populate("author");
    const currentUser = req.user && (await User.findById(req.user.userId));
    res.status(200).json({ article: populateArticle.articleJSON(currentUser) });
  } catch (error) {
    next(error);
  }
});

// Favorite Article
router.post("/:slug/favorite", auth.verifyToken, async (req, res, next) => {
  const slug = req.params.slug;
  try {
    const article = await Article.findOneAndUpdate(
      { slug },
      { $addToSet: { favoritedBy: req.user.userId } },
      { new: true }
    );
    if (!article) {
      return res
        .status(400)
        .json({ errors: { error: `can't find ${slug} in database` } });
    }
    const populateArticle = await article.populate("author");
    const currentUser = req.user && (await User.findById(req.user.userId));
    res.status(200).json({ article: populateArticle.articleJSON(currentUser) });
  } catch (error) {
    next(error);
  }
});

// Unfavorite Article
router.delete("/:slug/favorite", auth.verifyToken, async (req, res, next) => {
  const slug = req.params.slug;
  try {
    const article = await Article.findOneAndUpdate(
      { slug },
      { $pull: { favoritedBy: req.user.userId } },
      { new: true }
    );
    if (!article) {
      return res
        .status(400)
        .json({ errors: { error: `can't find ${slug} in database` } });
    }
    const populateArticle = await article.populate("author");
    const currentUser = req.user && (await User.findById(req.user.userId));

    res.status(200).json({ article: populateArticle.articleJSON(currentUser) });
  } catch (error) {
    next(error);
  }
});

// Add Comments to an Article
router.post("/:slug/comments", auth.verifyToken, async (req, res, next) => {
  const slug = req.params.slug;
  try {
    const article = await Article.findOne({ slug });
    if (!article) {
      return res
        .status(400)
        .json({ errors: { error: `can't find ${slug} in database` } });
    }
    req.body.comment.author = req.user.userId;
    req.body.comment.articleId = article.id;
    const comment = await (
      await Comment.create(req.body.comment)
    ).populate("author");
    const updatedArticle = await Article.findOneAndUpdate(
      { slug },
      { $push: { comments: comment.id } }
    );
    const currentUser = await User.findById(req.user.userId);
    res.status(200).json({ comment: comment.commentJSON(currentUser) });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// Get Comments from an Article
router.get("/:slug/comments", auth.optionalVerify, async (req, res, next) => {
  const slug = req.params.slug;
  try {
    const article = await Article.findOne({ slug }).populate("comments");

    if (!article) {
      return res
        .status(400)
        .json({ errors: { error: `can't find ${slug} in database` } });
    }
    const comments = await Comment.find({ articleId: article.id }).populate(
      "author"
    );

    const currentUser = req.user && (await User.findById(req.user.userId));
    const returnFormatComments = comments.map((comment) =>
      comment.commentJSON(currentUser)
    );
    res.status(200).json({ comments: returnFormatComments });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// Delete Comment
router.delete(
  "/:slug/comments/:id",
  auth.verifyToken,
  async (req, res, next) => {
    const slug = req.params.slug;
    const commentId = req.params.id;
    try {
      const article = await Article.findOne({ slug });
      if (!article) {
        return res
          .status(400)
          .json({ errors: { error: `can't find ${slug} in database` } });
      }
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res
          .status(400)
          .json({ errors: { error: `can't find comment in database` } });
      }

      if (!comment.author.equals(req.user.userId)) {
        return res.status(400).json({
          errors: { error: `You cannot delete articles created by others` },
        });
      }

      await Article.findOneAndUpdate(
        { slug },
        { $pull: { comments: commentId } }
      );
      await Comment.findByIdAndDelete(commentId);
      res.status(200).json({ msg: "Comment deleted successfully" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

module.exports = router;
