"use server";
import { redirect } from "next/navigation";
import type { User } from "@clerk/nextjs/server";
import db from "../db";
import { startQiCardCheckout } from "@/lib/qicard";
import { getAuthUser, getAdminUser } from "./user";
import { renderError } from "./global";
import { fetchOrCreateCart } from "./cart";

// ================= Helpers =================

// The customer data that QiCard needs.
const getCustomerInfo = (user: User) => {
  return {
    firstName: user.firstName || "Customer",
    lastName: user.lastName || "",
    email: user.emailAddresses?.[0]?.emailAddress,
  };
};

// Ask QiCard for a payment link.
// If QiCard fails we only log the error and return null (the user will pay later from /orders).
const getPaymentUrl = async (user: User, orderId: string, cartId?: string) => {
  try {
    const checkout = await startQiCardCheckout({
      clerkId: user.id,
      orderId,
      cartId,
      customerInfo: getCustomerInfo(user),
    });
    return checkout.paymentUrl;
  } catch (error) {
    console.error("QiCard checkout initiation error:", error);
    return null;
  }
};

// Buy ONE product directly ("Buy now"): create an order and get the payment link.
const buyOneProduct = async (user: User, productId: string) => {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const order = await db.order.create({
    data: {
      clerkId: user.id,
      productId: product.id,
      products: 1,
      orderTotal: product.price,
      isPaid: false,
    },
  });

  return getPaymentUrl(user, order.id);
};

// Buy everything in the cart: create one order per cart item and get the payment link.
const buyCart = async (user: User) => {
  const cart = await fetchOrCreateCart({ userId: user.id, errorOnFailure: true });
  if (!cart.cartItems.length) throw new Error("Cart is empty");

  const orders = await Promise.all(
    cart.cartItems.map((item) =>
      db.order.create({
        data: {
          clerkId: user.id,
          productId: item.productId,
          products: item.amount,
          orderTotal: item.amount * item.product.price,
          isPaid: false,
        },
      }),
    ),
  );

  // The payment is started with the first order
  return getPaymentUrl(user, orders[0].id, cart.id);
};

// ================= Actions =================

// Create the order(s) and send the user to the payment page.
// If the form has a productId -> buy that product. Otherwise -> buy the cart.
export const createOrderAction = async (prevState: any, formData: FormData) => {
  const user = await getAuthUser();
  let paymentUrl: string | null = null;

  try {
    const productId = formData.get("productId") as string | null;

    if (productId) {
      paymentUrl = await buyOneProduct(user, productId);
    } else {
      paymentUrl = await buyCart(user);
    }
  } catch (error) {
    return renderError(error);
  }

  if (paymentUrl) redirect(paymentUrl);
  else redirect("/orders");
};

// Pay an order that already exists (for example an unpaid order).
export const payOrderAction = async (prevState: any, formData: FormData) => {
  const user = await getAuthUser();
  const orderId = formData.get("orderId") as string;
  if (!orderId) return renderError(new Error("Order ID is required"));

  let paymentUrl: string | null = null;

  try {
    const checkout = await startQiCardCheckout({
      clerkId: user.id,
      orderId,
      customerInfo: getCustomerInfo(user),
    });
    paymentUrl = checkout.paymentUrl;
  } catch (error) {
    return renderError(error);
  }

  if (paymentUrl) redirect(paymentUrl);
  else redirect("/orders");
};

// ================= Read =================

// Orders of the logged-in user (newest first).
export const fetchUserOrders = async () => {
  const user = await getAuthUser();

  const orders = await db.order.findMany({
    where: { clerkId: user.id },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return orders;
};

// All orders for the admin (newest first).
export const fetchAdminOrders = async () => {
  await getAdminUser();

  const orders = await db.order.findMany({
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return orders;
};
