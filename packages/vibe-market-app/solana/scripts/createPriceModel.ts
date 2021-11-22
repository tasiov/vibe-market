import _ from "lodash"
import BN from "bn.js"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import { getClusterConstants } from "../../constants"
import { getPriceModelAddress } from "../seedAddresses"
import type { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"
import { SalePrice } from "../../models/priceModel"
import { assert } from "../../utils/assert"
import { toRawAmount } from "../tokenConversion"

const createPriceModel = async (
  anchorAccountCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  salePrices: SalePrice[]
) => {
  if (!anchorAccountCache.isEnabled) {
    throw new Error("Application is not connected")
  }
  assert(salePrices.length <= 8, "Cannot have more than 8 mints")

  const mintAddresses = _.map(salePrices, (salePrice) => salePrice.mint)
  assert(
    mintAddresses.length === _.uniq(mintAddresses).length,
    "Mint addresses must be unique"
  )

  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const market = await anchorAccountCache.fetch("market", ADDRESS_VIBE_MARKET)
  if (!market) {
    throw new Error(`market account not found: ${ADDRESS_VIBE_MARKET}`)
  }

  const [priceModelAddress, priceModelAddressNonce] =
    await getPriceModelAddress(ADDRESS_VIBE_MARKET, market.data.numPriceModels)

  const filteredSalePrices = _.filter(
    salePrices,
    (salePrice) => salePrice.mint
  ) as SalePrice[]

  let adjustedSalePrices: { mint: PublicKey; amount: BN }[] = []

  for (let i = 0; i < filteredSalePrices.length; i++) {
    const salePrice = salePrices[i]
    const mintPublicKey = new PublicKey(salePrice.mint)
    const mint = await anchorAccountCache.fetch("hMint", mintPublicKey, true)
    if (!mint) {
      throw new Error(`mint account not found: ${salePrice.mint}`)
    }
    const rawAmount = toRawAmount(mint.data.decimals, salePrice.amount)
    adjustedSalePrices.push({
      mint: mintPublicKey,
      amount: rawAmount,
    })
  }

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
