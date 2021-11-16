import { PublicKey } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor"
import { vibeMarketProgram } from "./constants"

export const getGlobalStateAddress = () =>
  PublicKey.findProgramAddress([Buffer.from("global")], vibeMarketProgram)

export const getCollectionAddress = (
  globalStateAddress: PublicKey,
  index: number
) =>
  PublicKey.findProgramAddress(
    [globalStateAddress.toBuffer(), new anchor.BN(index).toBuffer("le", 4)],
    vibeMarketProgram
  )

export const getListHeadAddress = (collectionAddress: PublicKey) =>
  PublicKey.findProgramAddress(
    [collectionAddress.toBuffer(), Buffer.from("head")],
    vibeMarketProgram
  )

export const getListTailAddress = (collectionAddress: PublicKey) =>
  PublicKey.findProgramAddress(
    [collectionAddress.toBuffer(), Buffer.from("tail")],
    vibeMarketProgram
  )
