import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "../ui/card";
import { fetchAllCategories } from "@/utils/actions/global";
import EmptyList from "../global/EmptyList";
import { links } from "@/utils/links";
import NavSearch from "./HeroSearch";
import HeroCarousel from "./HeroCarousel";

async function Hero() {
  const categories = await fetchAllCategories();

  if (categories.length === 0)
    return <EmptyList title="No Active Categories" />;

  return (
    <>
      <HeroCarousel />
      <NavSearch />
      <section className="grid grid-cols-2 gap-3 pt-10 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {categories.map((category) => {
          const { id, title, image } = category;
          return (
            <div key={id} className="group relative min-w-0">
              <Link
                className="block h-full"
                href={`${links.PRODUCTS.href}?category=${id}`}
              >
                <Card className="h-full overflow-hidden rounded-2xl border-border/80 bg-card/90 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                  <CardContent className="p-2.5 sm:p-3">
                    <div className="relative aspect-[3/3.75] w-full overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={`${image}`}
                        alt={title}
                        fill
                        sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
                        priority
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex min-h-12 items-center justify-center px-1 pt-2 text-center sm:min-h-14 sm:pt-3">
                      <h2 className="line-clamp-2 text-sm font-semibold capitalize leading-5 sm:text-base sm:leading-6">
                        {title}
                      </h2>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          );
        })}
      </section>
    </>
  );
}

export default Hero;
