import _ from "lodash"
import { useState, useEffect } from "react"
import { TokenListProvider, TokenInfo } from "@solana/spl-token-registry"
import { useCluster } from "../contexts/cluster"

export const useTokenRegistry = () => {
  const cluster = useCluster()
  const [tokenMap, setTokenMap] = useState<
    Record<string, TokenInfo> | undefined
  >()

  useEffect(() => {
    ;(async function () {
      const tokenList = await new TokenListProvider().resolve()
      const tokens = tokenList.filterByClusterSlug(cluster).getList()
      const tokenMap = _.reduce(
        tokens,
        (accum: Record<string, TokenInfo>, tokenInfo) => {
          accum[tokenInfo.address] = { ...tokenInfo }
          if (
            tokenInfo.address === "8o66EVAf4u2Hr21m2tuRrPtEXFPLr8G8aL1ETStP8fDu"
          ) {
            // @ts-ignore - skip readonly declaration in this case
            accum[tokenInfo.address].decimals = 9
          }
          return accum
        },
        {}
      )
      setTokenMap(tokenMap)
    })()
  }, [])

  return tokenMap
}
