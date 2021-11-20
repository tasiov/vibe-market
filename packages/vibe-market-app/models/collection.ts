import _ from "lodash"
import { PublicKey } from "@solana/web3.js"
import { Program } from "@project-serum/anchor"
import { BaseAnchorAccount, BaseAnchorAccountManager } from "./baseAnchor"

export const AccountType = "collection"

export interface CollectionAccount {
  nonce: number
  index: number
  listHead: string
  listTail: string
  title: string
}

export class Collection extends BaseAnchorAccount<CollectionAccount> {}

export class CollectionManager extends BaseAnchorAccountManager<
  CollectionAccount,
  Collection
> {
  constructor(program: Program) {
    super(program, AccountType)
  }

  isValid = (entity: any): entity is Collection =>
    entity instanceof Collection &&
    typeof entity.data.nonce === "number" &&
    typeof entity.data.index === "number" &&
    typeof entity.data.listHead === "string" &&
    typeof entity.data.listTail === "string" &&
    typeof entity.data.title === "string"

  toDomain = async (account: any, publicKey: PublicKey) => {
    const accountData = { ...account }
    accountData.listHead = accountData.listHead.toString()
    accountData.listTail = accountData.listTail.toString()
    return new Collection(publicKey, accountData)
  }
}
