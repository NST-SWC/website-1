import { NextResponse } from "next/server";
import { getDb, serverTimestamp } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// GET - Fetch all members
export async function GET() {
  try {
    console.log("🔄 Fetching members from Firestore...");
    const db = getDb();
    
    const membersSnapshot = await db.collection("members").get();
    const members = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    console.log(`✅ Fetched ${members.length} members`);
    return NextResponse.json({ 
      ok: true, 
      data: members 
    });
  } catch (error) {
    console.warn("⚠️  Failed to fetch members:", String(error));
    return NextResponse.json({ 
      ok: false, 
      message: "Failed to fetch members",
      error: String(error)
    }, { status: 500 });
  }
}

// POST - Create/Update member
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
      avatar?: string;
      points?: number;
      badges?: number;
    };
    
    console.log("📝 Received member request:", body);
    
    const { id, name, email, role } = body;
    
    if (!name || !email) {
      return NextResponse.json(
        { ok: false, message: "Name and email are required" },
        { status: 400 },
      );
    }
    
    try {
      const db = getDb();
      
      const memberData = {
        name,
        email,
        role: role || "student",
        avatar: body.avatar || "",
        points: body.points || 0,
        badges: body.badges || 0,
        updatedAt: serverTimestamp(),
      };
      
      let docRef;
      if (id) {
        // Update existing member
        await db.collection("members").doc(id).update(memberData);
        console.log("✅ Updated member:", id);
        docRef = { id };
      } else {
        // Create new member
        docRef = await db.collection("members").add({
          ...memberData,
          createdAt: serverTimestamp(),
        });
        console.log("✅ Created new member:", docRef.id);
      }
      
      return NextResponse.json({ 
        ok: true, 
        message: id ? "Member updated" : "Member created",
        data: { id: id || docRef.id }
      });
    } catch (firestoreError) {
      console.error("❌ Firestore operation failed:", String(firestoreError));
      return NextResponse.json(
        { 
          ok: false, 
          message: "Failed to save member. Please check your database connection.",
          error: String(firestoreError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Member operation error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        message: "Failed to save member",
        error: String(error)
      },
      { status: 500 },
    );
  }
}
