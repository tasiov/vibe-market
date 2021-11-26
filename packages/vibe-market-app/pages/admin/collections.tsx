import _ from "lodash"
import { Heading, Input, Button } from "@chakra-ui/react"
import { Center, VStack, StackDivider } from "@chakra-ui/layout"
import { useAccount } from "../../hooks/useAccounts"
import { getClusterConstants } from "../../constants"
import { useCollectionAddresses } from "../../hooks/useSeedAddress"
import createCollection from "../../solana/scripts/createCollection"
import closeCollection from "../../solana/scripts/closeCollection"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { useCallback, useState } from "react"
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import useTxCallback from "../../hooks/useTxCallback"
import { PublicKey } from "@solana/web3.js"
import { AccountViewer } from "../../components/AccountViewer"

const CollectionsPage = () => {
  const wallet = useAnchorWallet()
  const anchorAccountCache = useAnchorAccountCache()

  const [title, setTitle] = useState("")
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setTitle(event.target.value)

  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const [market] = useAccount("market", ADDRESS_VIBE_MARKET, {
    subscribe: true,
  })

  const createCollectionButtonDisabled =
    !anchorAccountCache.isEnabled || !wallet?.publicKey

  const _createCollectionClickHandler = useCallback(async () => {
    if (!anchorAccountCache.isEnabled || !wallet?.publicKey) {
      return
    }
    await createCollection(anchorAccountCache, wallet?.publicKey, title)
    setTitle("")
  }, [!anchorAccountCache.isEnabled, wallet?.publicKey, title])

  const createCollectionClickHandler = useTxCallback(
    _createCollectionClickHandler,
    {
      info: "Creating collection...",
      success: "Collection created!",
      error: "Transaction failed",
    }
  )

  const collectionAddresses = useCollectionAddresses(
    market?.publicKey,
    market?.data.numCollections
  )

  const [collectionAddress, setCollectionAddress] = useState<
    string | undefined
  >(undefined)

  const _closeCollectionClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !wallet?.publicKey ||
      !collectionAddress
    ) {
      return
    }
    await closeCollection(
      anchorAccountCache,
      wallet?.publicKey,
      new PublicKey(collectionAddress)
    )
  }, [
    anchorAccountCache.isEnabled,
    wallet?.publicKey.toString(),
    collectionAddress?.toString(),
  ])

  const closeCollectionClickHandler = useTxCallback(
    _closeCollectionClickHandler,
    {
      info: "Closing collection...",
      success: "Collection closed!",
      error: "Transaction failed",
    }
  )

  return (
    <VStack
      w="full"
      divider={<StackDivider borderColor="gray.200" />}
      spacing={16}
      textAlign="center"
    >
      <Center flexDirection="column">
        <Heading w="full">Create Collection</Heading>
        <Center mt="8" w="96" flexDirection="column">
          <Input
            placeholder="Title"
            w="full"
            mr="4"
            maxLength={32}
            value={title}
            onChange={handleTitleChange}
          />
          <Button
            colorScheme="purple"
            mt="4"
            px="8"
            w="40"
            onClick={createCollectionClickHandler}
            disabled={createCollectionButtonDisabled}
          >
            Create Collection
          </Button>
        </Center>
      </Center>
      <Center flexDirection="column" mb="16">
        <Heading w="full" mb="8">
          View Collections
        </Heading>
        <AccountViewer
          accountType="collection"
          accountAddresses={collectionAddresses}
          closeAccountHandler={closeCollectionClickHandler}
        />
      </Center>
    </VStack>
  )
}

export default CollectionsPage
