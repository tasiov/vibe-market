import _ from "lodash"
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

export const getCollectionAddress = (
  marketAddress: PublicKey,
  index: number
) => {
  const { PROGRAM_VIBE_MARKET } = getClusterConstants("PROGRAM_VIBE_MARKET")
  const indexBuffer = Uint8Array.from(new anchor.BN(index).toArray("le", 4))
  return PublicKey.findProgramAddress(
    [marketAddress.toBuffer(), indexBuffer, Buffer.from("collection")],
    PROGRAM_VIBE_MARKET
  )
}

export const getCollectionAddresses = (
  marketAddress: PublicKey,
  numCollections: number
) =>
  Promise.all(
    _.map(_.range(numCollections), async (index) => {
      const retval = await getCollectionAddress(marketAddress, index)
      return retval[0]
    })
  )

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
