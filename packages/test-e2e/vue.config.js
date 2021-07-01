/** @type {import('@vue/cli-service').ProjectOptions} */
module.exports = {
  // pluginOptions: {
  //   apollo: {
  //     enableMocks: false,
  //     enableEngine: false,
  //   },
  // },

  productionSourceMap: false,

  /* Without vue-cli-plugin-apollo 0.20.0+ */
  // chainWebpack: config => {
  //   config.module
  //     .rule('vue')
  //     .use('vue-loader')
  //       .loader('vue-loader')
  //       .tap(options => {
  //         options.transpileOptions = {
  //           transforms: {
  //             dangerousTaggedTemplateString: true,
  //           },
  //         }
  //         return options
  //       })
  // }

  chainWebpack: config => {
    config.module.rule('graphql')
      .test(/\.gql$/)
      .use('graphql-tag/loader')
      .loader('graphql-tag/loader')
      .end()
  },
}
