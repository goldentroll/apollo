import { SmartQuery, SmartSubscription } from './smart-apollo'

export class DollarApollo {
  constructor (vm) {
    this._apolloSubscriptions = []
    this._watchers = []

    this.vm = vm
    this.queries = {}
    this.subscriptions = {}
    this.client = undefined
  }

  get provider () {
    return this._apolloProvider || this.vm.$root._apolloProvider
  }

  _autoCollect (query) {
    if (this.provider._isCollecting) {
      let sub
      this.provider._waitFor(new Promise((resolve, reject) => {
        sub = query.subscribe({
          next: result => {
            if (!this.provider._collectingOptions.waitForLoaded || !result.loading) {
              resolve(result)
            }
          },
          error: error => {
            reject(error)
          },
        })
      }).then(result => {
        sub.unsubscribe()
        return result
      }, error => {
        sub.unsubscribe()
        return error
      }))
    }
    return query
  }

  query (options) {
    return this._autoCollect(this.getClient(options).query(options))
  }

  getClient (options) {
    if (!options || !options.client) {
      if (typeof this.client === 'object') {
        return this.client
      }
      if (this.client) {
        if (!this.provider.clients) {
          throw new Error(`[vue-apollo] Missing 'clients' options in 'apolloProvider'`)
        } else {
          const client = this.provider.clients[this.client]
          if (!client) {
            throw new Error(`[vue-apollo] Missing client '${this.client}' in 'apolloProvider'`)
          }
          return client
        }
      }
      return this.provider.defaultClient
    }
    const client = this.provider.clients[options.client]
    if (!client) {
      throw new Error(`[vue-apollo] Missing client '${options.client}' in 'apolloProvider'`)
    }
    return client
  }

  watchQuery (options) {
    const observable = this.getClient(options).watchQuery(options)
    const _subscribe = observable.subscribe.bind(observable)
    observable.subscribe = (options) => {
      let sub = _subscribe(options)
      this._apolloSubscriptions.push(sub)
      return sub
    }
    return this._autoCollect(observable)
  }

  mutate (options) {
    return this.getClient(options).mutate(options)
  }

  subscribe (options) {
    const observable = this.getClient(options).subscribe(options)
    const _subscribe = observable.subscribe.bind(observable)
    observable.subscribe = (options) => {
      let sub = _subscribe(options)
      this._apolloSubscriptions.push(sub)
      return sub
    }
    return observable
  }

  option (key, options) {
    this.queries[key] = new SmartQuery(this.vm, key, options)
  }

  subscribeOption (key, options) {
    this.subscriptions[key] = new SmartSubscription(this.vm, key, options)
  }

  defineReactiveSetter (key, func) {
    this._watchers.push(this.vm.$watch(func, value => {
      this[key] = value
    }, {
      immediate: true,
    }))
  }

  set skipAllQueries (value) {
    for (let key in this.queries) {
      this.queries[key].skip = value
    }
  }

  set skipAllSubscriptions (value) {
    for (let key in this.subscriptions) {
      this.subscriptions[key].skip = value
    }
  }

  set skipAll (value) {
    this.skipAllQueries = value
    this.skipAllSubscriptions = value
  }

  destroy () {
    for (const unwatch of this._watchers) {
      unwatch()
    }
    for (let key in this.queries) {
      this.queries[key].destroy()
    }
    for (let key in this.subscriptions) {
      this.subscriptions[key].destroy()
    }
    this._apolloSubscriptions.forEach((sub) => {
      sub.unsubscribe()
    })
    this._apolloSubscriptions = null
    this.vm = null
  }
}
