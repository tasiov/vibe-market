import * as GlobalState from "./globalState"
import * as Market from "./market"
import * as Collection from "./collection"
import * as NftBucket from "./nftBucket"

export const AccountMap = {
  [GlobalState.AccountType]: GlobalState,
  [Market.AccountType]: Market,
  [Collection.AccountType]: Collection,
  [NftBucket.AccountType]: NftBucket,
}

export type AccountTypes = keyof typeof AccountMap

export { GlobalState, Market, Collection, NftBucket }
