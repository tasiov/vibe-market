import type { NextPage } from "next"
import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import NavBar from "../components/NavBar"

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

      <NavBar />
    </div>
  )
}

export default Home
