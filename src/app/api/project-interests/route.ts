import { NextResponse } from "next/server";
import { getDb, serverTimestamp } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// GET - Fetch project interests (optionally filtered)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    
    console.log("🔄 Fetching project interests...", { projectId, status });
    const db = getDb();
    
    let query = db.collection("projectInterests");
    
    if (projectId) {
      query = query.where("projectId", "==", projectId) as any;
    }
    if (status) {
      query = query.where("status", "==", status) as any;
    }
    
    const snapshot = await query.get();
    const interests = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Try to fetch project details, fallback to projectId
        let projectName = data.projectId || "Unknown Project";
        try {
          // First try by document ID
          const projectDoc = await db.collection("projects").doc(data.projectId).get();
          if (projectDoc.exists) {
            projectName = projectDoc.data()?.title || projectName;
          } else {
            // Try to find by matching ID field
            const projectQuery = await db.collection("projects")
              .where("id", "==", data.projectId)
              .limit(1)
              .get();
            if (!projectQuery.empty) {
              projectName = projectQuery.docs[0].data()?.title || projectName;
            }
          }
        } catch (err) {
          console.warn("⚠️  Could not fetch project details:", err);
        }
        
        // Try to fetch user details, fallback to userId
        let userName = data.userId || "Unknown User";
        let userEmail = "";
        try {
          // First try by document ID
          const userDoc = await db.collection("members").doc(data.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userName = userData?.name || userName;
            userEmail = userData?.email || "";
          } else {
            // Try to find by matching ID field
            const userQuery = await db.collection("members")
              .where("id", "==", data.userId)
              .limit(1)
              .get();
            if (!userQuery.empty) {
              const userData = userQuery.docs[0].data();
              userName = userData?.name || userName;
              userEmail = userData?.email || "";
            }
          }
        } catch (err) {
          console.warn("⚠️  Could not fetch user details:", err);
        }
        
        return {
          id: doc.id,
          ...data,
          projectName,
          userName,
          userEmail,
        };
      })
    );
    
    console.log(`✅ Fetched ${interests.length} project interests with details`);
    return NextResponse.json({ 
      ok: true, 
      data: interests 
    });
  } catch (error) {
    console.error("❌ Failed to fetch project interests:", error);
    return NextResponse.json({ 
      ok: false, 
      message: "Failed to fetch interests",
      error: String(error)
    }, { status: 500 });
  }
}

// PATCH - Update project interest status (approve/reject)
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      interestId?: string;
      status?: "approved" | "rejected" | "pending";
      projectId?: string;
      userId?: string;
      deleteAfter?: boolean; // Option to delete after status update
      ownerId?: string; // ID of the person approving (project owner)
    };
    
    console.log("📝 Updating project interest:", body);
    
    const { interestId, status, deleteAfter = false } = body;
    
    if (!interestId || !status) {
      return NextResponse.json(
        { ok: false, message: "Missing interestId or status" },
        { status: 400 },
      );
    }
    
    try {
      const db = getDb();
      
      // Get the project interest data before deleting
      const interestDoc = await db.collection("projectInterests").doc(interestId).get();
      
      if (!interestDoc.exists) {
        return NextResponse.json(
          { ok: false, message: "Project interest not found" },
          { status: 404 },
        );
      }
      
      const interestData = interestDoc.data();
      const projectId = body.projectId || interestData?.projectId;
      const userId = body.userId || interestData?.userId;
      
      // If approved, add to projectMembers collection
      if (status === "approved" && projectId && userId) {
        // Get user details from members collection
        let userName = "Unknown User";
        let userEmail = "";
        
        try {
          const userDoc = await db.collection("members").doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userName = userData?.name || userName;
            userEmail = userData?.email || "";
          }
        } catch (err) {
          console.warn("⚠️  Could not fetch user details:", err);
        }
        
        // Add to projectMembers collection
        await db.collection("projectMembers").add({
          projectId,
          userId,
          userName,
          userEmail,
          role: "member",
          joinedAt: serverTimestamp(),
          addedBy: body.ownerId || "project-owner",
        });
        
        console.log(`✅ Added user ${userId} to projectMembers for project ${projectId}`);
        
        // Award points for joining a project
        try {
          const userRef = db.collection("members").doc(userId);
          const userDoc = await userRef.get();
          if (userDoc.exists) {
            const currentPoints = userDoc.data()?.points || 0;
            await userRef.update({
              points: currentPoints + 10, // Award 10 points for joining
              updatedAt: new Date(),
            });
            console.log(`🏆 Awarded 10 points to user ${userId} for joining project`);
          }
        } catch (pointsError) {
          console.warn("⚠️  Failed to award points:", pointsError);
          // Don't fail the whole operation if points update fails
        }
      }
      
      // Record the decision in adminDecisions
      await db.collection("adminDecisions").add({
        type: "project_interest",
        interestId,
        projectId,
        userId,
        decision: status,
        decidedBy: body.ownerId || "owner",
        timestamp: serverTimestamp(),
        interestData,
      });
      
      console.log("✅ Recorded decision in adminDecisions");
      
      // Always delete from projectInterests after processing
      await db.collection("projectInterests").doc(interestId).delete();
      console.log(`🗑️  Deleted project interest ${interestId}`);
      
      return NextResponse.json({ 
        ok: true, 
        message: `Request ${status}!`,
        data: { id: interestId, status, deleted: true }
      });
    } catch (firestoreError) {
      console.error("❌ Firestore update failed:", String(firestoreError));
      return NextResponse.json(
        { 
          ok: false, 
          message: `Failed to ${status} request. Please check your database connection.`,
          error: String(firestoreError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Update project interest error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        message: "Failed to update interest",
        error: String(error)
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete a project interest
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interestId = searchParams.get("id");
    
    if (!interestId) {
      return NextResponse.json(
        { ok: false, message: "Missing interest ID" },
        { status: 400 },
      );
    }
    
    console.log("🗑️  Deleting project interest:", interestId);
    const db = getDb();
    
    await db.collection("projectInterests").doc(interestId).delete();
    
    console.log("✅ Deleted project interest");
    return NextResponse.json({ 
      ok: true, 
      message: "Interest deleted" 
    });
  } catch (error) {
    console.error("❌ Delete error:", error);
    return NextResponse.json({ 
      ok: false, 
      message: "Failed to delete",
      error: String(error)
    }, { status: 500 });
  }
}
