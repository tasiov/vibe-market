import { PublicKey } from "@solana/web3.js"
import { getClusterConstants } from "../../constants"
import type { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"

const addAdmin = async (
  anchorAccountCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  addAminPublicKey: PublicKey
) => {
  if (!anchorAccountCache.isEnabled) {
    throw new Error("Application is not connected")
  }
  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")

  await anchorAccountCache.vibeMarketProgram.rpc.addAdmin({
    accounts: {
      admin: walletPublicKey,
      market: ADDRESS_VIBE_MARKET,
      addAdmin: addAminPublicKey,
    },
  })
}

export default addAdmin
