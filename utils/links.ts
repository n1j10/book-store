type NavBarLinks = {
  href: string;
  name: string;
};

export const dropDownMenuLinks: NavBarLinks[] = [

  { href: '/admin/products/create', name: 'dashboard' },
  { href: '/reviews', name: 'reviews' },

  { href: '/cart', name: 'cart' },
  { href: '/about', name: 'about' },

];

export let links = {
  HOME: { href: '/', name: 'Home' },
  ABOUT: { href: '/about', name: 'About' },
  CART: { href: '/cart', name: 'Cart' },
  PRODUCTS: { href: '/products', name: 'Products' },
  AdminProducts: { href: '/admin/products', name: 'Products' },
  AdminCategories: { href: '/admin/category', name: 'Categories' },


} as const


export const adminLinks: NavBarLinks[] = [
  { href: '/admin/category/create', name: 'create category' },
  { href: '/admin/products/create', name: 'create product' },
  { href: '/admin/products', name: 'my products' },
  { href: '/admin/category', name: 'my categories' },


];
