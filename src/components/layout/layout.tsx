"use client"

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import type { PropsWithChildren } from "react"
import React, { useMemo } from "react"
import Header from "./header"



export const Layout = ({ children }: PropsWithChildren) => {
    const network = WalletAdapterNetwork.Devnet

    const endpoint = useMemo(() => clusterApiUrl(network), [network])

    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [])

    return (
        <div className="min-h-full w-full">
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <Header />
                        <main className="flex justify-center p-4 min-h-screen">
                            {children}
                        </main>
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider >
        </div>
    )
}