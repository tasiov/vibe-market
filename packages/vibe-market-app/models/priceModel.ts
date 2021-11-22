import _ from "lodash"
import { PublicKey } from "@solana/web3.js"
import { Program } from "@project-serum/anchor"
import { BaseAnchorAccount, BaseAnchorAccountManager } from "./baseAnchor"
import { VibeMarket } from "../solana/vibeMarket"

export const AccountType = "priceModel"

export type SalePrice = { mint: string; amount: number }

export interface PriceModelAccount {
  nonce: number
  index: number
  market: string
  salePrices: SalePrice[]
}

export class PriceModel extends BaseAnchorAccount<PriceModelAccount> {}

export class PriceModelManager extends BaseAnchorAccountManager<
  PriceModelAccount,
  PriceModel
> {
  constructor(program: Program<VibeMarket>) {
    super(program, AccountType)
  }

  isValid = (entity: any): entity is PriceModel =>
    entity instanceof PriceModel &&
    typeof entity.data.nonce === "number" &&
    typeof entity.data.index === "number" &&
    typeof entity.data.market === "string" &&
    typeof entity.data.salePrices.length === "number"

  toDomain = async (account: any, publicKey: PublicKey) => {
    console.log("account", account)
    const accountData = { ...account }
    accountData.market = accountData.market.toString()
    accountData.salePrices = _.forEach(accountData.salePrices, (salePrice) => {
      salePrice.mint = salePrice.mint.toString()
      salePrice.amount = salePrice.amount.toNumber()
    })
    return new PriceModel(publicKey, accountData)
  }
}
