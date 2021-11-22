import _ from "lodash"
import BN from "bn.js"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import { getClusterConstants } from "../../constants"
import { getPriceModelAddress } from "../seedAddresses"
import type { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"
import { SalePrice } from "../../models/priceModel"
import { assert } from "../../utils/assert"

const createPriceModel = async (
  anchorAccountCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  salePrices: SalePrice[]
) => {
  if (!anchorAccountCache.isEnabled) {
    throw new Error("Application is not connected")
  }
  assert(salePrices.length <= 8, "Cannot have more than 8 mints")

  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")

  const market = await anchorAccountCache.fetch("market", ADDRESS_VIBE_MARKET)
  const [priceModelAddress, priceModelAddressNonce] =
    await getPriceModelAddress(ADDRESS_VIBE_MARKET, market.data.numPriceModels)

  const adjustedSalePrices = _.map(salePrices, (salePrice) => ({
    mint: new PublicKey(salePrice.mint),
    amount: new BN(salePrice.amount * 9),
  }))

  await anchorAccountCache.vibeMarketProgram.rpc.initPriceModel(
    priceModelAddressNonce,
    adjustedSalePrices,
    {
      accounts: {
        admin: walletPublicKey,
        market: ADDRESS_VIBE_MARKET,
        priceModel: priceModelAddress,
        systemProgram: SystemProgram.programId,
      },
    }
  )
}

export default createPriceModel
