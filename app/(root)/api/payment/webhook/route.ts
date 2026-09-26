import { NextRequest, NextResponse } from 'next/server';
import db from '@/utils/db';
import {
  getQiCardPaymentStatus,
  settleQiCardPayment,
  verifyQiCardSignature,
  QiCardError,
} from '@/lib/qicard';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-signature') || request.headers.get('X-Signature') || '';
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const paymentId = typeof body.paymentId === 'string' ? body.paymentId : undefined;
  const requestId = typeof body.requestId === 'string' ? body.requestId : undefined;
  const rawStatus = typeof body.status === 'string' ? body.status : undefined;

  if (!paymentId && !requestId) {
    return NextResponse.json({ error: 'Missing paymentId or requestId in webhook payload' }, { status: 400 });
  }

  // If RSA signature is provided and public key configured, verify it
  if (signature) {
    const isValid = verifyQiCardSignature(body, signature);
    if (!isValid) {
      console.warn('QiCard webhook signature verification failed for paymentId:', paymentId);
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
  }

  try {
    const payment = await db.qiCardPayment.findFirst({
      where: {
        OR: [
          paymentId ? { paymentId } : undefined,
          requestId ? { requestId } : undefined,
        ].filter(Boolean) as any[],
      },
    });

    // Record the webhook event in the database
    const webhookEvent = await db.qiCardWebhookEvent.create({
      data: {
        paymentId: payment?.id || null,
        status: rawStatus || 'RECEIVED',
        payload: JSON.parse(JSON.stringify(body)),
      },
    });

    let verifiedStatus = rawStatus;
    let details = body.details;

    // Direct server-to-server confirmation with QiCard API
    if (paymentId) {
      try {
        const inquiry = await getQiCardPaymentStatus(paymentId);
        verifiedStatus = inquiry.status;
        details = inquiry.details || details;
      } catch (inquiryErr) {
        console.warn('QiCard status inquiry during webhook failed, using body status:', inquiryErr);
      }
    }

    if (verifiedStatus) {
      await settleQiCardPayment({
        paymentId: paymentId || payment?.paymentId || undefined,
        requestId: requestId || payment?.requestId || undefined,
        status: verifiedStatus,
        details,
      });
    }

    await db.qiCardWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processedAt: new Date(),
        status: verifiedStatus || rawStatus || 'PROCESSED',
      },
    });

    // The QiCard Payment Gateway requires a 200 OK response
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('QiCard webhook processing failed:', { message, paymentId, requestId });
    return NextResponse.json(
      { error: error instanceof QiCardError ? message : 'Webhook processing error' },
      { status: 500 }
    );
  }
}

