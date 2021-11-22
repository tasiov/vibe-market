import { PublicKey } from "@solana/web3.js"
import { getClusterConstants } from "../../constants"
import { getListHeadAddress, getListTailAddress } from "../seedAddresses"
import type { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"

const closeCollection = async (
  anchorAccountCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  collectionAddress: PublicKey
) => {
  if (!anchorAccountCache.isEnabled) {
    throw new Error("Application is not connected")
  }
  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const [listHeadAddress] = await getListHeadAddress(collectionAddress)
  const [listTailAddress] = await getListTailAddress(collectionAddress)
  const listHead = await anchorAccountCache.fetch("nftBucket", listHeadAddress)
  const rentRefundAddress = new PublicKey(listHead.data.payer)

  await anchorAccountCache.vibeMarketProgram.rpc.closeCollection({
    accounts: {
      admin: walletPublicKey,
      market: ADDRESS_VIBE_MARKET,
      rentRefund: rentRefundAddress,
      collection: collectionAddress,
      listHead: listHeadAddress,
      listTail: listTailAddress,
    },
  })
}

export default closeCollection
