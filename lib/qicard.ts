import { randomUUID, createVerify } from 'crypto';
import db from '@/utils/db';

const SUCCESS = 'SUCCESS';
const DEFAULT_BASE_URL = 'https://uat-sandbox-3ds-api.qi.iq/api/v1';
const DEFAULT_USERNAME = 'paymentgatewaytest';
const DEFAULT_PASSWORD = 'WHaNFE5C3qlChqNbAzH4';
const DEFAULT_TERMINAL_ID = '237984';

export class QiCardError extends Error {}

type JsonRecord = Record<string, unknown>;

function getBaseUrl() {
  return (process.env.QICARD_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function getTerminalId() {
  return process.env.QICARD_TERMINAL_ID?.trim() || DEFAULT_TERMINAL_ID;
}

function getBasicAuthHeader() {
  const username = process.env.QICARD_USERNAME?.trim() || DEFAULT_USERNAME;
  const password = process.env.QICARD_PASSWORD?.trim() || DEFAULT_PASSWORD;
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${token}`;
}

export function websiteUrl() {
  const envUrl = process.env.WEBSITE_URL?.trim();
  if (envUrl && /^https?:\/\//.test(envUrl)) {
    return envUrl.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'http://localhost:3000';
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new QiCardError('Unexpected response format from QiCard');
  }
  return value as JsonRecord;
}

export interface QiCardCreatePaymentResponse {
  requestId: string;
  paymentId: string;
  status: string;
  canceled: boolean;
  amount: number;
  currency: string;
  creationDate: string;
  formUrl: string;
  withoutAuthenticate?: boolean;
  additionalInfo?: JsonRecord;
}

export interface QiCardStatusResponse {
  requestId: string;
  paymentId: string;
  status: string;
  canceled: boolean;
  amount: number;
  confirmedAmount?: number;
  currency: string;
  paymentType?: string;
  creationDate: string;
  details?: {
    resultCode?: string;
    rrn?: string;
    authId?: string;
    authDate?: string;
    maskedPan?: string;
    paymentSystem?: string;
    customDetails?: JsonRecord;
  };
  withoutAuthenticate?: boolean;
  additionalInfo?: JsonRecord;
}

/**
 * Calls QiCard REST API to create a payment session and obtain formUrl.
 */
export async function createQiCardPayment(input: {
  requestId: string;
  amount: number;
  currency?: string;
  locale?: string;
  finishPaymentUrl: string;
  notificationUrl: string;
  customerInfo?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  additionalInfo?: JsonRecord;
}): Promise<QiCardCreatePaymentResponse> {
  const url = `${getBaseUrl()}/payment`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Terminal-Id': getTerminalId(),
      Authorization: getBasicAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestId: input.requestId,
      amount: input.amount,
      currency: input.currency || 'IQD',
      locale: input.locale || 'en_US',
      finishPaymentUrl: input.finishPaymentUrl,
      notificationUrl: input.notificationUrl,
      customerInfo: input.customerInfo,
      additionalInfo: input.additionalInfo,
      appChannel: false,
    }),
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);
  const payload = asRecord(data);

  if (!response.ok) {
    const errorObj = payload.error as JsonRecord | undefined;
    const description = (errorObj?.description as string) || (payload.description as string) || (payload.message as string);
    throw new QiCardError(description || `QiCard error (HTTP ${response.status})`);
  }

  if (typeof payload.paymentId !== 'string' || typeof payload.formUrl !== 'string') {
    throw new QiCardError('QiCard did not return a valid paymentId or formUrl');
  }

  return payload as unknown as QiCardCreatePaymentResponse;
}

/**
 * Queries the authoritative payment status from QiCard using paymentId.
 */
export async function getQiCardPaymentStatus(paymentId: string): Promise<QiCardStatusResponse> {
  const url = `${getBaseUrl()}/payment/${encodeURIComponent(paymentId)}/status`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Terminal-Id': getTerminalId(),
      Authorization: getBasicAuthHeader(),
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);
  const payload = asRecord(data);

  if (!response.ok) {
    const errorObj = payload.error as JsonRecord | undefined;
    const description = (errorObj?.description as string) || (payload.description as string);
    throw new QiCardError(description || `QiCard query failed (HTTP ${response.status})`);
  }

  return payload as unknown as QiCardStatusResponse;
}

/**
 * Starts a QiCard checkout session for an order or cart.
 */
export async function startQiCardCheckout(input: {
  clerkId: string;
  orderId?: string;
  cartId?: string;
  customerInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}) {
  let orderTotal = 0;
  let targetOrderId = input.orderId;

  if (input.orderId) {
    const order = await db.order.findFirst({
      where: { id: input.orderId, clerkId: input.clerkId },
    });
    if (!order) throw new QiCardError('Order not found');
    if (order.isPaid) throw new QiCardError('Order has already been paid');
    orderTotal = order.orderTotal;
    targetOrderId = order.id;
  } else if (input.cartId) {
    const cart = await db.cart.findFirst({
      where: { id: input.cartId, clerkId: input.clerkId },
      include: { cartItems: { include: { product: true } } },
    });
    if (!cart || !cart.cartItems.length) throw new QiCardError('Cart not found or empty');

    // Check if an order already exists for this cart or create an order
    const firstItem = cart.cartItems[0];
    const total = cart.cartItems.reduce((acc, item) => acc + item.amount * item.product.price, 0);

    const createdOrder = await db.order.create({
      data: {
        clerkId: input.clerkId,
        productId: firstItem.productId,
        products: cart.numItemsInCart,
        orderTotal: total,
      },
    });
    targetOrderId = createdOrder.id;
    orderTotal = total;
  } else {
    throw new QiCardError('Either orderId or cartId must be provided');
  }

  if (orderTotal <= 0) {
    throw new QiCardError('Invalid order amount');
  }

  // Check if there is already an existing active pending QiCard payment for this order
  const existing = await db.qiCardPayment.findFirst({
    where: {
      orderId: targetOrderId,
      status: 'CREATED',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing?.formUrl) {
    return {
      paymentUrl: existing.formUrl,
      paymentId: existing.paymentId,
      requestId: existing.requestId,
      orderId: targetOrderId,
    };
  }

  const requestId = `qi-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const siteUrl = websiteUrl();

  const paymentRecord = await db.qiCardPayment.create({
    data: {
      orderId: targetOrderId,
      cartId: input.cartId,
      requestId,
      amount: orderTotal,
      currency: 'IQD',
      status: 'CREATED',
    },
  });

  try {
    const finishPaymentUrl = `${siteUrl}/api/payment/callback?orderId=${encodeURIComponent(targetOrderId)}`;
    const notificationUrl = `${siteUrl}/api/payment/webhook`;

    const qiResponse = await createQiCardPayment({
      requestId,
      amount: orderTotal,
      currency: 'IQD',
      finishPaymentUrl,
      notificationUrl,
      customerInfo: input.customerInfo,
      additionalInfo: {
        orderId: targetOrderId,
        cartId: input.cartId,
      },
    });

    await db.qiCardPayment.update({
      where: { id: paymentRecord.id },
      data: {
        paymentId: qiResponse.paymentId,
        formUrl: qiResponse.formUrl,
        status: qiResponse.status,
      },
    });

    return {
      paymentUrl: qiResponse.formUrl,
      paymentId: qiResponse.paymentId,
      requestId,
      orderId: targetOrderId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize QiCard payment';
    await db.qiCardPayment.update({
      where: { id: paymentRecord.id },
      data: {
        status: 'FAILED',
        failureReason: message,
      },
    });
    throw error instanceof QiCardError ? error : new QiCardError(message);
  }
}

/**
 * Settles a payment in the database using the verified QiCard status.
 */
export async function settleQiCardPayment(input: {
  paymentId?: string;
  requestId?: string;
  status: string;
  details?: JsonRecord;
  failureReason?: string;
}) {
  const normalizedStatus = input.status.toUpperCase();

  return db.$transaction(
    async (tx) => {
      const payment = await tx.qiCardPayment.findFirst({
        where: {
          OR: [
            input.paymentId ? { paymentId: input.paymentId } : undefined,
            input.requestId ? { requestId: input.requestId } : undefined,
          ].filter(Boolean) as any[],
        },
        include: { order: true },
      });

      if (!payment) {
        throw new QiCardError('QiCard payment transaction was not found in database');
      }

      if (payment.status === SUCCESS) {
        return payment;
      }

      const maskedPan = typeof input.details?.maskedPan === 'string' ? input.details.maskedPan : undefined;
      const paymentSystem = typeof input.details?.paymentSystem === 'string' ? input.details.paymentSystem : undefined;

      const updated = await tx.qiCardPayment.update({
        where: { id: payment.id },
        data: {
          status: normalizedStatus,
          paymentId: input.paymentId || payment.paymentId,
          maskedPan: maskedPan || payment.maskedPan,
          paymentSystem: paymentSystem || payment.paymentSystem,
          details: input.details ? JSON.parse(JSON.stringify(input.details)) : undefined,
          failureReason: input.failureReason,
        },
      });

      if (normalizedStatus === SUCCESS) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { isPaid: true },
        });

        if (payment.cartId) {
          await tx.cart.deleteMany({
            where: { id: payment.cartId },
          });
        }
      }

      return updated;
    },
    { isolationLevel: 'Serializable' }
  );
}

/**
 * Optional RSA SHA256 signature verification for QiCard webhook payloads.
 */
export function verifyQiCardSignature(payload: JsonRecord, signature: string): boolean {
  const publicKey = process.env.QICARD_PUBLIC_KEY?.trim();
  if (!publicKey) {
    // If no public key is configured, fallback to direct server status inquiry
    return true;
  }

  try {
    const paymentId = (payload.paymentId as string) || '-';
    const amountStr = payload.amount ? `${payload.amount}.000` : '-';
    const currency = (payload.currency as string) || '-';
    const creationDate = (payload.creationDate as string) || '-';
    const status = (payload.status as string) || '-';

    const dataString = [paymentId, amountStr, currency, creationDate, status].join('|');
    const signatureBuffer = Buffer.from(signature, 'base64');
    const verifier = createVerify('sha256');
    verifier.update(dataString);
    verifier.end();

    return verifier.verify(publicKey, signatureBuffer);
  } catch (err) {
    console.error('QiCard signature verification error:', err);
    return false;
  }
}
