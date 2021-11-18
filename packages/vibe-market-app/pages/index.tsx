import type { NextPage } from "next"
import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import NavBar from "../components/NavBar"
import SidebarWithHeader from "../components/Layout"

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Vibe Market</title>
        <meta
          name="description"
          content="An NFT marketplace for the Vibe community"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <SidebarWithHeader>test</SidebarWithHeader>
    </div>
  )
}

export default Home
