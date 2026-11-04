import { app } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";
import { logger } from "./utils/logger";

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 AI Support Platform Backend running on http://localhost:${env.PORT}`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
      logger.info(`Environment: ${env.NODE_ENV} | Retrieval Mode: ${env.RAG_RETRIEVAL_MODE}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info("Server closed successfully.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error: any) {
    logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  }
}

// Only start when invoked directly
if (require.main === module) {
  startServer();
}

export { startServer };

