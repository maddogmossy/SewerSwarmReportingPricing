import type { Express } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { adminControls } from "@shared/schema";
import { isAuthenticated } from "./replitAuth";

export function registerAdminControlRoutes(app: Express) {
  // Get admin controls for a user/sector/category
  app.get("/api/admin-controls", async (req: any, res) => {
    try {
      const userId = "test-user"; // Default user for testing
      const { sector, categoryId, controlType } = req.query;

      let query = db.select().from(adminControls).where(eq(adminControls.userId, userId));

      if (sector) {
        query = query.where(eq(adminControls.sector, sector));
      }
      if (categoryId) {
        query = query.where(eq(adminControls.categoryId, categoryId));
      }
      if (controlType) {
        query = query.where(eq(adminControls.controlType, controlType));
      }

      const controls = await query;
      res.json(controls);
    } catch (error) {
      console.error("Error fetching admin controls:", error);
      res.status(500).json({ message: "Failed to fetch admin controls" });
    }
  });

  // Create or update admin control
  app.post("/api/admin-controls", async (req: any, res) => {
    try {
      const userId = "test-user"; // Default user for testing
      const { controlType, sector, categoryId, isLocked, lockReason } = req.body;

      // Check if control already exists
      const existingControl = await db
        .select()
        .from(adminControls)
        .where(
          and(
            eq(adminControls.userId, userId),
            eq(adminControls.controlType, controlType),
            eq(adminControls.sector, sector || ""),
            eq(adminControls.categoryId, categoryId || "")
          )
        )
        .limit(1);

      if (existingControl.length > 0) {
        // Update existing control
        const [updatedControl] = await db
          .update(adminControls)
          .set({
            isLocked,
            lockedBy: isLocked ? userId : null,
            unlockedBy: !isLocked ? userId : null,
            lockReason,
            updatedAt: new Date(),
          })
          .where(eq(adminControls.id, existingControl[0].id))
          .returning();

        res.json(updatedControl);
      } else {
        // Create new control
        const [newControl] = await db
          .insert(adminControls)
          .values({
            userId,
            controlType,
            sector,
            categoryId,
            isLocked,
            lockedBy: isLocked ? userId : null,
            unlockedBy: !isLocked ? userId : null,
            lockReason,
          })
          .returning();

        res.json(newControl);
      }
    } catch (error) {
      console.error("Error creating/updating admin control:", error);
      res.status(500).json({ message: "Failed to create/update admin control" });
    }
  });

  // Toggle lock status
  app.put("/api/admin-controls/:id/toggle", async (req: any, res) => {
    try {
      const userId = "test-user"; // Default user for testing
      const { id } = req.params;
      const { lockReason } = req.body;

      // Get current control
      const [control] = await db
        .select()
        .from(adminControls)
        .where(eq(adminControls.id, parseInt(id)))
        .limit(1);

      if (!control) {
        return res.status(404).json({ message: "Admin control not found" });
      }

      // Toggle lock status
      const newLockStatus = !control.isLocked;
      const [updatedControl] = await db
        .update(adminControls)
        .set({
          isLocked: newLockStatus,
          lockedBy: newLockStatus ? userId : null,
          unlockedBy: !newLockStatus ? userId : null,
          lockReason: lockReason || control.lockReason,
          updatedAt: new Date(),
        })
        .where(eq(adminControls.id, parseInt(id)))
        .returning();

      res.json(updatedControl);
    } catch (error) {
      console.error("Error toggling admin control:", error);
      res.status(500).json({ message: "Failed to toggle admin control" });
    }
  });

  // Check if user is admin
  app.get("/api/admin-controls/check-admin", async (req: any, res) => {
    try {
      const userId = "test-user"; // Default user for testing
      
      // For now, check if user has admin role or is test-user
      const isAdmin = userId === "test-user";
      
      res.json({ isAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });
}