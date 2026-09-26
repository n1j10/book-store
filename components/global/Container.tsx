import { cn } from '@/lib/utils';
import React from 'react'


interface ContainerProps {
    children: React.ReactNode;
    className?:string
}
 function Container({className,children}:ContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 lg:px-10', className)}>{children}</div>
  )
}

export default Container
