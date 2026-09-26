"use client";

import * as React from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export interface HeroSlide {
  id: string;
  title?: string;
  image: string;
}

interface HeroCarouselClientProps {
  items: HeroSlide[];
}

export default function HeroCarouselClient({ items }: HeroCarouselClientProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false })
  );

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="w-full my-6">
      <Carousel
        plugins={[plugin.current]}
        opts={{
          loop: true,
          align: "start",
        }}
        className="w-full"
        onMouseEnter={() => plugin.current.stop()}
        onMouseLeave={() => plugin.current.reset()}
      >
        <CarouselContent>
          {items.map((item, index) => (
            <CarouselItem key={item.id || index}>
              <div className="relative w-full h-[260px] sm:h-[350px] md:h-[420px] lg:h-[480px] rounded-xl overflow-hidden border border-border shadow-md">
                <Image
                  src={item.image}
                  alt={item.title || `Hero Slide ${index + 1}`}
                  fill
                  priority={index === 0}
                  className="object-cover w-full h-full"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                />
                {item.title && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6 md:p-8">
                    <h3 className="text-white text-lg sm:text-2xl md:text-3xl font-bold drop-shadow">
                      {item.title}
                    </h3>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-3 sm:left-4 z-10" />
        <CarouselNext className="right-3 sm:right-4 z-10" />
      </Carousel>
    </div>
  );
}
