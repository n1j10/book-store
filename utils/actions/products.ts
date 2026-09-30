"use server";
import { redirect } from "next/navigation";
import db from "../db";
import { imageSchema, productSchema, validateFuctionSchema } from "../schema";
import { deleteImage, uploadImage } from "../neon-storage";
import { revalidatePath } from "next/cache";
import { links } from "../links";
import { getAuthUser, getAdminUser } from "./user";
import { renderError } from "./global";

// ================= Helpers =================

// The product form sends the category TITLE, but the database needs the category ID.
// This function finds the category by title and returns its id.
const findCategoryIdByTitle = async (title: string) => {
  const category = await db.category.findUnique({ where: { title } });
  if (!category) throw new Error("Category not found");
  return category.id;
};

// ================= Read =================

// Only the products marked as featured.
export const fetchFeaturedProducts = async () => {
  const products = await db.product.findMany({ where: { featured: true } });
  return products;
};

// All products. Optional filters: search by name and/or category.
// (A filter set to `undefined` is ignored by Prisma.)
export async function fetchAllProducts({
  search = "",
  categoryId,
}: {
  search?: string;
  categoryId?: string;
}) {
  const products = await db.product.findMany({
    where: {
      categoryId: categoryId || undefined,
      name: search ? { contains: search, mode: "insensitive" } : undefined,
    },
    orderBy: { createdAt: "desc" },
  });

  return products;
}

// One product by id (with its category). If it does not exist, go to the products page.
export async function fetchSingleProduct(productID: string) {
  const product = await db.product.findUnique({
    where: { id: productID },
    include: { category: true },
  });
  if (!product) redirect("/products");
  return product;
}

// The products created by the admin (newest first).
export const fetchAdminPosts = async () => {
  const user = await getAdminUser();

  const products = await db.product.findMany({
    where: { clerkId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return products;
};

// ================= Actions =================

// Create a new product.
export async function createProductAction(
  prevState: any,
  formData: FormData,
): Promise<{ message: string }> {
  const user = await getAuthUser();

  try {
    const formValues = Object.fromEntries(formData);
    const imageFile = formData.get("image") as File;

    // Check the text fields and the image
    const fields = validateFuctionSchema(productSchema, formValues);
    const validImage = validateFuctionSchema(imageSchema, { image: imageFile });

    // The form sends the category title, so we get the real category id
    const categoryId = await findCategoryIdByTitle(fields.categoryId);

    // Upload the image, then save the product
    const imagePath = await uploadImage(validImage.image);
    await db.product.create({
      data: { ...fields, categoryId, image: imagePath, clerkId: user.id },
    });

    return { message: "Product Created" };
  } catch (error) {
    return renderError(error);
  }
}

// Delete a product and its image.
export const deleteProductAction = async (prevState: { productId: string }) => {
  const { productId } = prevState;
  await getAdminUser();

  try {
    const product = await db.product.delete({ where: { id: productId } });
    await deleteImage(product.image);

    return { message: "product removed" };
  } catch (error) {
    return renderError(error);
  }
};

// Update the text fields of a product (not the image).
export const updateProductAction = async (prevState: any, formData: FormData) => {
  await getAdminUser();

  try {
    const productId = formData.get("id") as string;
    const formValues = Object.fromEntries(formData);
    const fields = validateFuctionSchema(productSchema, formValues);

    const categoryId = await findCategoryIdByTitle(fields.categoryId);

    await db.product.update({
      where: { id: productId },
      data: { ...fields, categoryId },
    });

    revalidatePath(`${links.AdminProducts.href}/${productId}/edit`);
    return { message: "Product updated successfully" };
  } catch (error) {
    return renderError(error);
  }
};

// Replace the image of a product (upload the new one, delete the old one).
export const updateProductImageAction = async (prevState: any, formData: FormData) => {
  await getAuthUser();

  try {
    const imageFile = formData.get("image") as File;
    const productId = formData.get("id") as string;
    const oldImageUrl = formData.get("url") as string;

    const validImage = validateFuctionSchema(imageSchema, { image: imageFile });

    const newImagePath = await uploadImage(validImage.image);
    await deleteImage(oldImageUrl);

    await db.product.update({
      where: { id: productId },
      data: { image: newImagePath },
    });

    revalidatePath(`${links.AdminProducts.href}/${productId}/edit`);
    return { message: "Image updated successfully" };
  } catch (error) {
    return renderError(error);
  }
};
