import { Component, Vue } from 'vue-property-decorator'
import gql from 'graphql-tag'
import { OperationVariables } from 'apollo-client'
import { VueApolloComponentOptions } from '../options'

@Component({
  apollo: {
    allFilms: {
      query: gql``,
      variables (): OperationVariables {
        return {
          foo: this.foo
        }
      }
    },
  } as VueApolloComponentOptions<Decorator>,
})
export default class Decorator extends Vue {
  allFilms = []
  foo = 'bar'
}
