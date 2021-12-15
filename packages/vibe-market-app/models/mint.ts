import _ from "lodash"
import BN from "bn.js"
import { Connection, PublicKey } from "@solana/web3.js"
import { BaseRawAccount, BaseRawAccountManager } from "./baseRaw"
import { MintLayout, u64 } from "@solana/spl-token"

export const AccountType = "hMint"

export interface HMintAccount {
  decimals: number
  mintAuthorityOption: number
  supply: BN
  freezeAuthorityOption: number
  isInitialized: boolean
  mintAuthority: string | undefined
  freezeAuthority: string | undefined
}

export class HMint extends BaseRawAccount<HMintAccount> {}

export class HMintManager extends BaseRawAccountManager<HMintAccount, HMint> {
  constructor(connection: Connection) {
    super(connection, AccountType)
  }

  isValid = (entity: any): entity is HMint => {
    return (
      typeof entity.data.decimals === "number" &&
      typeof entity.data.mintAuthorityOption === "number" &&
      entity.data.supply instanceof BN &&
      typeof entity.data.freezeAuthorityOption === "number" &&
      typeof entity.data.isInitialized === "boolean" &&
      (entity.data.mintAuthority === undefined ||
        typeof entity.data.mintAuthority === "string") &&
      (entity.data.freezeAuthority === undefined ||
        typeof entity.data.freezeAuthority === "string")
    )
  }

  toDomain = async (account: any, publicKey: PublicKey) => {
    const data = Buffer.from(account.data)
    const mintInfo = MintLayout.decode(data)

    if (mintInfo.mintAuthorityOption === 0) {
      mintInfo.mintAuthority = undefined
    } else {
      mintInfo.mintAuthority = new PublicKey(mintInfo.mintAuthority).toString()
    }

    mintInfo.supply = u64.fromBuffer(mintInfo.supply).clone()
    mintInfo.isInitialized = mintInfo.isInitialized != 0

    if (mintInfo.freezeAuthorityOption === 0) {
      mintInfo.freezeAuthority = undefined
    } else {
      mintInfo.freezeAuthority = new PublicKey(
        mintInfo.freezeAuthority
      ).toString()
    }

    return new HMint(publicKey, mintInfo)
  }
}
