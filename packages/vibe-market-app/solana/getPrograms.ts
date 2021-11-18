import { Provider, Program } from "@project-serum/anchor"
import { getClusterConstants } from "../constants"

export const getVibeMarketProgram = (provider: Provider) => {
  const { PROGRAM_VIBE_MARKET } = getClusterConstants(
    "PROGRAM_VIBE_MARKET"
  )
  return Program.at(PROGRAM_VIBE_MARKET, provider)
}
