// Turn any error into a simple { message } object that the forms can show.
export const renderError = (error: unknown): { message: string } => {
  return {
    message: error instanceof Error ? error.message : "Unknown Error",
  };
};

// ── Re-exports ──────────────────────────────────────────────────────────────
// So old imports like `import { fetchAllProducts } from "@/utils/actions/global"`
// keep working.

export { getAuthUser, getAdminUser } from "./user";

export {
  fetchCartItems,
  fetchOrCreateCart,
  updateCart,
  addToCartAction,
  removeCartItemAction,
  updateCartItemAction,
} from "./cart";

export { fetchFavoritID, toggleFavAction, fetchUserFav } from "./Favorites";

export {
  fetchAllCategories,
  fetchAdminCategories,
  createCategoryAction,
  fetchSingleCategory,
  deleteCategoryAction,
  updateCategoryAction,
  updateCategoryImageAction,
} from "./categories";

export {
  createOrderAction,
  payOrderAction,
  fetchUserOrders,
  fetchAdminOrders,
} from "./orders";

export {
  fetchFeaturedProducts,
  fetchAllProducts,
  fetchSingleProduct,
  createProductAction,
  deleteProductAction,
  updateProductAction,
  updateProductImageAction,
  fetchAdminPosts,
} from "./products";

export {
  creatReviewAction,
  fetchProductReview,
  fetchAllReviews,
} from "./reviews";
