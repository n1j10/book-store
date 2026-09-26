import { NextRequest, NextResponse } from 'next/server';
import {
  getQiCardPaymentStatus,
  settleQiCardPayment,
  QiCardError,
} from '@/lib/qicard';

export const runtime = 'nodejs';

function resultRedirect(request: NextRequest, status: 'success' | 'failed', paymentId?: string, orderId?: string) {
  const url = new URL('/payment-result', request.url);
  url.searchParams.set('status', status);
  if (paymentId) url.searchParams.set('paymentId', paymentId);
  if (orderId) url.searchParams.set('orderId', orderId);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const paymentId = searchParams.get('paymentId');
  const requestId = searchParams.get('requestId');
  const orderId = searchParams.get('orderId') || undefined;
  const queryStatus = searchParams.get('status');

  if (!paymentId && !requestId) {
    return resultRedirect(request, 'failed', undefined, orderId);
  }

  try {
    let finalStatus = queryStatus;
    let details: any = undefined;

    // Direct server-to-server verification with QiCard gateway
    if (paymentId) {
      const statusResult = await getQiCardPaymentStatus(paymentId);
      finalStatus = statusResult.status;
      details = statusResult.details;
    }

    if (paymentId && finalStatus) {
      await settleQiCardPayment({
        paymentId,
        requestId: requestId || undefined,
        status: finalStatus,
        details,
      });
    }

    const isSuccess = finalStatus?.toUpperCase() === 'SUCCESS';
    return resultRedirect(request, isSuccess ? 'success' : 'failed', paymentId || undefined, orderId);
  } catch (error) {
    console.error('QiCard callback verification error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      paymentId,
      requestId,
    });
    return resultRedirect(request, 'failed', paymentId || undefined, orderId);
  }
}

