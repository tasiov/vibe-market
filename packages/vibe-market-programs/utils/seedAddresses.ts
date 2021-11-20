import { PublicKey } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor"
import { vibeMarketProgramId } from "./constants"

export const getGlobalStateAddress = () =>
  PublicKey.findProgramAddress([Buffer.from("global")], vibeMarketProgramId)

export const getMarketAddress = (
  globalStateAddress: PublicKey,
  index: number
) =>
  anchor.web3.PublicKey.findProgramAddress(
    [globalStateAddress.toBuffer(), new anchor.BN(index).toBuffer("le", 4)],
    vibeMarketProgramId
  )

export const getCollectionAddress = (marketAddress: PublicKey, index: number) =>
  PublicKey.findProgramAddress(
    [
      marketAddress.toBuffer(),
      new anchor.BN(index).toBuffer("le", 4),
      Buffer.from("collection"),
    ],
    vibeMarketProgramId
  )

export const getListHeadAddress = (collectionAddress: PublicKey) =>
  PublicKey.findProgramAddress(
    [collectionAddress.toBuffer(), Buffer.from("head")],
    vibeMarketProgramId
  )

export const getListTailAddress = (collectionAddress: PublicKey) =>
  PublicKey.findProgramAddress(
    [collectionAddress.toBuffer(), Buffer.from("tail")],
    vibeMarketProgramId
  )

export const getPriceModelAddress = (marketAddress: PublicKey, index: number) =>
  PublicKey.findProgramAddress(
    [
      marketAddress.toBuffer(),
      new anchor.BN(index).toBuffer("le", 4),
      Buffer.from("price_model"),
    ],
    vibeMarketProgramId
  )
