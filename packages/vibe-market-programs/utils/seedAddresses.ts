import { PublicKey } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor"
import { vibeMarketProgramId } from "./constants"

export const getGlobalStateAddress = () => {
  return PublicKey.findProgramAddress(
    [Buffer.from("global")],
    vibeMarketProgramId
  )
}

export const getMarketAddress = (
  globalStateAddress: PublicKey,
  index: number
) =>
  anchor.web3.PublicKey.findProgramAddress(
    [globalStateAddress.toBuffer(), new anchor.BN(index).toBuffer("le", 4)],
    vibeMarketProgramId
  )

export const getCollectionAddress = (
  globalStateAddress: PublicKey,
  index: number
) =>
  PublicKey.findProgramAddress(
    [globalStateAddress.toBuffer(), new anchor.BN(index).toBuffer("le", 4)],
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
