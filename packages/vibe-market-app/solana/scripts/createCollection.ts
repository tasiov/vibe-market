import { PublicKey, SystemProgram } from "@solana/web3.js"
import { getClusterConstants } from "../../constants"
import {
  getCollectionAddress,
  getGlobalStateAddress,
  getListHeadAddress,
  getListTailAddress,
} from "../seedAddresses"
import type { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"
import { assert } from "../../utils/assert"

export const createCollection = async (
  anchorAccountCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  title: String
) => {
  if (!anchorAccountCache.isEnabled) {
    throw new Error("Application is not connected")
  }
  assert(title.length <= 32, "Title length exceed 32 characters")
  assert(title.length > 0, "Title must not be empty")

  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")

  const market = await anchorAccountCache.fetch("market", ADDRESS_VIBE_MARKET)
  const [globalStateAddress] = await getGlobalStateAddress()
  const [collectionAddress, collectionAddressNonce] =
    await getCollectionAddress(ADDRESS_VIBE_MARKET, market.data.numCollections)
  const [listHeadAddress, listHeadAddressNonce] = await getListHeadAddress(
    collectionAddress
  )
  const [listTailAddress, listTailAddressNonce] = await getListTailAddress(
    collectionAddress
  )
  await anchorAccountCache.vibeMarketProgram.rpc.initCollection(
    collectionAddressNonce,
    listHeadAddressNonce,
    listTailAddressNonce,
    title,
    {
      accounts: {
        admin: walletPublicKey,
        market: market.publicKey,
        collection: collectionAddress,
        listHead: listHeadAddress,
        listTail: listTailAddress,
        systemProgram: SystemProgram.programId,
      },
    }
  )
}
