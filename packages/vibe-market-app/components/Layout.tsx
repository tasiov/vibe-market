import _ from "lodash"
import Image from "next/image"
import Link from "next/link"
import React, { ReactNode, useEffect, useRef } from "react"
import {
  IconButton,
  Box,
  CloseButton,
  Flex,
  HStack,
  Icon,
  useColorModeValue,
  Drawer,
  DrawerContent,
  useDisclosure,
  BoxProps,
  FlexProps,
  Badge,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react"
import {
  FiAlignJustify,
  FiMenu,
  FiLayers,
  FiDollarSign,
  FiFilePlus,
  FiImage,
  FiLogOut,
} from "react-icons/fi"
import { IconType } from "react-icons"
import { ReactText } from "react"
import { Wallet } from "./Wallet"
import { useIsAdmin } from "../hooks/useIsAdmin"
import { getClusterConstants } from "../constants"
import { useAccount, useAccounts } from "../hooks/useAccounts"
import { useCollectionAddresses } from "../hooks/useSeedAddress"

interface LinkItemProps {
  name: string
  icon: IconType
  href: string
}

const AdminLinkItems: Array<LinkItemProps> = [
  {
    name: "Whitelist",
    icon: FiAlignJustify,
    href: "/admin/whitelist",
  },
  {
    name: "Collections",
    icon: FiLayers,
    href: "/admin/collections",
  },
  {
    name: "Price Models",
    icon: FiDollarSign,
    href: "/admin/price-model",
  },
  {
    name: "Add NFT",
    icon: FiImage,
    href: "/admin/add-nft",
  },
  {
    name: "Withdraw Liquidity",
    icon: FiLogOut,
    href: "/admin/price-model",
  },
]

export default function SidebarWithHeader({
  children,
}: {
  children: ReactNode
}) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <Box minH="100vh" bg={useColorModeValue("brandPink.100", "gray.900")}>
      <SidebarContent
        onClose={() => onClose}
        display={{ base: "none", md: "block" }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav onOpen={onOpen} />
      <Box
        w={{ base: "full", md: "75%", lg: "80%", xl: "85%" }}
        ml={{ base: 0, md: "25%", lg: "20%", xl: "15%" }}
        p="8"
        pb="40"
        h="full"
        position="fixed"
        backgroundColor={useColorModeValue("orange.50", "gray.700")}
        overflow="auto"
      >
        {children}
      </Box>
    </Box>
  )
}

interface SidebarProps extends BoxProps {
  onClose: () => void
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const isAdmin = useIsAdmin(ADDRESS_VIBE_MARKET)

  const [market] = useAccount("market", ADDRESS_VIBE_MARKET, { useCache: true })
  const collectionAddresses = useCollectionAddresses(
    market?.publicKey,
    market?.data.numCollections
  )

  const [collections, collectionsLoading] = useAccounts(
    "collection",
    collectionAddresses
  )

  return (
    <Box
      bg={useColorModeValue("brandPink.200", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: "25%", lg: "20%", xl: "15%" }}
      pos="fixed"
      h="full"
      overflow="auto"
      {...rest}
    >
      <Flex
        h="20"
        alignItems="center"
        px="4"
        py="2"
        w="full"
        justifyContent="center"
      >
        <Link href="/" passHref>
          <Box h="64px" w="64px" cursor="pointer">
            <Image
              src="/vibe-logo-lg.png"
              width={64}
              height={64}
              alt="Vibe Logo"
            />
          </Box>
        </Link>
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      <Flex
        align="center"
        p="2"
        mt="4"
        mx="4"
        role="group"
        borderBottom="2px"
        fontWeight="900"
        color="white"
      >
        <Text fontSize="2xl">Collections</Text>
      </Flex>
      {collections &&
        _.map(_.values(collections), (collection) => (
          <NavItem
            key={collection.data.title}
            href={`/collection/${collection.publicKey.toString()}`}
          >
            {collection.data.title}
          </NavItem>
        ))}
      {isAdmin && (
        <>
          <Flex
            align="center"
            p="2"
            mt="4"
            mx="4"
            role="group"
            borderBottom="2px"
            fontWeight="900"
            color="white"
          >
            <Text fontSize="2xl">Admin</Text>
          </Flex>
          {AdminLinkItems.map((link) => (
            <NavItem key={link.name} icon={link.icon} href={link.href}>
              {link.name}
            </NavItem>
          ))}
        </>
      )}
    </Box>
  )
}

interface NavItemProps extends FlexProps {
  href: string
  icon?: IconType
  children: ReactText
}
const NavItem = ({ href, icon, children, ...rest }: NavItemProps) => {
  return (
    <Link href={href} passHref>
      <Flex
        align="center"
        p="2"
        mt="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        fontWeight="900"
        color="white"
        _hover={{
          color: "brandPink.900",
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: "brandPink.900",
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  )
}

interface MobileProps extends FlexProps {
  onOpen: () => void
}
const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  const { ADDRESS_VIBE_MARKET } = getClusterConstants("ADDRESS_VIBE_MARKET")
  const isAdmin = useIsAdmin(ADDRESS_VIBE_MARKET)
  return (
    <Flex
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("brandBlue.100", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <HStack spacing={{ base: "0", md: "6" }}>
        {isAdmin && (
          <Badge mr="10" fontSize="1em" colorScheme="red">
            ADMIN
          </Badge>
        )}
        <Wallet />
      </HStack>
    </Flex>
  )
}
