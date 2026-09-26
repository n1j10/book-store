import db from "@/utils/db";
import HeroCarouselClient, { HeroSlide } from "./HeroCarouselClient";

const defaultHeroImages: HeroSlide[] = [
  {
    id: "default-1",
    title: "Discover your next great read",
    image: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg",
  },
  {
    id: "default-2",
    title: "Stories worth sharing",
    image: "https://images.pexels.com/photos/7643400/pexels-photo-7643400.jpeg",
  },

];

async function HeroCarousel() {
  let heroes: HeroSlide[] = [];
  try {
    heroes = await db.hero.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching hero images:", error);
  }

  const items = heroes && heroes.length > 0 ? heroes : defaultHeroImages;

  return <HeroCarouselClient items={items} />;
}

export default HeroCarousel;
