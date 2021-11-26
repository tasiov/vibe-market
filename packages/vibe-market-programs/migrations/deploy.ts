import * as anchor from "@project-serum/anchor"
import { PublicKey } from "@solana/web3.js"
import { vibeMarketProgramId } from "../utils/constants"
import * as seedAddresses from "../utils/seedAddresses"

const initGlobalState = async (vibeMarketProgram, walletPublicKey) => {
  const [globalStateAddress, globalStateAddressNonce] =
    await seedAddresses.getGlobalStateAddress()

  await vibeMarketProgram.rpc.initGlobalState(globalStateAddressNonce, {
    accounts: {
      admin: walletPublicKey,
      globalState: globalStateAddress,
      systemProgram: anchor.web3.SystemProgram.programId,
    },
  })
  return globalStateAddress
}

const initMarket = async (vibeMarketProgram, walletPublicKey, marketIndex) => {
  const [globalStateAddress, globalStateAddressNonce] =
    await seedAddresses.getGlobalStateAddress()

  const [marketAddress, marketAddressNonce] =
    await seedAddresses.getMarketAddress(globalStateAddress, marketIndex)

  await vibeMarketProgram.rpc.initMarket(
    marketAddressNonce,
    [walletPublicKey],
    "Vibe Market",
    {
      accounts: {
        admin: walletPublicKey,
        globalState: globalStateAddress,
        market: marketAddress,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    }
  )
  return marketAddress
}

const addAdmin = async (
  vibeMarketProgram,
  walletPublicKey,
  marketAddress,
  addAdmin
) => {
  await vibeMarketProgram.rpc.addAdmin({
    accounts: {
      admin: walletPublicKey,
      market: marketAddress,
      addAdmin: addAdmin,
    },
  })
}

module.exports = async function (provider) {
  anchor.setProvider(provider)

  const walletPublicKey = provider.wallet.publicKey

  const vibeMarketProgram = await anchor.Program.at(
    vibeMarketProgramId,
    provider
  )

  const globalStateAddress = await initGlobalState(
    vibeMarketProgram,
    walletPublicKey
  )

  // const [globalStateAddress, globalStateAddressNonce] =
  //   await seedAddresses.getGlobalStateAddress()

  console.log(
    await vibeMarketProgram.account.globalState.fetch(globalStateAddress)
  )
  console.log("globalStateAddress", globalStateAddress.toString())

  const marketAddress = await initMarket(vibeMarketProgram, walletPublicKey, 0)
  console.log(await vibeMarketProgram.account.market.fetch(marketAddress))
  console.log("marketAddress", marketAddress.toString())

  // const [marketAddress, marketAddressNonce] =
  //   await seedAddresses.getMarketAddress(globalStateAddress, 0)

  // await addAdmin(
  //   vibeMarketProgram,
  //   walletPublicKey,
  //   marketAddress,
  //   new PublicKey("GfP2U9noTRDNY3tVp9bicsnN34XX72rJ88eNjsaLih8x")
  // )

  // const market = await vibeMarketProgram.account.market.fetch(marketAddress)

  // console.log("market", market)
}
