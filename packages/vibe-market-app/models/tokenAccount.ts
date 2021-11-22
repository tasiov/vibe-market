import _ from "lodash"
import { Connection, PublicKey } from "@solana/web3.js"
import { BaseRawAccount, BaseRawAccountManager } from "./baseRaw"
import { AccountLayout, u64 } from "@solana/spl-token"

export const AccountType = "hTokenAcount"

export interface HTokenAccount {
  isFrozen: boolean
  isInitialized: boolean
  isNative: boolean
  amount: number
  closeAuthorityOption: number
  delegateOption: number
  delegatedAmount: number
  isNativeOption: number
  state: number
  rentExemptReserve: number | undefined
  mint: string
  owner: string
  closeAuthority: string | undefined
  delegate: string | undefined
}

export class HToken extends BaseRawAccount<HTokenAccount> {}

export class HTokenManager extends BaseRawAccountManager<
  HTokenAccount,
  HToken
> {
  constructor(connection: Connection) {
    super(connection, AccountType)
  }

  isValid = (entity: any): entity is HToken => {
    return (
      entity instanceof HToken &&
      typeof entity.data.isFrozen === "boolean" &&
      typeof entity.data.isInitialized === "boolean" &&
      typeof entity.data.isNative === "boolean" &&
      typeof entity.data.amount === "number" &&
      typeof entity.data.closeAuthorityOption === "number" &&
      typeof entity.data.delegateOption === "number" &&
      typeof entity.data.delegatedAmount === "number" &&
      typeof entity.data.isNativeOption === "number" &&
      typeof entity.data.state === "number" &&
      (entity.data.rentExemptReserve === undefined ||
        typeof entity.data.rentExemptReserve === "number") &&
      typeof entity.data.mint === "string" &&
      typeof entity.data.owner === "string" &&
      (entity.data.closeAuthority === undefined ||
        typeof entity.data.closeAuthority === "string") &&
      (entity.data.delegate === undefined ||
        typeof entity.data.delegate === "string")
    )
  }

  toDomain = async (account: any, publicKey: PublicKey) => {
    const data = Buffer.from(account.data)
    const accountInfo = AccountLayout.decode(data)

    accountInfo.mint = new PublicKey(accountInfo.mint).toString()
    accountInfo.owner = new PublicKey(accountInfo.owner).toString()
    accountInfo.amount = u64.fromBuffer(accountInfo.amount).toNumber()

    if (accountInfo.delegateOption === 0) {
      accountInfo.delegate = undefined
      accountInfo.delegatedAmount = new u64(0).toNumber()
    } else {
      accountInfo.delegate = new PublicKey(accountInfo.delegate).toString()
      accountInfo.delegatedAmount = u64
        .fromBuffer(accountInfo.delegatedAmount)
        .toNumber()
    }

    accountInfo.isInitialized = accountInfo.state !== 0
    accountInfo.isFrozen = accountInfo.state === 2

    if (accountInfo.isNativeOption === 1) {
      accountInfo.rentExemptReserve = u64
        .fromBuffer(accountInfo.isNative)
        .toNumber()
      accountInfo.isNative = true
    } else {
      accountInfo.rentExemptReserve = undefined
      accountInfo.isNative = false
    }

    if (accountInfo.closeAuthorityOption === 0) {
      accountInfo.closeAuthority = undefined
    } else {
      accountInfo.closeAuthority = new PublicKey(
        accountInfo.closeAuthority
      ).toString()
    }

    return new HToken(publicKey, accountInfo)
  }
}
