// backend/src/db/prismaClient.ts
// ============================================================
// Improved Prisma Client with Connection Pooling
// Replace: Create this new file and import in all controllers
// ============================================================

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Singleton Prisma client with proper connection pooling
 * Prevents connection leaks and handles graceful shutdown
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Log configuration
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],

    // Connection pooling configuration
    errorFormat: 'pretty',
  });

// Prevent instantiation in production but allow in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Call this in your server shutdown logic
 */
export const disconnectPrisma = async () => {
  console.log('Disconnecting Prisma...');
  try {
    await prisma.$disconnect();
    console.log('Prisma disconnected successfully');
  } catch (err) {
    console.error('Error disconnecting Prisma:', err);
    process.exit(1);
  }
};

/**
 * Health check for database connection
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.error('Database health check failed:', err);
    return false;
  }
};
