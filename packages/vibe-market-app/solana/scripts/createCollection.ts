import { PublicKey, SystemProgram } from "@solana/web3.js"
import { Program } from "@project-serum/anchor"
import { getClusterConstants } from "../../constants"
import {
  getCollectionAddress,
  getGlobalStateAddress,
  getListHeadAddress,
  getListTailAddress,
} from "../seedAddresses"

export const createCollection = async (
  vibeMarketProgram: Program,
  walletPublicKey: PublicKey,
  title: String
) => {
  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const market = await vibeMarketProgram.account.market.fetch(
    ADDRESS_VIBE_MARKET
  )
  const [globalStateAddress] = await getGlobalStateAddress()
  const [collectionAddress, collectionAddressNonce] =
    await getCollectionAddress(globalStateAddress, market.data.numCollections)
  const [listHeadAddress, listHeadAddressNonce] = await getListHeadAddress(
    collectionAddress
  )
  const [listTailAddress, listTailAddressNonce] = await getListTailAddress(
    collectionAddress
  )
  await vibeMarketProgram.rpc.initCollection(
    collectionAddressNonce,
    listHeadAddressNonce,
    listTailAddressNonce,
    title,
    {
      accounts: {
        admin: walletPublicKey,
        market: market.publicKey,
        collection: collectionAddress,
        listHead: listHeadAddress,
        listTail: listTailAddress,
        systemProgram: SystemProgram.programId,
      },
    }
  )
}
