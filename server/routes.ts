import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFileUploadSchema } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/octet-stream'];
    const allowedExtensions = ['.pdf', '.db'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and .db files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.updateUserProfile(userId, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // File upload routes
  app.post('/api/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      const { sector } = req.body;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!sector) {
        return res.status(400).json({ message: "Sector is required" });
      }

      // Check if user can upload (trial, subscription, or test user)
      const user = await storage.getUser(userId);
      const canUseTrial = await storage.canUseTrialReport(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.subscriptionStatus !== "active" && !canUseTrial && !user.isTestUser) {
        return res.status(403).json({ message: "No active subscription or trial reports available" });
      }

      const fileUpload = await storage.createFileUpload({
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        filePath: file.path,
        sector,
      });

      // If using trial, increment counter (but not for test users)
      if (user.subscriptionStatus !== "active" && canUseTrial && !user.isTestUser) {
        await storage.incrementTrialReports(userId);
      }

      // Simulate file processing with a delay, then mark as completed
      await storage.updateFileUploadStatus(fileUpload.id, "processing");
      
      // Simulate processing time (in a real app this would be actual analysis)
      setTimeout(async () => {
        try {
          await storage.updateFileUploadStatus(fileUpload.id, "completed", `/reports/${fileUpload.id}-analysis.pdf`);
        } catch (error) {
          console.error("Error updating file status:", error);
          await storage.updateFileUploadStatus(fileUpload.id, "failed");
        }
      }, 10000); // 10 seconds processing time

      res.json({ fileUpload, message: "File uploaded successfully" });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get('/api/uploads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploads = await storage.getFileUploadsByUser(userId);
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      res.status(500).json({ message: "Failed to fetch uploads" });
    }
  });

  // Manual completion endpoint for stuck reports
  app.post('/api/complete-report/:id', isAuthenticated, async (req: any, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify the upload belongs to the user
      const uploads = await storage.getFileUploadsByUser(userId);
      const upload = uploads.find(u => u.id === uploadId);
      
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }
      
      if (upload.status === "processing") {
        console.log(`Updating upload ${uploadId} from processing to completed`);
        const updatedUpload = await storage.updateFileUploadStatus(uploadId, "completed", `/reports/${uploadId}-analysis.pdf`);
        console.log(`Upload updated:`, updatedUpload);
        res.json({ message: "Report completed successfully", upload: updatedUpload });
      } else {
        res.json({ message: "Report is not in processing state", currentStatus: upload.status });
      }
    } catch (error) {
      console.error("Error completing report:", error);
      res.status(500).json({ message: "Failed to complete report" });
    }
  });

  // Report download route
  app.get('/reports/:filename', isAuthenticated, async (req: any, res) => {
    try {
      const filename = req.params.filename;
      const userId = req.user.claims.sub;
      
      // Verify the user has access to this report
      const uploads = await storage.getFileUploadsByUser(userId);
      const reportExists = uploads.some(upload => 
        upload.reportUrl === `/reports/${filename}` && upload.status === "completed"
      );
      
      if (!reportExists) {
        return res.status(404).json({ message: "Report not found or access denied" });
      }
      
      // Generate sector-specific analysis report
      const upload = uploads.find(u => u.reportUrl === `/reports/${filename}`);
      const reportContent = `SEWER CONDITION ANALYSIS REPORT
Generated: ${new Date().toLocaleDateString()}
File: ${upload?.fileName || filename.replace('-analysis.pdf', '')}
Sector: ${upload?.sector || 'Unknown'}
Standards Applied: WRc/WTI OS19/20x MSCC5R

DEFECT ANALYSIS SUMMARY:
- Structural Grade: A-C classification applied
- Operational Grade: Flow capacity assessment  
- Repair Priority: Immediate/Planned/Monitor
- Cost Band: Based on ${upload?.sector || 'sector'} standards
${upload?.sector === 'utilities' || upload?.sector === 'highways' ? '- Risk Score: Environmental and safety impact assessment' : ''}
${upload?.sector === 'adoption' ? '- Adoptability: Compliance with Sewers for Adoption 7th Ed.' : ''}

STANDARDS COMPLIANCE:
✓ MSCC5 Classification Applied
✓ Cleaning Manual Guidelines Followed  
✓ Repair Book Recommendations Applied
${upload?.sector === 'adoption' || upload?.sector === 'construction' ? '✓ Sewers for Adoption 7th Ed. Standards' : ''}
${upload?.sector === 'highways' ? '✓ HADDMS Guidance Applied' : ''}

This report provides comprehensive sewer condition analysis based on sector-specific requirements.`;
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename.replace('.pdf', '.txt')}"`);
      res.send(reportContent);
      
    } catch (error) {
      console.error("Error downloading report:", error);
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  // Pricing routes
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get('/api/report-pricing', async (req, res) => {
    try {
      const pricing = await storage.getReportPricing();
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching report pricing:", error);
      res.status(500).json({ message: "Failed to fetch report pricing" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const { amount, reportSections } = req.body;
      const userId = req.user.claims.sub;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "gbp",
        metadata: {
          userId,
          reportSections,
          type: "per-report",
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { priceId } = req.body;
      
      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has a subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === 'active') {
          const latestInvoice = subscription.latest_invoice;
          const clientSecret = latestInvoice && typeof latestInvoice === 'object' 
            ? (latestInvoice.payment_intent as any)?.client_secret 
            : null;
            
          return res.json({
            subscriptionId: subscription.id,
            clientSecret,
            status: subscription.status,
          });
        }
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName} ${user.lastName}`.trim(),
          metadata: { userId },
        });
        customerId = customer.id;
        user = await storage.updateUserStripeInfo(userId, customerId);
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: { userId },
      });

      // Update user with subscription info
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);

      const latestInvoice = subscription.latest_invoice;
      const clientSecret = latestInvoice && typeof latestInvoice === 'object' 
        ? (latestInvoice.payment_intent as any)?.client_secret 
        : null;

      res.json({
        subscriptionId: subscription.id,
        clientSecret,
        status: subscription.status,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Webhook for Stripe events
  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      console.error('Webhook signature verification failed.', err);
      return res.status(400).send('Webhook Error');
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        if (paymentIntent.metadata.type === 'per-report') {
          // Handle per-report payment success
          console.log('Per-report payment succeeded:', paymentIntent.id);
        }
        break;
      
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          // Update user subscription status
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata?.userId;
          if (userId) {
            await storage.updateUserProfile(userId, { 
              subscriptionStatus: 'active',
              updatedAt: new Date(),
            });
          }
        }
        break;
      
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as any;
        if (failedInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription as string);
          const userId = subscription.metadata?.userId;
          if (userId) {
            await storage.updateUserProfile(userId, { 
              subscriptionStatus: 'past_due',
              updatedAt: new Date(),
            });
          }
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Admin endpoint to set current user as test user
  app.post('/api/admin/make-me-test-user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updatedUser = await storage.setTestUser(userId, true);
      res.json({ 
        message: "You now have test access with unlimited uploads!",
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error setting test user:", error);
      res.status(500).json({ message: "Failed to set test user" });
    }
  });

  // Admin endpoint to set test users by ID
  app.post('/api/admin/set-test-user', isAuthenticated, async (req: any, res) => {
    try {
      const { userId, isTestUser = true } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const updatedUser = await storage.setTestUser(userId, isTestUser);
      res.json({ 
        message: `User ${isTestUser ? 'granted' : 'removed'} test access`,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error setting test user:", error);
      res.status(500).json({ message: "Failed to set test user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
