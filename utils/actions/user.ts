"use server";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

// Get the logged-in user. If nobody is logged in, go to the home page.
export const getAuthUser = async () => {
  const user = await currentUser();
  if (!user) redirect("/");
  return user;
};

// Same as getAuthUser, but only the admin can pass.
export const getAdminUser = async () => {
  const user = await getAuthUser();
  if (user.id !== process.env.ADMIN_USER_ID) redirect("/");
  return user;
};
