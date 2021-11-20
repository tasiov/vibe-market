import _ from "lodash"
import { Heading, Text, Input, Button } from "@chakra-ui/react"
import { Center, Box, Container, Flex } from "@chakra-ui/layout"
import { useAccount } from "../../hooks/useAccounts"
import { getClusterConstants } from "../../constants"

const CreateCollection = () => {
  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const market = useAccount("market", ADDRESS_VIBE_MARKET)
  return (
    <Center w="full" flexDirection="column" textAlign="center">
      <Heading w="full">Create Collection</Heading>
      <Flex mt="8" w="96">
        <Input placeholder="Title" w="72" mr="4" />
        <Button colorScheme="purple" px="8">
          Create Collection
        </Button>
      </Flex>
    </Center>
  )
}

export default CreateCollection
