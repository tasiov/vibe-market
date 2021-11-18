import { useState, useMemo } from "react"
import { PublicKey } from "@solana/web3.js"
import { getGlobalStateAddress } from "../solana/seedAddresses"

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
