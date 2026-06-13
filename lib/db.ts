import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma Postgres direct (pooled) connection over the standard postgres://
// protocol. Prisma 7 has no bundled engine, so a driver adapter is required.
function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
