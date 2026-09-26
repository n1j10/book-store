"use client"

import Link from 'next/link'
import { Button, buttonVariants } from '../ui/button'
import {  links } from '@/utils/links'
import { cn } from '@/lib/utils'
import { PcCase } from 'lucide-react'

function Logo() {

  // function test() {
  //   toast("Event has been created.")
  // }
  return (
    <Button className={cn(
      buttonVariants({ size: 'icon' }),
      'flex items-center justify-center'
    )} 
   >
      <Link 
      // onClick={() =>
      //     toast.success("Be at the area 10 minutes before the event time")
      //   }
        href={links.HOME.href}
      >
        <PcCase className='w-6 h-6 ' />
      </Link>
    </Button>

  )
}

export default Logo