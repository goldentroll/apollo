import SmartApollo from './smart-apollo'

export default class SmartSubscription extends SmartApollo {
  type = 'subscription'
  vueApolloSpecialKeys = [
    'variables',
    'result',
    'error',
    'throttle',
    'debounce',
    'linkedQuery',
  ]

  executeApollo (variables) {
    const variablesJson = JSON.stringify(variables)
    if (this.sub) {
      // do nothing if subscription is already running using exactly the same variables
      if (variablesJson === this.previousVariablesJson) {
        return
      }
      this.sub.unsubscribe()
    }
    this.previousVariablesJson = variablesJson

    const apolloOptions = this.generateApolloOptions(variables)

    if (typeof apolloOptions.updateQuery === 'function') {
      apolloOptions.updateQuery = apolloOptions.updateQuery.bind(this.vm)
    }

    if (this.options.linkedQuery) {
      if (typeof this.options.result === 'function') {
        const rcb = this.options.result.bind(this.vm)
        const ucb = apolloOptions.updateQuery && apolloOptions.updateQuery.bind(this.vm)
        apolloOptions.updateQuery = (...args) => {
          rcb(...args)
          ucb && ucb(...args)
        }
      }
      this.sub = this.options.linkedQuery.subscribeToMore(apolloOptions)
    } else {
      // Create observer
      this.observer = this.vm.$apollo.subscribe(apolloOptions)

      // Create subscription
      this.sub = this.observer.subscribe({
        next: this.nextResult.bind(this),
        error: this.catchError.bind(this),
      })
    }

    super.executeApollo(variables)
  }

  nextResult (data) {
    super.nextResult(data)

    if (typeof this.options.result === 'function') {
      this.options.result.call(this.vm, data)
    }
  }
}
