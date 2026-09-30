"use server";
import { redirect } from "next/navigation";
import db from "../db";
import { categorySchema, imageSchema, validateFuctionSchema } from "../schema";
import { deleteImage, uploadImage } from "../neon-storage";
import { revalidatePath } from "next/cache";
import { links } from "../links";
import { getAdminUser } from "./user";
import { renderError } from "./global";

// ================= Read =================

// All categories with their products (sorted by title).
export const fetchAllCategories = async () => {
  const categories = await db.category.findMany({
    include: { products: true },
    orderBy: { title: "asc" },
  });

  return categories;
};

// All categories for the admin page (newest first).
export const fetchAdminCategories = async () => {
  await getAdminUser();

  const categories = await db.category.findMany({
    orderBy: { createdAt: "desc" },
  });

  return categories;
};

// One category by id. If it does not exist, go to the categories page.
export async function fetchSingleCategory(categoryId: string) {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) redirect("/categories");
  return category;
}

// ================= Admin actions =================

// Create a new category (title, description and image).
export async function createCategoryAction(
  prevState: any,
  formData: FormData,
): Promise<{ message: string }> {

  const user = await getAdminUser();
  try {
    const formValues = Object.fromEntries(formData);
    const imageFile = formData.get("image") as File;

    // Check the text fields and the image
    const fields = validateFuctionSchema(categorySchema, formValues);
    const validImage = validateFuctionSchema(imageSchema, { image: imageFile });

    // Upload the image, then save the category
    const imagePath = await uploadImage(validImage.image);
    await db.category.create({
      data: { ...fields, image: imagePath, clerkId: user.id },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/products");
    return { message: "Category Created successfully" };
  } catch (error) {
    return renderError(error);
  }
}

// Delete a category and its image.
export const deleteCategoryAction = async (prevState: { categoryId: string }) => {
  const { categoryId } = prevState;
  await getAdminUser();

  try {
    const category = await db.category.delete({ 
      where: { id: categoryId } 
    });
    if (category.image) await deleteImage(category.image);

    revalidatePath("/admin/categories");
    revalidatePath("/products");
    return { message: "Category removed successfully" };
  } catch (error) {
    return renderError(error);
  }
};

// Update the title and description of a category.
export const updateCategoryAction = async (prevState: any, formData: FormData) => {
  await getAdminUser();

  try {
    const categoryId = formData.get("id") as string;
    const formValues = Object.fromEntries(formData);
    const fields = validateFuctionSchema(categorySchema, formValues);

    await db.category.update({
      where: { id: categoryId },
      data: {
        title: fields.title,
        description: fields.description || null,
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/products");
    return { message: "Category updated successfully" };
  } catch (error) {
    return renderError(error);
  }
};

// Replace the image of a category (upload the new one, delete the old one).
export const updateCategoryImageAction = async (prevState: any, formData: FormData) => {
  await getAdminUser();

  try {
    const imageFile = formData.get("image") as File;
    const categoryId = formData.get("id") as string;
    const oldImageUrl = formData.get("url") as string;

    const validImage = validateFuctionSchema(imageSchema, { image: imageFile });

    const newImagePath = await uploadImage(validImage.image);
    await deleteImage(oldImageUrl);

    await db.category.update({
      where: { id: categoryId },
      data: { image: newImagePath },
    });

    revalidatePath(`${links.AdminCategories.href}/${categoryId}/edit`);
    return { message: "Image updated successfully" };
  } catch (error) {
    return renderError(error);
  }
};
