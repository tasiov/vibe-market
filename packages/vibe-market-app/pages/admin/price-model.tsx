import _ from "lodash"
import {
  Heading,
  Code,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
  Button,
  IconButton,
  Wrap,
  Text,
} from "@chakra-ui/react"
import { Center, VStack, StackDivider, Flex } from "@chakra-ui/layout"
import { useAccount, useAccounts } from "../../hooks/useAccounts"
import { getClusterConstants } from "../../constants"
import createPriceModel from "../../solana/scripts/createPriceModel"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { useCallback, useState } from "react"
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import useTxCallback from "../../hooks/useTxCallback"
import { PublicKey } from "@solana/web3.js"
import { FiPlus } from "react-icons/fi"
import { usePriceModelAddresses } from "../../hooks/useSeedAddress"

type SalePrice = { mint: string; amount: number }

const salePriceDefault = [{ mint: "", amount: 0 }]

const PriceModelPage = () => {
  const wallet = useAnchorWallet()
  const anchorAccountCache = useAnchorAccountCache()

  const { ADDRESS_NATIVE_MINT, ADDRESS_VIBE_MARKET } = getClusterConstants(
    "ADDRESS_NATIVE_MINT",
    "ADDRESS_VIBE_MARKET"
  )
  const [market] = useAccount("market", ADDRESS_VIBE_MARKET)

  const [salePrices, setSalePrices] = useState<SalePrice[]>(salePriceDefault)
  const handleMintChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSalePrices = [...salePrices]
    newSalePrices[index].mint = event.target.value
    setSalePrices(newSalePrices)
  }
  const handleAmountChange = (
    index: number,
    valueAsString: string,
    valueAsNumber: number
  ) => {
    const newSalePrices = [...salePrices]
    newSalePrices[index].amount = valueAsNumber
    setSalePrices(newSalePrices)
  }
  const handleSalePriceAdd = () => {
    const newSalePrices = [...salePrices]
    newSalePrices.push({ mint: "", amount: 0 })
    setSalePrices(newSalePrices)
  }

  const _createPriceModelClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !wallet?.publicKey ||
      !salePrices.length
    ) {
      return
    }
    await createPriceModel(anchorAccountCache, wallet?.publicKey, salePrices)
    setSalePrices(salePriceDefault)
  }, [anchorAccountCache.isEnabled, wallet?.publicKey.toString(), salePrices])

  const createPriceModelClickHandler = useTxCallback(
    _createPriceModelClickHandler,
    {
      info: "Creating price model...",
      success: "Price model created!",
      error: "Transaction failed",
    }
  )

  const priceModelAddresses = usePriceModelAddresses(
    market?.publicKey,
    market?.data.numPriceModels
  )
  const [priceModelAddress, setPriceModelAddress] = useState<
    string | undefined
  >(undefined)

  const [priceModel] = useAccount(
    "priceModel",
    priceModelAddress ? new PublicKey(priceModelAddress) : undefined
  )

  return (
    <VStack
      w="full"
      divider={<StackDivider borderColor="gray.200" />}
      spacing={16}
      textAlign="center"
    >
      <Center flexDirection="column" mb="16">
        <Heading w="full" mb="8">
          View Price Models
        </Heading>
        <Wrap spacing="16" justify="center" minH="96">
          <Flex
            h="80"
            w="96"
            p="4"
            flexDirection="column"
            overflow="auto"
            border="1px solid black"
            borderRadius="10px"
          >
            {priceModelAddresses &&
              _.map(priceModelAddresses, (publicKey) => (
                <Button
                  key={publicKey.toString()}
                  value={publicKey.toString()}
                  size="xs"
                  mb="2"
                  p="1"
                  onClick={setPriceModelAddress.bind(
                    null,
                    publicKey.toString()
                  )}
                >
                  {publicKey.toString()}
                </Button>
              ))}
          </Flex>
          <Center>
            <Flex
              w="96"
              p="4"
              minH="80"
              flexDirection="column"
              border="1px solid black"
              borderRadius="10px"
            >
              {priceModel && (
                <Code
                  w="full"
                  textAlign="left"
                  mb="2"
                  key={`priceModel-data-publicKey`}
                  backgroundColor="transparent"
                >{`publicKey: ${priceModel.publicKey.toString()}`}</Code>
              )}
              {priceModel &&
                _.map(
                  Object.keys(priceModel.data),
                  (key: keyof typeof priceModel.data) =>
                    key === "salePrices" ? (
                      _.map(priceModel.data.salePrices, (salePrice, index) => {
                        return (
                          <>
                            <Code
                              w="full"
                              textAlign="left"
                              mb="2"
                              key={`priceModel-data-sale-price-${index}`}
                              backgroundColor="transparent"
                            >{`Sale Price (${index})`}</Code>
                            <Code
                              w="full"
                              textAlign="left"
                              mb="2"
                              key={`priceModel-data-sale-price-${index}-mint`}
                              backgroundColor="transparent"
                            >{`Mint: ${salePrice.mint}`}</Code>
                            <Code
                              w="full"
                              textAlign="left"
                              mb="2"
                              key={`priceModel-data-sale-price-${index}-amount`}
                              backgroundColor="transparent"
                            >{`Amount: ${salePrice.amount}`}</Code>
                          </>
                        )
                      })
                    ) : (
                      <Code
                        w="full"
                        textAlign="left"
                        mb="2"
                        key={`priceModel-data-${key}`}
                        backgroundColor="transparent"
                      >{`${key}: ${priceModel.data[key]}`}</Code>
                    )
                )}
            </Flex>
          </Center>
        </Wrap>
      </Center>
      <Center flexDirection="column">
        <Heading w="full">Create Price Model</Heading>
        <VStack mt="8" w="full" spacing="8" flexDirection="column">
          {_.map(salePrices, (salePrice, index) => {
            return (
              <VStack
                w="full"
                spacing="2"
                key={`input-sale-price-${index}`}
                flexDirection="column"
                alignItems="flex-start"
              >
                <Input
                  placeholder="Mint"
                  w="full"
                  value={salePrice.mint}
                  onChange={handleMintChange.bind(null, index)}
                />
                <NumberInput
                  value={salePrice.amount}
                  defaultValue={0}
                  min={0}
                  keepWithinRange={true}
                  onChange={handleAmountChange.bind(null, index)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </VStack>
            )
          })}
          <IconButton
            aria-label="Add sale price"
            mt="2"
            w="full"
            icon={<FiPlus />}
            onClick={handleSalePriceAdd}
            disabled={salePrices.length >= 8}
          />

          <Button
            colorScheme="purple"
            mt="4"
            px="8"
            w="40"
            onClick={createPriceModelClickHandler}
          >
            Create Price Model
          </Button>
        </VStack>
      </Center>
      <Center flexDirection="column">
        <Heading w="full" mb="4">
          Mint Reference
        </Heading>
        <Text>{`Wrapped Sol: ${ADDRESS_NATIVE_MINT.toString()}`}</Text>
      </Center>
    </VStack>
  )
}

export default PriceModelPage
