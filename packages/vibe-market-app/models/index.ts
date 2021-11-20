import * as GlobalState from "./globalState"
import * as Market from "./market"
import * as Collection from "./collection"

export const AccountMap = {
  [GlobalState.AccountType]: GlobalState,
  [Market.AccountType]: Market,
  [Collection.AccountType]: Collection,
}

export type AccountTypes = keyof typeof AccountMap

export { GlobalState, Market, Collection }
