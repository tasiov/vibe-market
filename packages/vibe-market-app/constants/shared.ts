import { SystemProgram } from "@solana/web3.js"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"

export const PROGRAM_ASSOCIATED_TOKEN = ASSOCIATED_TOKEN_PROGRAM_ID
export const PROGRAM_NATIVE_MINT = NATIVE_MINT
export const PROGRAM_SYSTEM = SystemProgram.programId
export const PROGRAM_TOKEN = TOKEN_PROGRAM_ID
