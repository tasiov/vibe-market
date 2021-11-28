import _ from "lodash"
import axios from "axios"
import { useEffect, useMemo, useState } from "react"
import { PublicKey } from "@solana/web3.js"
import { useAnchorAccountCache } from "../contexts/AnchorAccountsCacheProvider"
import { NftBucket } from "../models/nftBucket"
import { PriceModel } from "../models/priceModel"
import { programs } from "@metaplex/js"
import { useAccounts } from "./useAccounts"

const {
  metadata: { Metadata },
} = programs

export type PurchaseItem = {
  nftBucket: NftBucket
  priceModel: PriceModel
  metadata: programs.metadata.Metadata
  staticData: any
}

export const useNftBuckets = (
  firstBucketAddress: PublicKey | undefined,
  listTailAddress: PublicKey | undefined,
  numBucketsPerPage: number | undefined,
  refreshFlag: boolean
) => {
  const anchorAccountCache = useAnchorAccountCache()
  const [nftBucketAddresses, setNftBucketAddresses] = useState<
    PublicKey[] | undefined
  >(undefined)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (
      !anchorAccountCache.isEnabled ||
      !firstBucketAddress ||
      !listTailAddress ||
      !numBucketsPerPage
    ) {
      return
    }
    ;(async function () {
      setLoading(true)
      const nftBucketAddresses: PublicKey[] = []
      let counter = 0
      let bucketAddress = firstBucketAddress

      // Fetch bucket list for page
      while (counter < numBucketsPerPage) {
        if (bucketAddress.equals(listTailAddress)) {
          break
        }
        const nftBucket = await anchorAccountCache.fetch(
          "nftBucket",
          bucketAddress
        )
        if (!nftBucket) {
          break
        }
        nftBucketAddresses.push(bucketAddress)
        bucketAddress = new PublicKey(nftBucket.data.nextListItem)
        counter += 1
      }
      setNftBucketAddresses(nftBucketAddresses)
      setLoading(false)
    })()
  }, [
    anchorAccountCache.isEnabled,
    firstBucketAddress?.toString(),
    listTailAddress?.toString(),
    numBucketsPerPage,
    refreshFlag,
  ])

  const [nftBucketsMap] = useAccounts("nftBucket", nftBucketAddresses, {
    subscribe: true,
  })

  return useMemo(() => {
    if (!nftBucketAddresses || !nftBucketsMap) {
      return
    }
    return _.reduce(
      nftBucketAddresses,
      (accum: NftBucket[], nftBucketAddress) => {
        accum.push(nftBucketsMap[nftBucketAddress.toString()])
        return accum
      },
      []
    )
  }, [nftBucketAddresses, nftBucketsMap])
}

export const usePurchaseItems = (nftBuckets: NftBucket[] | undefined) => {
  const anchorAccountCache = useAnchorAccountCache()
  const [metadataMap, setMetadataMap] = useState<
    Record<string, programs.metadata.Metadata> | undefined
  >()
  const [staticDataMap, setStaticDataMap] = useState<
    Record<string, any> | undefined
  >()

  const priceModelAddresses = _.map(
    nftBuckets,
    (nftBucket) => new PublicKey(nftBucket.data.priceModel)
  )
  const [priceModels] = useAccounts("priceModel", priceModelAddresses, {
    useCache: true,
  })

  const nftBucketsStr =
    nftBuckets &&
    _.join(_.map(nftBuckets, (nftBucket) => nftBucket.publicKey.toString()))

  useEffect(() => {
    if (!anchorAccountCache.isEnabled || !nftBuckets) {
      return
    }

    ;(async function () {
      const metadataMap: Record<string, programs.metadata.Metadata> = {}
      const staticDataMap: Record<string, any> = {}
      for (let i = 0; i < nftBuckets.length; i++) {
        const nftBucket = nftBuckets[i]
        const metadataAddress = await Metadata.getPDA(
          new PublicKey(nftBucket.data.nftMint)
        )
        const metadata = await Metadata.load(
          anchorAccountCache.vibeMarketProgram.provider.connection,
          metadataAddress
        )
        metadataMap[nftBucket.publicKey.toString()] = metadata
        staticDataMap[nftBucket.publicKey.toString()] = await axios.get(
          metadata.data.data.uri
        )
      }
      setMetadataMap(metadataMap)
      setStaticDataMap(staticDataMap)
    })()
  }, [anchorAccountCache.isEnabled, nftBucketsStr])

  return useMemo(() => {
    if (!nftBuckets || !priceModels || !metadataMap || !staticDataMap) {
      return
    }

    const purchaseItems: PurchaseItem[] = []
    for (let i = 0; i < nftBuckets.length; i++) {
      const nftBucket = nftBuckets[i]
      const priceModel = priceModels[nftBucket.data.priceModel]
      const metadata = metadataMap[nftBucket.publicKey.toString()]
      const staticData = staticDataMap[nftBucket.publicKey.toString()]
      purchaseItems.push({
        nftBucket,
        priceModel,
        metadata,
        staticData,
      })
    }
    return purchaseItems
  }, [nftBuckets, priceModels, metadataMap, staticDataMap])
}
