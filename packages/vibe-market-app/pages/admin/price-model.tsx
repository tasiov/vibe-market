import _ from "lodash"
import {
  Heading,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
  Button,
  IconButton,
} from "@chakra-ui/react"
import { Center, VStack, StackDivider, Box } from "@chakra-ui/layout"
import { useAccount } from "../../hooks/useAccounts"
import { getClusterConstants } from "../../constants"
import createPriceModel from "../../solana/scripts/createPriceModel"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { useCallback, useState } from "react"
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import useTxCallback from "../../hooks/useTxCallback"
import { FiPlus } from "react-icons/fi"
import { usePriceModelAddresses } from "../../hooks/useSeedAddress"
import { AccountViewer } from "../../components/AccountViewer"
import { useCluster } from "../../contexts/cluster"

type SalePrice = { mint: string; amount: string }
type SalePriceNum = {
  mint: string
  amount: number
}

const salePriceDefault = [{ mint: "", amount: "0" }]

const PriceModelPage = () => {
  const cluster = useCluster()
  const wallet = useAnchorWallet()
  const anchorAccountCache = useAnchorAccountCache()

  const { ADDRESS_NATIVE_MINT, ADDRESS_VIBE_MARKET } = getClusterConstants(
    "ADDRESS_NATIVE_MINT",
    "ADDRESS_VIBE_MARKET"
  )
  const [market] = useAccount("market", ADDRESS_VIBE_MARKET, {
    subscribe: true,
  })

  const [salePrices, setSalePrices] = useState<SalePrice[]>(salePriceDefault)
  const handleMintChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSalePrices = [...salePrices]
    newSalePrices[index].mint = event.target.value
    setSalePrices(newSalePrices)
  }

  const handleAmountChange = (index: number, valueAsString: string) => {
    const newSalePrices = [...salePrices]
    newSalePrices[index].amount = valueAsString
    setSalePrices(newSalePrices)
  }
  const handleSalePriceAdd = () => {
    const newSalePrices = [...salePrices]
    newSalePrices.push({ mint: "", amount: "0" })
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
    const salePricesNum: SalePriceNum[] = _.map(salePrices, (salePrice) => ({
      mint: salePrice.mint,
      amount: parseFloat(salePrice.amount),
    }))
    await createPriceModel(anchorAccountCache, wallet?.publicKey, salePricesNum)
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

  return (
    <VStack
      w="full"
      divider={<StackDivider borderColor="gray.200" />}
      spacing={16}
      textAlign="center"
    >
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
      <Center flexDirection="column" mb="16">
        <Heading w="full" mb="8">
          View Price Models
        </Heading>
        <AccountViewer
          accountType="priceModel"
          accountAddresses={priceModelAddresses}
        />
      </Center>
    </VStack>
  )
}

export default PriceModelPage
