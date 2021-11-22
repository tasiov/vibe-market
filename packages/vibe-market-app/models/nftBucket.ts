import _ from "lodash"
import { PublicKey } from "@solana/web3.js"
import { Program } from "@project-serum/anchor"
import { BaseAnchorAccount, BaseAnchorAccountManager } from "./baseAnchor"
import { VibeMarket } from "../solana/vibeMarket"

export const AccountType = "nftBucket"

export interface NftBucketAccount {
  nonce: number
  tokenAccount: string
  priceModel: string
  prevListItem: string
  nextListItem: string
  payer: string
}

export class NftBucket extends BaseAnchorAccount<NftBucketAccount> {}

export class NftBucketManager extends BaseAnchorAccountManager<
  NftBucketAccount,
  NftBucket
> {
  constructor(program: Program<VibeMarket>) {
    super(program, AccountType)
  }

  isValid = (entity: any): entity is NftBucket =>
    entity instanceof NftBucket &&
    typeof entity.data.nonce === "number" &&
    typeof entity.data.tokenAccount === "string" &&
    typeof entity.data.priceModel === "string" &&
    typeof entity.data.prevListItem === "string" &&
    typeof entity.data.nextListItem === "string" &&
    typeof entity.data.payer === "string"

  toDomain = async (account: any, publicKey: PublicKey) => {
    const accountData = { ...account }
    accountData.tokenAccount = accountData.tokenAccount.toString()
    accountData.priceModel = accountData.priceModel.toString()
    accountData.prevListItem = accountData.prevListItem.toString()
    accountData.nextListItem = accountData.nextListItem.toString()
    accountData.payer = accountData.payer.toString()
    return new NftBucket(publicKey, accountData)
  }
}
