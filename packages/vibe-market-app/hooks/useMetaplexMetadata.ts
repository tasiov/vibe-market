import { useEffect, useState } from "react"
import { PublicKey } from "@solana/web3.js"
import { Connection, programs } from "@metaplex/js"
import axios from "axios"

const {
  metadata: { Metadata },
} = programs

export const useMetaplexMetadata = (
  connection: Connection,
  mintPublicKey: PublicKey | undefined
) => {
  const [metadata, setMetadata] = useState<
    [programs.metadata.Metadata, string] | undefined
  >()

  useEffect(() => {
    if (!mintPublicKey) {
      return
    }

    ;(async function () {
      const metadataAddress = await Metadata.getPDA(mintPublicKey.toString())
      try {
        const metadata = await Metadata.load(connection, metadataAddress)
        const { data } = await axios.get(metadata.data.data.uri)
        setMetadata([metadata, data.image])
      } catch (err) {
        console.log(err)
        setMetadata(undefined)
      }
    })()
  }, [mintPublicKey?.toString()])

  return metadata
}
