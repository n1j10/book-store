"use server";
import db from "../db";
import { reviewSchema } from "../schema";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "./user";
import { renderError } from "./global";

// Add a new review from the logged-in user.
export const creatReviewAction = async (prevState: any, formData: FormData) => {
  const user = await getAuthUser();

  try {
    const formValues = Object.fromEntries(formData);

    // Check the form data. If it is wrong, return the error messages.
    const result = reviewSchema.safeParse(formValues);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message);
      return { message: "Error" + errors.join(",") };
    }

    await db.review.create({
      data: { ...result.data, clerkId: user.id },
    });

    revalidatePath(`/products/${result.data.productId}`);
    return { message: "review submitted successfully" };
  } catch (error) {
    return renderError(error);
  }
};

// All reviews of one product (newest first).
export const fetchProductReview = async (productId: string) => {
  const reviews = await db.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });

  return reviews;
};

// All reviews in the store (newest first), with the product id and name.
export const fetchAllReviews = async () => {
  const reviews = await db.review.findMany({
    include: { product: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return reviews;
};
