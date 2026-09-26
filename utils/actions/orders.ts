"use server";
import { redirect } from "next/navigation";
import db from "../db";
import { revalidatePath } from "next/cache";
import { startQiCardCheckout } from "@/lib/qicard";
import { getAuthUser, getAdminUser } from "./user";
import { renderError } from "./global";
import { fetchOrCreateCart } from "./cart";

export const createOrderAction = async (prevState: any, formData: FormData) => {
  const user = await getAuthUser();
  let paymentUrl: string | null = null;

  try {
    const productIdFromForm = formData.get("productId") as string | null;

    if (productIdFromForm) {
      const product = await db.product.findUnique({ where: { id: productIdFromForm } });
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

      try {
        const checkout = await startQiCardCheckout({
          clerkId: user.id,
          orderId: order.id,
          customerInfo: {
            firstName: user.firstName || "Customer",
            lastName: user.lastName || "",
            email: user.emailAddresses?.[0]?.emailAddress,
          },
        });
        paymentUrl = checkout.paymentUrl;
      } catch (checkoutErr) {
        console.error("QiCard direct checkout initiation error:", checkoutErr);
      }
    } else {
      const cart = await fetchOrCreateCart({ userId: user.id, errorOnFailure: true });

      if (!cart.cartItems.length) throw new Error("Cart is empty");

      const createdOrders = await Promise.all(
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

      const primaryOrder = createdOrders[0];
      try {
        const checkout = await startQiCardCheckout({
          clerkId: user.id,
          orderId: primaryOrder.id,
          cartId: cart.id,
          customerInfo: {
            firstName: user.firstName || "Customer",
            lastName: user.lastName || "",
            email: user.emailAddresses?.[0]?.emailAddress,
          },
        });
        paymentUrl = checkout.paymentUrl;
      } catch (checkoutErr) {
        console.error("QiCard cart checkout initiation error:", checkoutErr);
      }
    }
  } catch (error) {
    return renderError(error);
  }

  if (paymentUrl) redirect(paymentUrl);
  else redirect("/orders");
};

export const payOrderAction = async (prevState: any, formData: FormData) => {
  const user = await getAuthUser();
  const orderId = formData.get("orderId") as string;
  if (!orderId) return renderError(new Error("Order ID is required"));

  let paymentUrl: string | null = null;
  try {
    const checkout = await startQiCardCheckout({
      clerkId: user.id,
      orderId,
      customerInfo: {
        firstName: user.firstName || "Customer",
        lastName: user.lastName || "",
        email: user.emailAddresses?.[0]?.emailAddress,
      },
    });
    paymentUrl = checkout.paymentUrl;
  } catch (error) {
    return renderError(error);
  }

  if (paymentUrl) redirect(paymentUrl);
  else redirect("/orders");
};

export const fetchUserOrders = async () => {
  const user = await getAuthUser();
  const orders = await db.order.findMany({
    where: { clerkId: user.id },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return orders;
};

export const fetchAdminOrders = async () => {
  await getAdminUser();
  const orders = await db.order.findMany({
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return orders;
};
