import { useState, useMemo, useEffect } from "react"
import { PublicKey } from "@solana/web3.js"
import {
  getGlobalStateAddress,
  getCollectionAddresses,
  getPriceModelAddress,
  getPriceModelAddresses,
} from "../solana/seedAddresses"

type MaybePublicKey = PublicKey | undefined

export const useGlobalStateAddress = () => {
  const [seedAddress, setSeedAddress] = useState<MaybePublicKey>(undefined)
  useMemo(() => {
    getGlobalStateAddress().then(([seedAddress]) => {
      setSeedAddress(seedAddress)
    })
  }, [])
  return seedAddress
}

export const useCollectionAddresses = (
  marketAddress: MaybePublicKey,
  numCollections: number | undefined
) => {
  const [seedAddresses, setSeedAddresses] = useState<PublicKey[] | undefined>(
    undefined
  )
  useEffect(() => {
    ;(async function () {
      if (!marketAddress || !numCollections) {
        return
      }
      const collectionAddresses = await getCollectionAddresses(
        marketAddress,
        numCollections
      )
      setSeedAddresses(collectionAddresses)
    })()
  }, [marketAddress?.toString(), numCollections])
  return seedAddresses
}

export const usePriceModelAddress = (
  marketAddress: MaybePublicKey,
  numPriceModels: number | undefined
) => {
  const [seedAddress, setSeedAddress] = useState<MaybePublicKey>(undefined)
  useEffect(() => {
    ;(async function () {
      if (!marketAddress || !numPriceModels) {
        return
      }
      const [priceModelAddress] = await getPriceModelAddress(
        marketAddress,
        numPriceModels
      )
      setSeedAddress(priceModelAddress)
    })()
  }, [marketAddress?.toString(), numPriceModels])
  return seedAddress
}

export const usePriceModelAddresses = (
  marketAddress: MaybePublicKey,
  numPriceModels: number | undefined
) => {
  const [seedAddresses, setSeedAddresses] = useState<PublicKey[] | undefined>(
    undefined
  )
  useEffect(() => {
    ;(async function () {
      if (!marketAddress || !numPriceModels) {
        return
      }
      const priceModelAddresses = await getPriceModelAddresses(
        marketAddress,
        numPriceModels
      )
      setSeedAddresses(priceModelAddresses)
    })()
  }, [marketAddress?.toString(), numPriceModels])
  return seedAddresses
}
