import { NextResponse } from "next/server";
import { getDb, serverTimestamp } from "@/lib/firebase/admin";

// Force Node.js runtime for firebase-admin
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      tech?: string[];
      status?: string;
      owner?: string;
      ownerId?: string;
    };
    
    console.log("📝 Received create project request:", body);
    
    const { title, description, tech, status, owner, ownerId } = body;
    
    if (!title || !description || !tech || !owner || !ownerId) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 },
      );
    }
    
    try {
      console.log("🔄 Getting Firestore database...");
      const db = getDb();
      
      console.log("💾 Writing to projects collection...");
      const docRef = await db.collection("projects").add({
        title,
        description,
        tech,
        status: status || "recruiting",
        owner,
        ownerId,
        members: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log("✅ Successfully created project with ID:", docRef.id);
      return NextResponse.json({ 
        ok: true, 
        message: "Project created successfully!",
        data: { id: docRef.id }
      });
    } catch (firestoreError) {
      console.error("❌ Firestore save failed:", String(firestoreError));
      return NextResponse.json(
        { 
          ok: false, 
          message: "Failed to create project. Please check your database connection.",
          error: String(firestoreError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Create project error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        message: "Failed to create project",
        error: String(error)
      },
      { status: 500 },
    );
  }
}

// GET route to fetch all projects
export async function GET() {
  try {
    console.log("🔄 Fetching projects from Firestore...");
    const db = getDb();
    
    const projectsSnapshot = await db.collection("projects").get();
    const projects = projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    console.log(`✅ Fetched ${projects.length} projects`);
    return NextResponse.json({ 
      ok: true, 
      data: projects 
    });
  } catch (error) {
    console.warn("⚠️  Failed to fetch projects:", String(error));
    return NextResponse.json({ 
      ok: false, 
      message: "Failed to fetch projects",
      error: String(error)
    }, { status: 500 });
  }
}
