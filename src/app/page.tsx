"use client"
import { SpinnerInfinity } from 'spinners-react';
import React, { Suspense } from 'react';
import Typical from "react-typical";
import { Separator } from "@/components/ui/separator"
import { Button } from '@/components/ui/button';
import { EventFilterSelect } from '@/components/event-filter-select';
import { Search } from '@/components/search-bar';
import { EventCardItem } from '@/components/event-card-item';

import { Events } from "@/shared/types"

import Link from 'next/link';
const Spline = React.lazy(() => import('@splinetool/react-spline'));
export default function Home() {
  return (
    <div className='container'>
      <div id='hero-section'>
        <div className='grid grid-cols-1 md:grid-cols-12 items-center gap-5 h-full'>
          <div className='col-span-1 md:col-span-6'>
            <p className='font-extrabold text-4xl text-primary'>With an NFT ticket, you can:</p>
            <Separator orientation='horizontal' className='my-5' />
            <ul className='my-6 ml-6 list-disc font-mono text-muted-foreground'>
              <li>
                Prevent ticket scalping and fraud.
              </li>
              <li>
                Control the resale market and receive commissions from each transaction.
              </li>
              <li>
                Increase revenue and reduce costs for your event.
              </li>
              <li>
                Create exclusive and diverse experiences for customers.
              </li>
              <li>
                Build community and engagement with customers.
              </li>
            </ul>
            <Separator orientation='horizontal' className='my-5' />
            <strong className='text-primary text-xl'>
              Hurry up!
            </strong>

            <div className='text-muted-foreground font-mono h-10'>
              <Typical
                steps={[
                  "Join us to explore the new world of NFT tickets.", 1300,
                  "You just need to register a free account and start creating your event.", 1300,
                  "The number of NFT tickets is limited!", 1300
                ]}
                loop={Infinity}
                wrapper="p"
              />
            </div>
            <div className='my-5 flex items-center justify-center'>
              <Button className='p-8' variant={'default'}><strong className='font-extrabold text-xl'>Sign up now!</strong></Button>
            </div>
          </div>
          <div className='col-span-1 md:col-span-6 h-[500px] flex justify-center items-center'>
            <Suspense fallback={<SpinnerInfinity size={200} enabled={true} />}>
              <Spline scene="https://prod.spline.design/lz7hvqH6a0vd1xDE/scene.splinecode" />
            </Suspense>
          </div>
        </div>
      </div>
      <Separator orientation='horizontal' className='my-5' />

      <div id='event-list-section' className='my-10'>
        <div className='grid grid-cols-1 lg:grid-cols-12 justify-between items-center gap-5'>
          <div className='col-span-1 lg:col-span-4'>
            <EventFilterSelect />
          </div>
          <div className='lg:col-span-4'></div>
          <div className='col-span-1 lg:col-span-4'>
            <Search />
          </div>
        </div>
        <div className='text-center'>
          <p className='text-4xl text-primary font-extrabold m-10'>List of event</p>
        </div>
        <div className='my-10'>
          <div className='grid grid-cols-1 md:grid-cols-12 items-center gap-5'>
            {
              Events.map((nftE, index) => (
                <div key={index} className='lg:col-span-3 md:col-span-6'>
                  <Link href={`/event-detail/${nftE.TokkenAddress}`}>
                    <EventCardItem nftEvent={nftE} />
                  </Link>
                </div>
              ))
            }

          </div>
        </div>
      </div>
    </div>
  )
}

