import {
  users,
  fileUploads,
  subscriptionPlans,
  reportPricing,
  type User,
  type UpsertUser,
  type FileUpload,
  type InsertFileUpload,
  type SubscriptionPlan,
  type ReportPricing,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User profile operations
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User>;
  
  // File upload operations
  createFileUpload(upload: InsertFileUpload): Promise<FileUpload>;
  getFileUploadsByUser(userId: string): Promise<FileUpload[]>;
  updateFileUploadStatus(id: number, status: string, reportUrl?: string): Promise<FileUpload>;
  
  // Subscription operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getReportPricing(): Promise<ReportPricing[]>;
  
  // Trial and subscription management
  incrementTrialReports(userId: string): Promise<User>;
  canUseTrialReport(userId: string): Promise<boolean>;
  
  // Test user management
  setTestUser(userId: string, isTestUser?: boolean): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User> {
    const updateData: Partial<User> = {
      stripeCustomerId: customerId,
      updatedAt: new Date(),
    };
    
    if (subscriptionId) {
      updateData.stripeSubscriptionId = subscriptionId;
      updateData.subscriptionStatus = "active";
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createFileUpload(upload: InsertFileUpload): Promise<FileUpload> {
    const [fileUpload] = await db
      .insert(fileUploads)
      .values(upload)
      .returning();
    return fileUpload;
  }

  async getFileUploadsByUser(userId: string): Promise<FileUpload[]> {
    return await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, userId))
      .orderBy(desc(fileUploads.createdAt));
  }

  async updateFileUploadStatus(id: number, status: string, reportUrl?: string): Promise<FileUpload> {
    const updateData: any = { 
      status,
      updatedAt: new Date()
    };
    if (reportUrl) {
      updateData.reportUrl = reportUrl;
    }

    console.log(`Updating file upload ${id} with:`, updateData);
    const [fileUpload] = await db
      .update(fileUploads)
      .set(updateData)
      .where(eq(fileUploads.id, id))
      .returning();
    console.log(`Database returned:`, fileUpload);
    return fileUpload;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));
  }

  async getReportPricing(): Promise<ReportPricing[]> {
    return await db
      .select()
      .from(reportPricing)
      .where(eq(reportPricing.isActive, true));
  }

  async incrementTrialReports(userId: string): Promise<User> {
    const currentUser = await this.getUser(userId);
    const currentCount = currentUser?.trialReportsUsed || 0;
    
    const [user] = await db
      .update(users)
      .set({ 
        trialReportsUsed: currentCount + 1,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async canUseTrialReport(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    // Test users have unlimited access
    if (user.isTestUser) return true;
    return (user.trialReportsUsed || 0) < 1;
  }

  async setTestUser(userId: string, isTestUser: boolean = true): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        isTestUser,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
