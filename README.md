<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Seed books and Neon Storage

Book metadata and cover IDs were sourced through the [Open Library Search API](https://openlibrary.org/dev/docs/api/search); cover images are served by the Open Library Covers API.

1. Configure the public-read `book-store-images` bucket from `neon.ts` on the Neon project/branch with `neon deploy`, then run `neon env pull` to populate the AWS environment variables.
2. Set `DATABASE_URL` to the Neon pooled connection string and `DIRECT_URL` to the direct connection string.
3. Run `npm run seed` to insert or update the sample categories and books.

The seed is idempotent and uses stable IDs. New admin uploads are stored in Neon Object Storage; seeded cover images remain hosted by Open Library.
## Seed books and Neon Storage

Book metadata and cover IDs were sourced through the [Open Library Search API](https://openlibrary.org/dev/docs/api/search); cover images are served by the Open Library Covers API.

1. Configure the public-read `book-store-images` bucket from `neon.ts` on the Neon project/branch with `neon deploy`, then run `neon env pull` to populate the AWS environment variables.
2. Set `DATABASE_URL` to the Neon pooled connection string and `DIRECT_URL` to the direct connection string.
3. Run `npm run seed` to insert or update the sample categories and books.

The seed is idempotent and uses stable IDs. New admin uploads are stored in Neon Object Storage; seeded cover images remain hosted by Open Library.
=======
# book-store
>>>>>>> 93a261845d66ab6b7f633dd2aa9200f351b4b65d
