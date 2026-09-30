"use server";
import { auth } from "@clerk/nextjs/server";
import db from "../db";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "./user";
import { renderError } from "./global";

// Returns the favorite id if the user already liked this product, otherwise null.
export const fetchFavoritID = async (productID: string) => {
  const { userId } = await auth();
  if (!userId) return null;

  const favorite = await db.favorite.findFirst({
    where: { productId: productID, clerkId: userId },
    select: { id: true },
  });

  return favorite?.id || null;
};

type ToggleFavoriteState = {
  productID: string;
  FavoriteID: string | null;
};

// If the product is already a favorite -> remove it. Otherwise -> add it.
export const toggleFavAction = async (prevState: ToggleFavoriteState) => {
  const user = await getAuthUser();
  const { productID, FavoriteID } = prevState;

  try {
    let message = "";

    if (FavoriteID) {
      await db.favorite.delete({ where: { id: FavoriteID } });
      message = "removed from favorite";
    } else {
      await db.favorite.create({
        data: { productId: productID, clerkId: user.id },
      });
      message = "added to favorite";
    }

    revalidatePath("");
    return { message };
  } catch (error) {
    return renderError(error);
  }
};

// All favorites of the logged-in user (with the product data).
export const fetchUserFav = async () => {
  const user = await getAuthUser();

  const favorites = await db.favorite.findMany({
    where: { clerkId: user.id },
    include: { product: true },
  });

  return favorites;
};
