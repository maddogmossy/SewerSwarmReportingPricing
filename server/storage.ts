import {
  users,
  fileUploads,
  sectionInspections,
  subscriptionPlans,
  reportPricing,
  userCostBands,
  workCategories,
  equipmentTypes,
  userPricing,
  pricingRules,
  standardsRules,
  type User,
  type UpsertUser,
  type FileUpload,
  type InsertFileUpload,
  type SectionInspection,
  type InsertSectionInspection,
  type SubscriptionPlan,
  type ReportPricing,
  type UserCostBand,
  type InsertUserCostBand,
  type WorkCategory,
  type InsertWorkCategory,
  type EquipmentType,
  type InsertEquipmentType,
  type UserPricing,
  type InsertUserPricing,
  type PricingRule,
  type InsertPricingRule,
  type StandardsRule,
  type InsertStandardsRule,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, isNull } from "drizzle-orm";

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
  deleteFileUpload(id: number): Promise<void>;
  
  // Section inspection operations
  createSectionInspections(inspections: InsertSectionInspection[]): Promise<SectionInspection[]>;
  getSectionInspectionsByFileUpload(fileUploadId: number): Promise<SectionInspection[]>;
  deleteSectionInspectionsByFileUpload(fileUploadId: number): Promise<void>;
  
  // Subscription operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getReportPricing(): Promise<ReportPricing[]>;
  
  // Trial and subscription management
  incrementTrialReports(userId: string): Promise<User>;
  canUseTrialReport(userId: string): Promise<boolean>;
  
  // Test user management
  setTestUser(userId: string, isTestUser?: boolean): Promise<User>;
  
  // User cost band customization
  getUserCostBands(userId: string, sector: string): Promise<UserCostBand[]>;
  createUserCostBand(costBand: InsertUserCostBand): Promise<UserCostBand>;
  updateUserCostBand(id: number, costBand: string): Promise<UserCostBand>;
  deleteUserCostBand(id: number): Promise<void>;
  resetUserCostBands(userId: string, sector: string): Promise<void>;
  
  // New detailed pricing system
  getWorkCategories(): Promise<WorkCategory[]>;
  getEquipmentTypesByCategory(categoryId: number): Promise<EquipmentType[]>;
  createEquipmentType(equipment: InsertEquipmentType): Promise<EquipmentType>;
  updateEquipmentType(id: number, equipment: Partial<EquipmentType>): Promise<EquipmentType>;
  deleteEquipmentType(id: number): Promise<void>;
  getUserPricing(userId: string, equipmentTypeId?: number): Promise<UserPricing[]>;
  createUserPricing(pricing: InsertUserPricing): Promise<UserPricing>;
  updateUserPricing(id: number, pricing: Partial<InsertUserPricing>): Promise<UserPricing>;
  deleteUserPricing(id: number): Promise<void>;
  getUserPricingRules(userId: string, categoryId?: number): Promise<PricingRule[]>;
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  updatePricingRule(id: number, userId: string, rule: Partial<InsertPricingRule>): Promise<PricingRule>;
  deletePricingRule(id: number, userId?: string): Promise<void>;
  
  // Sector-specific pricing rules
  getPricingRulesBySector(userId: string, sector: string): Promise<PricingRule[]>;
  
  // Standards-based recommendations
  getStandardsRules(userId: string, sector: string): Promise<StandardsRule[]>;
  createStandardsRule(rule: InsertStandardsRule): Promise<StandardsRule>;
  updateStandardsRule(id: number, userId: string, rule: Partial<InsertStandardsRule>): Promise<StandardsRule>;
  deleteStandardsRule(id: number, userId?: string): Promise<void>;
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

  async deleteFileUpload(id: number): Promise<void> {
    await db.delete(fileUploads).where(eq(fileUploads.id, id));
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

  // Section inspection operations
  async createSectionInspections(inspections: InsertSectionInspection[]): Promise<SectionInspection[]> {
    return await db
      .insert(sectionInspections)
      .values(inspections)
      .returning();
  }

  async getSectionInspectionsByFileUpload(fileUploadId: number): Promise<SectionInspection[]> {
    return await db
      .select()
      .from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, fileUploadId))
      .orderBy(sectionInspections.itemNo);
  }

  async deleteSectionInspectionsByFileUpload(fileUploadId: number): Promise<void> {
    await db
      .delete(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, fileUploadId));
  }

  // User cost band customization methods
  async getUserCostBands(userId: string, sector: string): Promise<UserCostBand[]> {
    return await db.select().from(userCostBands).where(
      and(
        eq(userCostBands.userId, userId),
        eq(userCostBands.sector, sector)
      )
    );
  }

  async createUserCostBand(costBand: InsertUserCostBand): Promise<UserCostBand> {
    const [result] = await db.insert(userCostBands).values(costBand).returning();
    return result;
  }

  async updateUserCostBand(id: number, costBandValue: string): Promise<UserCostBand> {
    const [result] = await db.update(userCostBands)
      .set({ 
        costBand: costBandValue,
        updatedAt: new Date()
      })
      .where(eq(userCostBands.id, id))
      .returning();
    return result;
  }

  async deleteUserCostBand(id: number): Promise<void> {
    await db.delete(userCostBands).where(eq(userCostBands.id, id));
  }

  async resetUserCostBands(userId: string, sector: string): Promise<void> {
    await db.delete(userCostBands).where(
      eq(userCostBands.userId, userId)
    );
  }

  // New detailed pricing system implementation
  async getWorkCategories(): Promise<WorkCategory[]> {
    return await db.select().from(workCategories).orderBy(workCategories.sortOrder);
  }

  async getEquipmentTypesByCategory(categoryId: number, sector?: string): Promise<EquipmentType[]> {
    // For surveys (categoryId 1), return all equipment regardless of workCategoryId
    // This allows proper category-based organization on the frontend
    return await db.select().from(equipmentTypes).orderBy(
      equipmentTypes.category,
      equipmentTypes.minPipeSize,
      equipmentTypes.name
    );
  }

  async createEquipmentType(equipment: InsertEquipmentType): Promise<EquipmentType> {
    const [created] = await db.insert(equipmentTypes).values(equipment).returning();
    return created;
  }

  async updateEquipmentType(id: number, equipmentUpdate: Partial<EquipmentType>): Promise<EquipmentType> {
    const [updated] = await db.update(equipmentTypes)
      .set(equipmentUpdate)
      .where(eq(equipmentTypes.id, id))
      .returning();
    return updated;
  }

  async deleteEquipmentType(id: number): Promise<void> {
    await db.delete(equipmentTypes).where(eq(equipmentTypes.id, id));
  }

  async getUserPricing(userId: string, equipmentTypeId?: number): Promise<UserPricing[]> {
    const conditions = [eq(userPricing.userId, userId)];
    if (equipmentTypeId) {
      conditions.push(eq(userPricing.equipmentTypeId, equipmentTypeId));
    }
    return await db.select().from(userPricing)
      .where(and(...conditions))
      .orderBy(desc(userPricing.updatedAt));
  }

  async createUserPricing(pricing: InsertUserPricing): Promise<UserPricing> {
    const [created] = await db.insert(userPricing).values(pricing).returning();
    return created;
  }

  async updateUserPricing(id: number, pricingUpdate: Partial<InsertUserPricing>): Promise<UserPricing> {
    const [updated] = await db.update(userPricing)
      .set({ ...pricingUpdate, updatedAt: new Date() })
      .where(eq(userPricing.id, id))
      .returning();
    return updated;
  }

  async deleteUserPricing(id: number): Promise<void> {
    await db.delete(userPricing).where(eq(userPricing.id, id));
  }

  async getUserPricingRules(userId: string, categoryId?: number): Promise<PricingRule[]> {
    const conditions = [eq(pricingRules.userId, userId)];
    if (categoryId) {
      conditions.push(eq(pricingRules.workCategoryId, categoryId));
    }
    return await db.select().from(pricingRules)
      .where(and(...conditions))
      .orderBy(desc(pricingRules.createdAt));
  }

  // Sector-specific pricing rules methods
  async getPricingRulesBySector(userId: string, sector: string): Promise<PricingRule[]> {
    return await db.select().from(pricingRules).where(
      and(
        eq(pricingRules.userId, userId),
        eq(pricingRules.sector, sector)
      )
    );
  }

  async createPricingRule(ruleData: InsertPricingRule): Promise<PricingRule> {
    const [created] = await db.insert(pricingRules).values(ruleData).returning();
    return created;
  }

  async updatePricingRule(id: number, userId: string, ruleUpdate: Partial<InsertPricingRule>): Promise<PricingRule> {
    const [updated] = await db.update(pricingRules)
      .set(ruleUpdate)
      .where(
        and(
          eq(pricingRules.id, id),
          eq(pricingRules.userId, userId)
        )
      )
      .returning();
    return updated;
  }

  async deletePricingRule(id: number, userId?: string): Promise<void> {
    if (userId) {
      await db.delete(pricingRules).where(
        and(
          eq(pricingRules.id, id),
          eq(pricingRules.userId, userId)
        )
      );
    } else {
      await db.delete(pricingRules).where(eq(pricingRules.id, id));
    }
  }
}

export const storage = new DatabaseStorage();
