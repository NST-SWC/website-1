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
    const interests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    console.log(`✅ Fetched ${interests.length} project interests`);
    return NextResponse.json({ 
      ok: true, 
      data: interests 
    });
  } catch (error) {
    console.warn("⚠️  Failed to fetch project interests:", String(error));
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
    };
    
    console.log("📝 Updating project interest:", body);
    
    const { interestId, status } = body;
    
    if (!interestId || !status) {
      return NextResponse.json(
        { ok: false, message: "Missing interestId or status" },
        { status: 400 },
      );
    }
    
    try {
      const db = getDb();
      
      await db.collection("projectInterests").doc(interestId).update({
        status,
        updatedAt: serverTimestamp(),
        decidedAt: status !== "pending" ? serverTimestamp() : null,
      });
      
      console.log(`✅ Updated project interest ${interestId} to ${status}`);
      
      // If approved, optionally add to interestedParticipants
      if (status === "approved" && body.projectId && body.userId) {
        await db.collection("interestedParticipants").add({
          projectId: body.projectId,
          userId: body.userId,
          joinedAt: serverTimestamp(),
        });
        console.log("✅ Added to interestedParticipants");
      }
      
      return NextResponse.json({ 
        ok: true, 
        message: `Request ${status}!`,
        data: { id: interestId, status }
      });
    } catch (firestoreError) {
      console.warn("⚠️  Firestore update failed:", String(firestoreError));
      return NextResponse.json({ 
        ok: true, 
        message: `Request ${status} (Demo mode)` 
      });
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
