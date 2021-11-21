import _ from "lodash"
import { PublicKey } from "@solana/web3.js"
import { Program } from "@project-serum/anchor"
import { BaseAnchorAccount, BaseAnchorAccountManager } from "./baseAnchor"
import { VibeMarket } from "../solana/vibeMarket"

export const AccountType = "market"

export interface MarketAccount {
  nonce: number
  index: number
  whitelist: string[]
  numCollections: number
  numPriceModels: number
  title: number
}

export class Market extends BaseAnchorAccount<MarketAccount> {}

export class MarketManager extends BaseAnchorAccountManager<
  MarketAccount,
  Market
> {
  constructor(program: Program<VibeMarket>) {
    super(program, AccountType)
  }

  isValid = (entity: any): entity is Market =>
    entity instanceof Market &&
    typeof entity.data.nonce === "number" &&
    typeof entity.data.index === "number" &&
    typeof entity.data.whitelist.length === "number" &&
    typeof entity.data.numCollections === "number" &&
    typeof entity.data.numPriceModels === "number" &&
    typeof entity.data.title === "string"

  toDomain = async (account: any, publicKey: PublicKey) => {
    const accountData = { ...account }
    accountData.whitelist = _.map(accountData.whitelist, (publicKey) =>
      publicKey.toString()
    )
    return new Market(publicKey, accountData)
  }
}
