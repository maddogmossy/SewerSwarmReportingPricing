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
  companySettings,
  depotSettings,
  vehicleTravelRates,
  teamInvitations,
  teamBillingRecords,
  projectFolders,
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
  type CompanySettings,
  type InsertCompanySettings,
  type DepotSettings,
  type InsertDepotSettings,
  type VehicleTravelRate,
  type InsertVehicleTravelRate,
  type TeamInvitation,
  type InsertTeamInvitation,
  type TeamBillingRecord,
  type InsertTeamBillingRecord,
  type ProjectFolder,
  type InsertProjectFolderType,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, isNull, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User profile operations
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User>;
  
  // Project folder operations
  getProjectFolders(userId: string): Promise<ProjectFolder[]>;
  createProjectFolder(folder: InsertProjectFolderType): Promise<ProjectFolder>;
  updateProjectFolder(id: number, folder: Partial<ProjectFolder>): Promise<ProjectFolder>;
  deleteProjectFolder(id: number): Promise<{ folderName: string; deletedCounts: { uploads: number; sections: number } }>;
  
  // File upload operations
  createFileUpload(upload: InsertFileUpload): Promise<FileUpload>;
  getFileUploadsByUser(userId: string): Promise<FileUpload[]>;
  getFileUploadsByFolder(folderId: number | null): Promise<FileUpload[]>;
  getFileUploadById(id: number): Promise<FileUpload | undefined>;
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
  
  // Company settings for admin users
  getCompanySettings(adminUserId: string): Promise<CompanySettings | undefined>;
  createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
  updateCompanySettings(adminUserId: string, settings: Partial<CompanySettings>): Promise<CompanySettings>;
  
  // Team management
  getTeamMembers(adminUserId: string): Promise<User[]>;
  createTeamInvitation(invitation: InsertTeamInvitation): Promise<TeamInvitation>;
  getTeamInvitation(token: string): Promise<TeamInvitation | undefined>;
  acceptTeamInvitation(token: string, userId: string): Promise<void>;
  createTeamBillingRecord(record: InsertTeamBillingRecord): Promise<TeamBillingRecord>;
  
  // Payment method management
  updateUserPaymentMethod(userId: string, paymentMethodId: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
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
    return result[0];
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

  // Project folder operations
  async getProjectFolders(userId: string): Promise<ProjectFolder[]> {
    return await db
      .select()
      .from(projectFolders)
      .where(eq(projectFolders.userId, userId))
      .orderBy(desc(projectFolders.createdAt));
  }

  async createProjectFolder(folder: InsertProjectFolderType): Promise<ProjectFolder> {
    const [created] = await db
      .insert(projectFolders)
      .values(folder)
      .returning();
    return created;
  }

  async updateProjectFolder(id: number, folderUpdate: Partial<ProjectFolder>): Promise<ProjectFolder> {
    const [updated] = await db
      .update(projectFolders)
      .set(folderUpdate)
      .where(eq(projectFolders.id, id))
      .returning();
    return updated;
  }

  async deleteProjectFolder(id: number): Promise<{ folderName: string; deletedCounts: { uploads: number; sections: number } }> {
    // Get folder info before deletion
    const [folder] = await db.select().from(projectFolders).where(eq(projectFolders.id, id));
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Get all uploads in this folder
    const uploadsInFolder = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.folderId, id));

    let totalSectionsDeleted = 0;
    let totalUploadsDeleted = 0;

    // Delete all associated data for each upload in the folder
    for (const upload of uploadsInFolder) {
      // Delete sections for this upload
      const deletedSections = await db
        .delete(sectionInspections)
        .where(eq(sectionInspections.fileUploadId, upload.id))
        .returning();
      
      totalSectionsDeleted += deletedSections.length;
      
      // Delete the upload record
      await db.delete(fileUploads).where(eq(fileUploads.id, upload.id));
      totalUploadsDeleted++;
      
      console.log(`Deleted upload ${upload.id} from folder ${id}, removed ${deletedSections.length} sections`);
    }
    
    // Finally delete the folder itself
    await db.delete(projectFolders).where(eq(projectFolders.id, id));
    
    console.log(`Folder ${id} completely deleted: ${totalUploadsDeleted} uploads, ${totalSectionsDeleted} sections`);
    
    return {
      folderName: folder.folderName || folder.projectAddress || 'Unnamed Folder',
      deletedCounts: {
        uploads: totalUploadsDeleted,
        sections: totalSectionsDeleted
      }
    };
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

  async getFileUploadsByFolder(folderId: number | null): Promise<FileUpload[]> {
    return await db
      .select()
      .from(fileUploads)
      .where(
        folderId === null 
          ? isNull(fileUploads.folderId)
          : eq(fileUploads.folderId, folderId)
      )
      .orderBy(desc(fileUploads.createdAt));
  }

  async getSectionsByUpload(uploadId: number): Promise<SectionInspection[]> {
    return await db
      .select()
      .from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, uploadId))
      .orderBy(asc(sectionInspections.itemNo));
  }

  async getFileUploadById(id: number): Promise<FileUpload | undefined> {
    const [fileUpload] = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.id, id));
    return fileUpload;
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
    // First delete associated section inspections
    const deletedSections = await db
      .delete(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, id))
      .returning();
    
    console.log(`Deleted upload ${id}, removed ${deletedSections.length} items`);
    
    // Then delete the file upload record
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
        costBand: costBandValue
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
      .set(pricingUpdate)
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

  // Company settings implementation
  async getCompanySettings(adminUserId: string): Promise<CompanySettings | undefined> {
    const [settings] = await db.select()
      .from(companySettings)
      .where(eq(companySettings.adminUserId, adminUserId));
    return settings;
  }

  async createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const [created] = await db.insert(companySettings)
      .values(settings)
      .returning();
    return created;
  }

  async updateCompanySettings(adminUserId: string, updates: Partial<CompanySettings>): Promise<CompanySettings> {
    // Check if settings exist
    const existing = await this.getCompanySettings(adminUserId);
    
    if (existing) {
      // Update existing record
      const [updated] = await db.update(companySettings)
        .set(updates)
        .where(eq(companySettings.adminUserId, adminUserId))
        .returning();
      return updated;
    } else {
      // Create new record
      const newSettings: InsertCompanySettings = {
        adminUserId,
        companyName: "Sewer Inspection Co.",
        companyLogo: null,
        buildingName: "",
        streetName: "",
        streetName2: "",
        town: "",
        city: "",
        county: "",
        postcode: "",
        country: "United Kingdom",
        phoneNumber: "",
        email: "",
        website: "",
        address: "", // Legacy field
        streetAddress: "", // Legacy field
        maxUsers: 1,
        currentUsers: 1,
        pricePerUser: "25.00",
        ...updates
      };
      
      const [created] = await db.insert(companySettings)
        .values(newSettings)
        .returning();
      return created;
    }
  }

  // Depot settings implementation
  async getDepotSettings(userId: string): Promise<DepotSettings[]> {
    return await db.select()
      .from(depotSettings)
      .where(eq(depotSettings.adminUserId, userId));
  }

  async createDepotSettings(settings: InsertDepotSettings): Promise<DepotSettings> {
    const [created] = await db.insert(depotSettings)
      .values(settings)
      .returning();
    return created;
  }

  async updateDepotSettings(id: number, updates: Partial<DepotSettings>): Promise<DepotSettings> {
    const [updated] = await db.update(depotSettings)
      .set(updates)
      .where(eq(depotSettings.id, id))
      .returning();
    return updated;
  }

  // Vehicle travel rates implementation  
  async getVehicleTravelRates(userId: string): Promise<VehicleTravelRate[]> {
    return await db.select()
      .from(vehicleTravelRates)
      .where(eq(vehicleTravelRates.userId, userId));
  }

  async createVehicleTravelRate(rate: InsertVehicleTravelRate): Promise<VehicleTravelRate> {
    const [created] = await db.insert(vehicleTravelRates)
      .values(rate)
      .returning();
    return created;
  }

  async updateVehicleTravelRate(id: number, updates: Partial<VehicleTravelRate>): Promise<VehicleTravelRate> {
    const [updated] = await db.update(vehicleTravelRates)
      .set(updates)
      .where(eq(vehicleTravelRates.id, id))
      .returning();
    return updated;
  }

  async deleteVehicleTravelRate(id: number): Promise<void> {
    await db.delete(vehicleTravelRates)
      .where(eq(vehicleTravelRates.id, id));
  }

  // Team management implementation
  async getTeamMembers(adminUserId: string): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.adminId, adminUserId));
  }

  async createTeamInvitation(invitation: InsertTeamInvitation): Promise<TeamInvitation> {
    const [created] = await db.insert(teamInvitations)
      .values(invitation)
      .returning();
    return created;
  }

  async getTeamInvitation(token: string): Promise<TeamInvitation | undefined> {
    const [invitation] = await db.select()
      .from(teamInvitations)
      .where(eq(teamInvitations.token, token));
    return invitation;
  }

  async acceptTeamInvitation(token: string, userId: string): Promise<void> {
    // Update team invitation acceptance - simplified for now
    console.log(`Accepting invitation for token: ${token}, user: ${userId}`);
  }

  async createTeamBillingRecord(record: InsertTeamBillingRecord): Promise<TeamBillingRecord> {
    const [created] = await db.insert(teamBillingRecords)
      .values(record)
      .returning();
    return created;
  }

  // Payment method management
  async updateUserPaymentMethod(userId: string, paymentMethodId: string): Promise<User> {
    const [updated] = await db.update(users)
      .set({ 
        paymentMethodId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
