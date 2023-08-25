"use client"
import { EventCardItem } from "@/components/event-card-item"
import { useToast } from "@/components/ui/use-toast"
import { readAllNFTs } from "@/shared/shyft"
import { Network, Nft } from "@/shared/types"
import { useWallet } from "@solana/wallet-adapter-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Search } from '@/components/search-bar';
import { EventFilterSelect } from '@/components/event-filter-select';

export default function Page() {

  const { connected, publicKey } = useWallet()
  const [loading, setLoading] = useState(false)
  const [network, setNetwork] = useState<Network>("devnet")
  const [nfts, setNFTs] = useState<Nft[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (publicKey && network) {
      setLoading(true)
      readAllNFTs(publicKey.toBase58(), network)
        .then((response) => {
          if (response.success) {
            console.log(response.result)
            setNFTs(response.result.nfts)
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: response.message ?? "Unknown error",
            })
          }
        })
        .catch((error: any) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: error?.message ?? "Unknown error",
          })
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [publicKey, network, toast])

  return (
    <div className="container">
      <div className='grid grid-cols-12 items-center gap-5 h-full'>
        <div id='event-list-section' className='my-10 col-span-12'>
          <div className='grid grid-cols-12 justify-between items-center gap-5'>
            <div className='col-span-12 lg:col-span-4'>
              <EventFilterSelect />
            </div>
            <div className='lg:col-span-4'></div>
            <div className='col-span-12 lg:col-span-4'>
              <Search />
            </div>
          </div>
          <div className='text-center'>
            <p className='text-4xl text-primary font-extrabold m-10 uppercase'>List of event</p>
          </div>
          <div className='my-10'>
            <div className='grid grid-cols-12 items-center gap-5'>
              {
                nfts.map((nftE, index) => (
                  <div key={index} className='lg:col-span-4 md:col-span-6 col-span-12'>
                    <Link href={`/event-detail/${nftE.mint}`}>
                      <EventCardItem nftEvent={nftE} />
                    </Link>
                  </div>
                ))
              }

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}