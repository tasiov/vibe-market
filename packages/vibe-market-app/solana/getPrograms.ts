import { Provider, Program } from "@project-serum/anchor"
import { getClusterConstants } from "../constants"
import { VibeMarket } from "./vibeMarket"

export const getVibeMarketProgram = (provider: Provider) => {
  const { PROGRAM_VIBE_MARKET } = getClusterConstants("PROGRAM_VIBE_MARKET")
  return Program.at<VibeMarket>(PROGRAM_VIBE_MARKET, provider)
}
