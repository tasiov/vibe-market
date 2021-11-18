import { PublicKey } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor"
import { getClusterConstants } from "../constants"

export const getGlobalStateAddress = () => {
  const { PROGRAM_VIBE_MARKET } = getClusterConstants("PROGRAM_VIBE_MARKET")
  return PublicKey.findProgramAddress(
    [Buffer.from("global")],
    PROGRAM_VIBE_MARKET
  )
}

export const getMarketAddress = (
  globalStateAddress: PublicKey,
  index: number
) => {
  const { PROGRAM_VIBE_MARKET } = getClusterConstants("PROGRAM_VIBE_MARKET")
  return anchor.web3.PublicKey.findProgramAddress(
    [globalStateAddress.toBuffer(), new anchor.BN(index).toBuffer("le", 4)],
    PROGRAM_VIBE_MARKET
  )
}

export const getCollectionAddress = (
  globalStateAddress: PublicKey,
  index: number
) => {
  const { PROGRAM_VIBE_MARKET } = getClusterConstants("PROGRAM_VIBE_MARKET")
  return PublicKey.findProgramAddress(
    [globalStateAddress.toBuffer(), new anchor.BN(index).toBuffer("le", 4)],
    PROGRAM_VIBE_MARKET
  )
}

export const getListHeadAddress = (collectionAddress: PublicKey) => {
  const { PROGRAM_VIBE_MARKET } = getClusterConstants("PROGRAM_VIBE_MARKET")
  return PublicKey.findProgramAddress(
    [collectionAddress.toBuffer(), Buffer.from("head")],
    PROGRAM_VIBE_MARKET
  )
}

export const getListTailAddress = (collectionAddress: PublicKey) => {
  const { PROGRAM_VIBE_MARKET } = getClusterConstants("PROGRAM_VIBE_MARKET")
  return PublicKey.findProgramAddress(
    [collectionAddress.toBuffer(), Buffer.from("tail")],
    PROGRAM_VIBE_MARKET
  )
}
