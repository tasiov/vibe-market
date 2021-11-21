import { PublicKey } from "@solana/web3.js"
import { getClusterConstants } from "../../constants"
import type { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"

const removeAdmin = async (
  anchorAccountCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  removeAdminPublicKey: PublicKey
) => {
  if (!anchorAccountCache.isEnabled) {
    throw new Error("Application is not connected")
  }
  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")

  await anchorAccountCache.vibeMarketProgram.rpc.removeAdmin({
    accounts: {
      admin: walletPublicKey,
      market: ADDRESS_VIBE_MARKET,
      removeAdmin: removeAdminPublicKey,
    },
  })
}

export default removeAdmin
