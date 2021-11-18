import _ from "lodash"
import { PublicKey } from "@solana/web3.js"
import { Program } from "@project-serum/anchor"
import { BaseAnchorAccount, BaseAnchorAccountManager } from "./baseAnchor"

export const AccountType = "globalState"

export interface GlobalStateAccount {
  nonce: number
  numMarkets: number
}

export class GlobalState extends BaseAnchorAccount<GlobalStateAccount> {}

export class GlobalStateManager extends BaseAnchorAccountManager<
  GlobalStateAccount,
  GlobalState
> {
  constructor(program: Program) {
    super(program, AccountType)
  }

  isValid = (entity: any): entity is GlobalState =>
    entity instanceof GlobalState &&
    typeof entity.data.nonce === "number" &&
    typeof entity.data.numMarkets === "number"

  toDomain = async (account: any, publicKey: PublicKey) => {
    return new GlobalState(publicKey, account)
  }
}
