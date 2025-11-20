import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/firebase/admin";

// Force Node.js runtime for firebase-admin
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();
    const doc = await db.collection("projects").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { ok: false, message: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: { id: doc.id, ...(doc.data() as Record<string, unknown>) },
    });
  } catch (error) {
    console.error("❌ Failed to fetch project:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to load project",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const updates = await request.json();

    console.log("💾 Updating project:", projectId, updates);

    const db = getDb();
    const projectRef = db.collection("projects").doc(projectId);

    // Check if project exists
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        {
          ok: false,
          message: "Project not found",
        },
        { status: 404 }
      );
    }

    // Prepare update data with proper field filtering
    const allowedFields = [
      "title",
      "description",
      "status",
      "tech",
      "githubUrl",
      "demoUrl",
      "docsUrl",
      "chatUrl",
      "latestUpdate",
    ] as const;
    type AllowedField = (typeof allowedFields)[number];

    const updateData: Partial<Record<AllowedField, unknown>> & {
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    // Only include allowed fields that are present in updates
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // Update the project
    await projectRef.update(updateData);

    console.log("✅ Project updated successfully:", projectId);

    return NextResponse.json({
      ok: true,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating project:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to update project",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
