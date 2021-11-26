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
          accum[tokenInfo.address] = tokenInfo
          return accum
        },
        {}
      )
      setTokenMap(tokenMap)
    })()
  }, [])

  return tokenMap
}
