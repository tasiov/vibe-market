import * as GlobalState from "./globalState"
import * as Market from "./market"

export const AccountMap = {
  [GlobalState.AccountType]: GlobalState,
  [Market.AccountType]: Market,
}

export type AccountTypes = keyof typeof AccountMap

export { GlobalState, Market }
