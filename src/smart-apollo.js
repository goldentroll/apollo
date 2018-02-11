import omit from 'lodash.omit'
import { throttle, debounce } from './utils'

export default class SmartApollo {
  type = null
  vueApolloSpecialKeys = []

  constructor (vm, key, options, autostart = true) {
    this.vm = vm
    this.key = key
    this.options = Object.assign({}, options)
    this._skip = false
    this._watchers = []
    this._destroyed = false

    // Query callback
    if (typeof this.options.query === 'function') {
      const queryCb = this.options.query.bind(this.vm)
      this.options.query = queryCb()
      this._watchers.push(this.vm.$watch(queryCb, query => {
        this.options.query = query
        this.refresh()
      }))
    }
    // Query callback
    if (typeof this.options.document === 'function') {
      const queryCb = this.options.document.bind(this.vm)
      this.options.document = queryCb()
      this._watchers.push(this.vm.$watch(queryCb, document => {
        this.options.document = document
        this.refresh()
      }))
    }

    // Apollo context
    if (typeof this.options.context === 'function') {
      const cb = this.options.context.bind(this.vm)
      this.options.context = cb()
      this._watchers.push(this.vm.$watch(cb, context => {
        this.options.context = context
        this.refresh()
      }))
    }

    if (this.vm.$isServer) {
      this.options.fetchPolicy = 'cache-first'
    }

    if (autostart) {
      this.autostart()
    }
  }

  autostart () {
    if (typeof this.options.skip === 'function') {
      this._watchers.push(this.vm.$watch(this.options.skip.bind(this.vm), this.skipChanged.bind(this), {
        immediate: true,
      }))
    } else if (!this.options.skip) {
      this.start()
    } else {
      this._skip = true
    }
  }

  skipChanged (value, oldValue) {
    if (value !== oldValue) {
      this.skip = value
    }
  }

  get skip () {
    return this._skip
  }

  set skip (value) {
    if (value) {
      this.stop()
    } else {
      this.start()
    }
    this._skip = value
  }

  refresh () {
    if (!this._skip) {
      this.stop()
      this.start()
    }
  }

  start () {
    this.starting = true
    if (typeof this.options.variables === 'function') {
      let cb = this.executeApollo.bind(this)
      cb = this.options.throttle ? throttle(cb, this.options.throttle) : cb
      cb = this.options.debounce ? debounce(cb, this.options.debounce) : cb
      this.unwatchVariables = this.vm.$watch(() => this.options.variables.call(this.vm), cb, {
        immediate: true,
      })
    } else {
      this.executeApollo(this.options.variables)
    }
  }

  stop () {
    if (this.unwatchVariables) {
      this.unwatchVariables()
      this.unwatchVariables = null
    }

    if (this.sub) {
      this.sub.unsubscribe()
      this.sub = null
    }
  }

  generateApolloOptions (variables) {
    const apolloOptions = omit(this.options, this.vueApolloSpecialKeys)
    apolloOptions.variables = variables
    return apolloOptions
  }

  executeApollo (variables) {
    this.starting = false
  }

  nextResult () {
    throw new Error('Not implemented')
  }

  errorHandler (...args) {
    this.options.error && this.options.error.call(this.vm, ...args)
    this.vm.$apollo.error && this.vm.$apollo.error.call(this.vm, ...args)
    this.vm.$apollo.provider.errorHandler && this.vm.$apollo.provider.errorHandler.call(this.vm, ...args)
  }

  catchError (error) {
    if (error.graphQLErrors && error.graphQLErrors.length !== 0) {
      console.error(`GraphQL execution errors for ${this.type} '${this.key}'`)
      for (let e of error.graphQLErrors) {
        console.error(e)
      }
    } else if (error.networkError) {
      console.error(`Error sending the ${this.type} '${this.key}'`, error.networkError)
    } else {
      console.error(`[vue-apollo] An error has occured for ${this.type} '${this.key}'`)
      if (Array.isArray(error)) {
        console.error(...error)
      } else {
        console.error(error)
      }
    }

    this.errorHandler(error)
  }

  destroy () {
    if (this._destroyed) return

    this._destroyed = true
    this.stop()
    for (const unwatch of this._watchers) {
      unwatch()
    }
  }
}
