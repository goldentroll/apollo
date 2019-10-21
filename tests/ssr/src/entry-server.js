import 'isomorphic-fetch'
import ApolloSSR from 'vue-apollo/ssr'
import { createApp } from './main'

const prepareUrlForRouting = url => {
  const { BASE_URL } = process.env
  return url.startsWith(BASE_URL.replace(/\/$/, ''))
    ? url.substr(BASE_URL.length)
    : url
}

export default context => {
  return new Promise(async (resolve, reject) => {
    const {
      app,
      router,
      apolloProvider
    } = await createApp()

    router.push(prepareUrlForRouting(context.url))

    router.onReady(() => {
      context.rendered = () => {
        // Same for Apollo client cache
        context.apolloState = ApolloSSR.getStates(apolloProvider)
      }
      resolve(app)
    }, reject)
  })
}
