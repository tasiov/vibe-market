import * as GlobalState from "./globalState"
import * as Market from "./market"
import * as Collection from "./collection"
import * as NftBucket from "./nftBucket"
import * as PriceModel from "./priceModel"
import * as HToken from "./tokenAccount"
import * as HMint from "./mint"

export const AccountMap = {
  [GlobalState.AccountType]: GlobalState,
  [Market.AccountType]: Market,
  [Collection.AccountType]: Collection,
  [NftBucket.AccountType]: NftBucket,
  [PriceModel.AccountType]: PriceModel,
  [PriceModel.AccountType]: PriceModel,
  [HToken.AccountType]: HToken,
  [HMint.AccountType]: HMint,
}

export type AccountTypes = keyof typeof AccountMap

export { GlobalState, Market, Collection, NftBucket, PriceModel, HToken, HMint }
