import _ from "lodash"
import {
  Heading,
  Code,
  Text,
  Input,
  Button,
  Divider,
  Wrap,
} from "@chakra-ui/react"
import { Center, Box, Container, Flex } from "@chakra-ui/layout"
import { useAccount, useAccounts } from "../../hooks/useAccounts"
import { getClusterConstants } from "../../constants"
import { useCollectionAddresses } from "../../hooks/useSeedAddress"
import { createCollection } from "../../solana/scripts/createCollection"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { useCallback, useState } from "react"
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import useTxCallback from "../../hooks/useTxCallback"
import { PublicKey } from "@solana/web3.js"

const CreateCollection = () => {
  const wallet = useAnchorWallet()
  const anchorAccountCache = useAnchorAccountCache()

  const [title, setTitle] = useState("")
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setTitle(event.target.value)

  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const market = useAccount("market", ADDRESS_VIBE_MARKET)

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

  const [collectionAdress, setCollectionAdress] = useState<string | undefined>(
    undefined
  )

  const collection = useAccount(
    "collection",
    collectionAdress ? new PublicKey(collectionAdress) : undefined
  )

  return (
    <Center w="full" flexDirection="column" textAlign="center">
      <Center flexDirection="column" mb="16">
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
      <Divider />
      <Center mt="16" flexDirection="column">
        <Heading w="full">View Collections</Heading>
        <Wrap mt="4" mb="28" spacing="20" justify="center">
          <Flex mt="8" flexDirection="column" h="60" overflow="auto" p="4">
            {collectionAddresses &&
              _.map(collectionAddresses, (publicKey) => (
                <Button
                  key={publicKey.toString()}
                  value={publicKey.toString()}
                  size="xs"
                  mb="2"
                  p="1"
                  onClick={setCollectionAdress.bind(null, publicKey.toString())}
                >
                  {publicKey.toString()}
                </Button>
              ))}
          </Flex>
          <Flex
            mt="8"
            w="96"
            flexDirection="column"
            justifyContent="flex-start"
            alignItems="flex-start"
            backgroundColor="gray.100"
          >
            {collection &&
              _.map(
                Object.keys(collection.data),
                (key: keyof typeof collection.data) => (
                  <Code
                    w="full"
                    textAlign="left"
                    mb="2"
                    backgroundColor="transparent"
                  >{`${key}: ${collection.data[key]}`}</Code>
                )
              )}
          </Flex>
        </Wrap>
      </Center>
    </Center>
  )
}

export default CreateCollection
