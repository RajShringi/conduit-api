var jwt = require("jsonwebtoken");

module.exports = {
  verifyToken: async function (req, res, next) {
    let token = req.headers.authorization;
    try {
      if (token) {
        token = token.includes("Token") ? token.split(" ")[1] : token;
        const payload = await jwt.verify(token, process.env.JWT_TOKEN_SECRET);
        req.user = payload;
        return next();
      } else {
        return res.status(400).json({
          errors: {
            error: "Token Required",
          },
        });
      }
    } catch (error) {
      next(error);
    }
  },

  optionalVerify: async function (req, res, next) {
    let token = req.headers.authorization;
    try {
      if (token) {
        token = token.split(" ")[1];
        const payload = await jwt.verify(token, process.env.JWT_TOKEN_SECRET);
        req.user = payload;
        return next();
      } else {
        req.user = null;
        return next();
      }
    } catch (error) {
      next(error);
    }
  },
};
