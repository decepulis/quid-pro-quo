const postcssNormalize = require("postcss-normalize");

module.exports = {
  plugins: [
    postcssNormalize(),
    require("autoprefixer"),
    require("cssnano")({
      preset: "default"
    })
  ]
};
