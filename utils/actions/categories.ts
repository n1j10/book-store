"use server";
import { redirect } from "next/navigation";
import db from "../db";
import { categorySchema, imageSchema, validateFuctionSchema } from "../schema";
import { deleteImage, uploadImage } from "../neon-storage";
import { revalidatePath } from "next/cache";
import { links } from "../links";
import { getAdminUser } from "./user";
import { renderError } from "./global";

export const fetchAllCategories = async () => {
  const categories = await db.category.findMany({
    include: { products: true },
    orderBy: { title: "asc" },
  });
  return categories;
};

export const fetchAdminCategories = async () => {
  await getAdminUser();
  const categories = await db.category.findMany({
    orderBy: { createdAt: "desc" },
  });
  return categories;
};

export async function createCategoryAction(
  prevState: any,
  formData: FormData,
): Promise<{ message: string }> {
  const user = await getAdminUser();
  try {
    const rowData = Object.fromEntries(formData);
    const fileImage = formData.get("image") as File;
    const validatedFields = validateFuctionSchema(categorySchema, rowData);
    const validateImage = validateFuctionSchema(imageSchema, { image: fileImage });
    const fullImagePath = await uploadImage(validateImage.image);
    await db.category.create({
      data: { ...validatedFields, image: fullImagePath, clerkId: user.id },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/products");
    return { message: "Category Created successfully" };
  } catch (error) {
    return renderError(error);
  }
}

export async function fetchSingleCategory(categoryId: string) {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) redirect("/categories");
  return category;
}

export const deleteCategoryAction = async (prevState: { categoryId: string }) => {
  const { categoryId } = prevState;
  await getAdminUser();
  try {
    const category = await db.category.delete({ where: { id: categoryId } });
    if (category.image) await deleteImage(category.image);
    revalidatePath("/admin/categories");
    revalidatePath("/products");
    return { message: "Category removed successfully" };
  } catch (error) {
    return renderError(error);
  }
};

export const updateCategoryAction = async (prevState: any, formData: FormData) => {
  await getAdminUser();
  try {
    const categoryId = formData.get("id") as string;
    const rawData = Object.fromEntries(formData);
    const validateData = validateFuctionSchema(categorySchema, rawData);
    await db.category.update({
      where: { id: categoryId },
      data: { title: validateData.title, description: validateData.description || null },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/products");
    return { message: "Category updated successfully" };
  } catch (error) {
    return renderError(error);
  }
};

export const updateCategoryImageAction = async (prevState: any, formData: FormData) => {
  await getAdminUser();
  try {
    const image = formData.get("image") as File;
    const categoryId = formData.get("id") as string;
    const oldImageUrl = formData.get("url") as string;
    const validateImageFile = validateFuctionSchema(imageSchema, { image });
    const fullImagePath = await uploadImage(validateImageFile.image);
    await deleteImage(oldImageUrl);
    await db.category.update({
      where: { id: categoryId },
      data: { image: fullImagePath },
    });
    revalidatePath(`${links.AdminCategories.href}/${categoryId}/edit`);
    return { message: "Image updated successfully" };
  } catch (error) {
    return renderError(error);
  }
};

