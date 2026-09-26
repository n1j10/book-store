import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, ArrowRight, ShoppingBag, ListOrdered } from 'lucide-react';

interface PaymentResultProps {
  searchParams: Promise<{
    status?: string;
    paymentId?: string;
    orderId?: string;
  }>;
}

export default async function PaymentResultPage({ searchParams }: PaymentResultProps) {
  const params = await searchParams;
  const status = (params.status || '').toLowerCase();
  const isSuccess = status === 'success';
  const paymentId = params.paymentId;
  const orderId = params.orderId;

  return (
    <div className='flex items-center justify-center min-h-[70vh] px-4 py-12'>
      <Card className='w-full max-w-md shadow-lg border'>
        <CardHeader className='text-center pb-2'>
          <div className='mx-auto mb-4 flex items-center justify-center'>
            {isSuccess ? (
              <div className='rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-900/30'>
                <CheckCircle2 className='h-12 w-12' />
              </div>
            ) : (
              <div className='rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-950/50 dark:text-red-400 ring-8 ring-red-50 dark:ring-red-900/30'>
                <XCircle className='h-12 w-12' />
              </div>
            )}
          </div>
          <CardTitle className='text-2xl font-bold tracking-tight'>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </CardTitle>
          <p className='text-sm text-muted-foreground mt-1'>
            {isSuccess
              ? 'Your transaction via QiCard has been completed successfully.'
              : 'Your payment could not be processed. Please check your card or try again.'}
          </p>
        </CardHeader>

        <CardContent className='pt-4'>
          <div className='rounded-lg bg-muted/50 p-4 space-y-2.5 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Method</span>
              <span className='font-medium'>QiCard Gateway</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Status</span>
              <span
                className={`font-semibold capitalize ${
                  isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {status || 'Unknown'}
              </span>
            </div>
            {paymentId && (
              <div className='flex justify-between gap-2'>
                <span className='text-muted-foreground whitespace-nowrap'>Payment Ref</span>
                <span className='font-mono text-xs text-right truncate max-w-[200px]' title={paymentId}>
                  {paymentId}
                </span>
              </div>
            )}
            {orderId && (
              <div className='flex justify-between gap-2'>
                <span className='text-muted-foreground whitespace-nowrap'>Order Ref</span>
                <span className='font-mono text-xs text-right truncate max-w-[200px]' title={orderId}>
                  {orderId}
                </span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className='flex flex-col sm:flex-row gap-2.5 pt-2'>
          <Link
            href='/orders'
            className={buttonVariants({
              variant: isSuccess ? 'default' : 'secondary',
              className: 'w-full flex items-center justify-center',
            })}
          >
            <ListOrdered className='mr-2 h-4 w-4' />
            View Orders
          </Link>
          <Link
            href={isSuccess ? '/products' : '/cart'}
            className={buttonVariants({
              variant: isSuccess ? 'outline' : 'default',
              className: 'w-full flex items-center justify-center',
            })}
          >
            {isSuccess ? (
              <>
                <ShoppingBag className='mr-2 h-4 w-4' />
                Continue Shopping
              </>
            ) : (
              <>
                <ArrowRight className='mr-2 h-4 w-4' />
                Return to Cart
              </>
            )}
          </Link>
        </CardFooter>

      </Card>
    </div>
  );
}
