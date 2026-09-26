import React, { Suspense } from 'react'
import Container from '../global/Container'
import Logo from './Logo'
import NavSearch from '../home/HeroSearch'
import CartButton from './CartButton'
import DarkMode from './DarkMode'
import LinksDropdown from './LinksDropdown'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'

async function Navbar() {
  const { userId } = await auth();
  const isAdmin = userId === process.env.ADMIN_USER_ID;

  return (
    <div className='sticky top-0 z-40 border-b border-border/70 bg-background/85 shadow-sm backdrop-blur-xl'>
      <Container className='flex flex-col gap-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-5' >
        <Logo />
        <nav aria-label="Main navigation" className='flex w-full items-center justify-between gap-1 rounded-2xl bg-muted/75 p-1 text-xs font-medium sm:w-auto sm:justify-start sm:gap-1.5 sm:text-sm'>
          <Link className='rounded-xl px-3 py-2 transition-colors hover:bg-card hover:text-primary sm:px-3.5' href={'/'}>
            Home
          </Link>
          <Link className='rounded-xl px-3 py-2 transition-colors hover:bg-card hover:text-primary sm:px-3.5' href={'/products'}>
            Products
          </Link>
          <Link className='rounded-xl px-3 py-2 transition-colors hover:bg-card hover:text-primary sm:px-3.5' href={'/orders'}>
            Orders
          </Link>
          <Link className='rounded-xl px-3 py-2 transition-colors hover:bg-card hover:text-primary sm:px-3.5' href={'/favorites'}>
            Favorites
          </Link>

        </nav>


        <div className='flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4'>
          <CartButton />
          <DarkMode />
          <LinksDropdown isAdmin={isAdmin} />

        </div>
      </Container>
    </div>
  )
}

export default Navbar
