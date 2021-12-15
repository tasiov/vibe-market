import { PublicKey } from "@solana/web3.js"
import _ from "lodash"
import * as MainnetConstants from "./mainnetBeta"
import * as DevnetConstants from "./devnet"
import * as SharedConstants from "./shared"

export const Shared = SharedConstants

const CLUSTER_MAP = {
  devnet: DevnetConstants,
  "mainnet-beta": MainnetConstants,
}

const DEFAULT_CLUSTER = "mainnet-beta"

export type ClusterKey = keyof typeof CLUSTER_MAP

interface CLUSTER_KEY_MAP {
  ADDRESS_NATIVE_MINT: PublicKey
  ADDRESS_VIBE_MARKET: PublicKey
  PROGRAM_ASSOCIATED_TOKEN: PublicKey
  PROGRAM_VIBE_MARKET: PublicKey
  PROGRAM_SYSTEM: PublicKey
  PROGRAM_TOKEN: PublicKey
}

export type ClusterConstantKey = keyof CLUSTER_KEY_MAP

class ClusterSingelton {
  readonly currentCluster: ClusterKey
  readonly clusterConstants: Partial<CLUSTER_KEY_MAP>

  constructor(cluster: ClusterKey) {
    this.currentCluster = cluster
    const clusterConstants = _.assign({}, SharedConstants, CLUSTER_MAP[cluster])
    this.clusterConstants = clusterConstants
  }

  getClusterConstants() {
    return this.clusterConstants
  }
}

let clusterSingleton = new ClusterSingelton(DEFAULT_CLUSTER)

export const setCluster = (cluster: ClusterKey) => {
  clusterSingleton = new ClusterSingelton(cluster)
}

export function getClusterConstants<K extends ClusterConstantKey>(
  ...constants: K[]
): Pick<CLUSTER_KEY_MAP, K> {
  const clusterConstants = clusterSingleton.getClusterConstants()
  const retval = _.pick(clusterConstants, constants)
  let undefinedValues: string[] = []
  _.forEach(retval, (value, key) => {
    if (value === undefined) {
      undefinedValues.push(key)
    }
  })
  if (undefinedValues.length > 0) {
    throw new Error(
      `ClusterConstants are undefined: ${undefinedValues.join(" ")}`
    )
  }
  return retval as Pick<CLUSTER_KEY_MAP, K>
}
