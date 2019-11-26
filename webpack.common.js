const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    index: './src/scripts/index.js',
    about: './src/scripts/about.js',
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/pages/index.pug',
      chunks: ['index']
    }),
    new HtmlWebpackPlugin({
      filename: 'about/index.html',
      template: 'src/pages/about.pug',
      chunks: ['about']
    }),
  ],
  module: {
    rules: [
      { 
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }, {
        test: /\.pug$/,
        exclude: /node_modules/,
        loader: 'pug-loader',
      }, {
        test: /\.(png|jpe?g|gif)$/,
        include: [path.resolve(__dirname, 'src/img')],
        use: [
          {
            loader: 'url-loader',
            options: { 
              limit: 10 * 1024,
              fallback: 'file-loader',
              outputPath: 'img'
            },
          }, 
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: { progressive: true, quality: 65 },
              optipng: { enabled: false, },
              pngquant: { quality: '65-90', speed: 4 },
              gifsicle: { interlaced: false, },
            }
          }
        ]
      }, {
        test: /\.svg$/,
        include: [path.resolve(__dirname, 'src/img')],
        use: [
          {
            loader: 'svg-url-loader',
            options: {
              limit: 10 * 1024,
              noquotes: true,
              outputPath: 'img'
            },
          }, {
            loader: 'image-webpack-loader'
          }
        ]
      }, {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'font'
            }
          },
        ]
      }
    ]
  },
};