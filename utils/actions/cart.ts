"use server";
import { redirect } from "next/navigation";
import db from "../db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Cart } from "@/utils/type";
import { getAuthUser } from "./user";
import { renderError } from "./global";
import { fetchSingleProduct } from "./products";

// Load the cart items together with their products.
const cartInclude = {
  cartItems: {
    include: { product: true },
  },
};

// ================= Read =================

// Number of items in the user's cart (0 if not logged in or no cart).
export const fetchCartItems = async () => {
  const { userId } = await auth();
  if (!userId) return 0;

  const cart = await db.cart.findFirst({
    where: { clerkId: userId },
    select: { numItemsInCart: true },
  });

  return cart?.numItemsInCart || 0;
};

// Find the user's cart. If there is none: throw an error or create a new one.
export const fetchOrCreateCart = async ({
  userId,
  errorOnFailure = false,
}: {
  userId: string;
  errorOnFailure?: boolean;
}) => {
  let cart = await db.cart.findFirst({
    where: { clerkId: userId },
    include: cartInclude,
  });

  if (!cart && errorOnFailure) {
    throw new Error("Cart not found");
  }

  if (!cart) {
    cart = await db.cart.create({
      data: { clerkId: userId },
      include: cartInclude,
    });
  }

  return cart;
};

// ================= Helpers =================

// If the product is already in the cart -> add to its amount. Otherwise -> create it.
const addProductToCart = async ({
  productId,
  cartId,
  amount,
}: {
  productId: string;
  cartId: string;
  amount: number;
}) => {
  const cartItem = await db.cartItem.findFirst({
    where: { productId, cartId },
  });

  if (cartItem) {
    await db.cartItem.update({
      where: { id: cartItem.id },
      data: { amount: cartItem.amount + amount },
    });
  } else {
    await db.cartItem.create({
      data: { amount, productId, cartId },
    });
  }
};

// Recalculate the totals of the cart (items count + price) and save them.
export const updateCart = async (cart: Cart) => {
  const cartItems = await db.cartItem.findMany({
    where: { cartId: cart.id },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  let numItemsInCart = 0;
  let cartTotal = 0;

  for (const item of cartItems) {
    numItemsInCart += item.amount;
    cartTotal += item.amount * item.product.price;
  }

  const orderTotal = cartTotal;

  const currentCart = await db.cart.update({
    where: { id: cart.id },
    data: { numItemsInCart, orderTotal, cartTotal },
    include: cartInclude,
  });

  return { cartItems, currentCart };
};

// ================= Actions =================

// Add a product to the cart, then go to the cart page.
export const addToCartAction = async (prevState: any, formData: FormData) => {
  const user = await getAuthUser();

  try {
    const productId = formData.get("productId") as string;
    const amount = Number(formData.get("amount"));

    await fetchSingleProduct(productId); // make sure the product exists
    const cart = await fetchOrCreateCart({ userId: user.id });
    await addProductToCart({ productId, cartId: cart.id, amount });
    await updateCart(cart);
  } catch (error) {
    return renderError(error);
  }

  redirect("/cart");
};

// Remove one item from the cart.
export const removeCartItemAction = async (
  prevState: any,
  formData: FormData,
) => {
  const user = await getAuthUser();

  try {
    const cartItemId = formData.get("id") as string;
    const cart = await fetchOrCreateCart({
      userId: user.id,
      errorOnFailure: true,
    });

    await db.cartItem.delete({
      where: { id: cartItemId, cartId: cart.id },
    });

    await updateCart(cart);
    revalidatePath("/cart");
    return { message: "Item removed from cart" };
  } catch (error) {
    return renderError(error);
  }
};

// Change the amount of one item in the cart.
export const updateCartItemAction = async ({
  amount,
  cartItemId,
}: {
  amount: number;
  cartItemId: string;
}) => {
  const user = await getAuthUser();

  try {
    const cart = await fetchOrCreateCart({
      userId: user.id,
      errorOnFailure: true,
    });

    await db.cartItem.update({
      where: { id: cartItemId, cartId: cart.id },
      data: { amount },
    });

    await updateCart(cart);
    revalidatePath("/cart");
    return { message: "cart updated" };
  } catch (error) {
    return renderError(error);
  }
};
