import _ from "lodash"
import { PublicKey } from "@solana/web3.js"
import { Program } from "@project-serum/anchor"
import { BaseAnchorAccount, BaseAnchorAccountManager } from "./baseAnchor"

export const AccountType = "market"

export interface MarketAccount {
  nonce: number
  whitelist: string[]
  numCollections: number
}

export class Market extends BaseAnchorAccount<MarketAccount> {}

export class MarketManager extends BaseAnchorAccountManager<
  MarketAccount,
  Market
> {
  constructor(program: Program) {
    super(program, AccountType)
  }

  isValid = (entity: any): entity is Market =>
    entity instanceof Market &&
    typeof entity.data.nonce === "number" &&
    typeof entity.data.numCollections === "number" &&
    typeof entity.data.whitelist.length === "number"

  toDomain = async (account: any, publicKey: PublicKey) => {
    const accountData = { ...account }
    accountData.whitelist = _.map(accountData.whitelist, (publicKey) =>
      publicKey.toString()
    )
    accountData.numCollections = accountData.numCollections.toNumber()
    return new Market(publicKey, accountData)
  }
}
