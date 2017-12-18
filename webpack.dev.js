const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = merge(common, {
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist'
  }
  // plugins: [
  //   new BundleAnalyzerPlugin({
  //     analyzerHost: '0.0.0.0',
  //     analyzerPort: 8081
  //   })
  // ]
})
