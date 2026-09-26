import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });
const seedOwnerId = "seed-open-library";

const categories = [
  { title: "Fiction", image: "https://covers.openlibrary.org/b/id/14627509-L.jpg", description: "Popular fiction and literary classics." },
  { title: "Fantasy & Science Fiction", image: "https://covers.openlibrary.org/b/id/11481354-L.jpg", description: "Fantasy worlds and science fiction adventures." },
  { title: "Mystery & Thriller", image: "https://covers.openlibrary.org/b/id/9407338-L.jpg", description: "Mysteries, suspense, and page-turning thrillers." },
  { title: "Personal Development", image: "https://covers.openlibrary.org/b/id/12539702-L.jpg", description: "Practical books on habits, psychology, and growth." },
  { title: "Classics", image: "https://covers.openlibrary.org/b/id/14348537-L.jpg", description: "Enduring classics from world literature." },
];

const books = [
  { name: "Atomic Habits", author: "James Clear", year: 2016, cover: 12539702, price: 18000, featured: true, category: "Personal Development", description: "A practical guide to building better habits, breaking unwanted routines, and making small changes that compound over time. By James Clear (2016). Open Library: https://openlibrary.org/works/OL17930368W" },
  { name: "The Hobbit", author: "J.R.R. Tolkien", year: 1937, cover: 14627509, price: 16000, featured: true, category: "Fantasy & Science Fiction", description: "Bilbo Baggins joins a company of dwarves on a perilous journey to reclaim their home and its treasure. By J.R.R. Tolkien (1937). Open Library: https://openlibrary.org/works/OL27482W" },
  { name: "The Silent Patient", author: "Alex Michaelides", year: 2018, cover: 9407338, price: 20000, featured: true, category: "Mystery & Thriller", description: "A psychological thriller about a painter who stops speaking after a shocking act of violence and the psychotherapist determined to understand her. By Alex Michaelides (2018). Open Library: https://openlibrary.org/works/OL19096402W" },
  { name: "Nineteen Eighty-Four", author: "George Orwell", year: 1949, cover: 9267242, price: 14000, featured: true, category: "Classics", description: "A classic dystopian novel about surveillance, propaganda, and an individual's struggle under totalitarian rule. By George Orwell (1949). Open Library: https://openlibrary.org/works/OL1168083W" },
  { name: "Pride and Prejudice", author: "Jane Austen", year: 1813, cover: 14348537, price: 12000, featured: false, category: "Classics", description: "Elizabeth Bennet navigates family expectations, first impressions, and her changing feelings toward the reserved Mr Darcy. By Jane Austen (1813). Open Library: https://openlibrary.org/works/OL66554W" },
  { name: "Dune", author: "Frank Herbert", year: 1965, cover: 11481354, price: 22000, featured: true, category: "Fantasy & Science Fiction", description: "Paul Atreides enters the dangerous politics of Arrakis, a desert planet central to the future of humanity. By Frank Herbert (1965). Open Library: https://openlibrary.org/works/OL893414W" },
  { name: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925, cover: 10590366, price: 13000, featured: false, category: "Classics", description: "A portrait of ambition, wealth, and longing in Jazz Age America, told through the world of Jay Gatsby. By F. Scott Fitzgerald (1925). Open Library: https://openlibrary.org/works/OL468431W" },
  { name: "The Alchemist", author: "Paulo Coelho", year: 1988, cover: 7414780, price: 15000, featured: true, category: "Fiction", description: "A young Andalusian shepherd travels in search of treasure and discovers a story about purpose and listening to one's heart. By Paulo Coelho (1988). Open Library: https://openlibrary.org/works/OL796465W" },
  { name: "The Little Prince", author: "Antoine de Saint-Exupéry", year: 1943, cover: 10708272, price: 11000, featured: false, category: "Classics", description: "A pilot stranded in the desert meets a young traveler whose stories invite reflection on friendship and how we see the world. By Antoine de Saint-Exupéry (1943). Open Library: https://openlibrary.org/works/OL10263W" },
  { name: "Thinking, Fast and Slow", author: "Daniel Kahneman", year: 2011, cover: 13290711, price: 19000, featured: false, category: "Personal Development", description: "Daniel Kahneman explains two modes of thought and how they shape judgment, decisions, and common biases. By Daniel Kahneman (2011). Open Library: https://openlibrary.org/works/OL15992072W" },
];

async function main() {
  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const saved = await db.category.upsert({
      where: { title: category.title },
      update: { image: category.image, description: category.description },
      create: { ...category, clerkId: seedOwnerId },
      select: { id: true },
    });
    categoryIds.set(category.title, saved.id);
  }

  for (const book of books) {
    const { name: title, author, year, cover, price, featured, category, description: summary } = book;
    const name = `${title} - ${author}`;
    const description = `${summary}\n\nFirst published: ${year}.`;
    const image = `https://covers.openlibrary.org/b/id/${cover}-L.jpg`;
    const categoryId = categoryIds.get(category)!;

    await db.product.upsert({
      where: { id: `openlibrary-${cover}` },
      update: { name, description, image, price, featured, categoryId },
      create: {
        id: `openlibrary-${cover}`,
        name,
        description,
        image,
        price,
        featured,
        categoryId,
        clerkId: seedOwnerId,
      },
    });
  }
  console.log(`Seeded ${categories.length} categories and ${books.length} Open Library books.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
});



