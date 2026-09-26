import { Product } from "@/lib/generated/prisma/client";
import Link from "next/link";
import { links } from "@/utils/links";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";
import { formatCurrency } from "@/utils/format";
import FavoriteToggleButton from "./FavoriteToggleButton";
import SubmitButton from "../form/Buttons";
import FormContainer from "../form/FormContainer";
import { addToCartAction } from "@/utils/actions/global";

function ProductsGrid({ products }: { products: Product[] }) {
  return (
    <section className="grid grid-cols-2 items-stretch gap-3 pb-14 pt-8 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => {
        // const { name, price, image } = product;  //shortcut for all name iamge price
        const productName = product.name;
        const productId = product.id;
        const DinarAmount = formatCurrency(product.price);
        const description = product.description;
        return (
          <div key={productId} className="group relative h-full min-w-0">
            <Card className="flex h-full min-h-[19rem] flex-col overflow-hidden rounded-2xl border-border/80 bg-card/90 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl sm:min-h-[27rem]">
              <CardContent className="flex flex-1 flex-col p-2.5 sm:p-4">
                <div className="relative aspect-[2/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Link href={`${links.PRODUCTS.href}/${productId}`}>
                    <Image
                      src={product.image}
                      alt={productName}
                      fill
                      sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                </div>
                <div className="mt-3 min-h-[2.5rem] text-center sm:mt-4 sm:min-h-[4.25rem]">
                  <h2
                    className="line-clamp-2 text-xs font-semibold leading-5 capitalize sm:text-base sm:leading-6"
                    title={productName}
                  >
                    {productName}
                  </h2>
                  <h4 className="mt-1 hidden min-h-[2.5rem] text-xs leading-5 capitalize text-muted-foreground sm:line-clamp-2 sm:block">
                    {description}
                  </h4>
                </div>
                <div className="mt-auto flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <FormContainer action={addToCartAction}>
                    <input type="hidden" name="productId" value={productId} />
                    <input type="hidden" name="amount" value={1} />
                    <SubmitButton
                      text="add to cart"
                      className="mt-0 min-h-9 w-full rounded-xl text-[0.68rem] sm:w-auto sm:text-xs"
                    />
                  </FormContainer>
                  <p className="text-center text-xs font-medium text-muted-foreground sm:text-right sm:text-sm">
                    {DinarAmount}
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="absolute right-4 top-4 z-10 sm:right-5 sm:top-5">
              <FavoriteToggleButton productId={productId} />
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default ProductsGrid;

//method 22222

// {products.map((product: Product) => (
//   <div className='group relative' key={product.id}>
//     <Link href={`${links.PRODUCTS.href}/${product.id}`} >
//       <Card className='transform group-hover:shadow-xl transition-shadow duration-500'>
//         <CardContent >
//           <div className='relative h-64 md:h-48 rounded overflow-hidden '>
//             <Image
//               src={product.image}
//               alt={product.name}
//               fill
//               sizes='(max-width:768px) 100vw,(max-width:1200px) 50vw, 33vw '

//             />
//           </div>
//           <div className='mt-4 text-center'>
//             <h2 className='text-lg capitalize'>

//               {product.name}
//             </h2>
//             <p className='text-muted-foreground mt-2'>
//               {formatCurrency(product.price)}
//             </p>

//           </div>
//         </CardContent>
//       </Card>

//     </Link>
//     <div className='absolute top-7 right-7 z-5'>
//       <FavoriteToggleButton productId={product.id} />
//     </div>
//   </div>
// ))}
