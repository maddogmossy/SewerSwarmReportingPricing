import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerCleanPR2Routes } from "./routes-pr2-clean";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Register clean PR2 routes
  await registerCleanPR2Routes(app);
  
  // Register dev pricing endpoint for testing
  try {
    const devPriceRouter = await import('./dev/price.mjs');
    app.use(devPriceRouter.default);
    log('Dev pricing endpoint registered');
  } catch (error) {
    console.warn('Dev pricing endpoint not available:', error.message);
  }
  
  // Register recommendations endpoint with costing
  try {
    const recommendationsRouter = await import('./routes/recommendations.mjs');
    app.use(recommendationsRouter.default);
    log('Recommendations endpoint with costing registered');
  } catch (error) {
    console.warn('Recommendations endpoint not available:', error.message);
  }
  


  // Serve static files for uploaded logos BEFORE Vite setup to prevent catch-all interference
  app.use('/uploads', express.static('uploads'));

  // Fuel price monitoring disabled temporarily to resolve connection issues
  // try {
  //   const { setupFuelPriceMonitoring } = await import('./fuel-price-monitor');
  //   setupFuelPriceMonitoring();
  //   log('Fuel price monitoring system initialized');
  // } catch (error) {
  //   console.error('Failed to initialize fuel price monitoring:', error);
  // }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
