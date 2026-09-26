import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { startQiCardCheckout, QiCardError } from '@/lib/qicard';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await currentUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);

  const orderId = typeof body?.orderId === 'string' ? body.orderId : undefined;
  const cartId = typeof body?.cartId === 'string' ? body.cartId : undefined;

  if (!orderId && !cartId) {
    return NextResponse.json({ error: 'Invalid payment request: missing orderId or cartId' }, { status: 400 });
  }

  try {
    const result = await startQiCardCheckout({
      clerkId: user.id,
      orderId,
      cartId,
      customerInfo: {
        firstName: user.firstName || 'Customer',
        lastName: user.lastName || '',
        email: user.emailAddresses?.[0]?.emailAddress,
      },
    });

    return NextResponse.json({
      paymentUrl: result.paymentUrl,
      paymentId: result.paymentId,
      requestId: result.requestId,
      orderId: result.orderId,
    });
  } catch (error) {
    const message = error instanceof QiCardError ? error.message : 'Unable to start QiCard payment';
    console.error('QiCard payment initialization failed', { orderId, cartId, message });
    const status =
      message === 'Order not found' ? 404 : message === 'Order has already been paid' ? 409 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

