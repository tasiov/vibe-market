import { useEffect, useState } from "react"
import axios from "axios"
import { PublicKey } from "@solana/web3.js"
import { Connection, programs } from "@metaplex/js"

const {
  metadata: { Metadata },
} = programs

export const useMetaplexMetadata = (
  connection: Connection,
  mintPublicKey: PublicKey | undefined
): [[programs.metadata.Metadata, any] | undefined, boolean] => {
  const [metadata, setMetadata] = useState<
    [programs.metadata.Metadata, any] | undefined
  >()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!mintPublicKey) {
      return
    }

    ;(async function () {
      setLoading(true)
      const metadataAddress = await Metadata.getPDA(mintPublicKey.toString())
      try {
        const metadata = await Metadata.load(connection, metadataAddress)
        const { data } = await axios.get(metadata.data.data.uri)
        setMetadata([metadata, data])
      } catch (err) {
        console.log(err)
        setMetadata(undefined)
      }
      setLoading(false)
    })()
  }, [mintPublicKey?.toString()])

  return [metadata, loading]
}
