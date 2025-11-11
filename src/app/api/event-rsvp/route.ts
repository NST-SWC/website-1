import { NextResponse } from "next/server";
import { getDb, serverTimestamp } from "@/lib/firebase/admin";

// Force Node.js runtime for firebase-admin
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { eventId, userId } = (await request.json()) as {
      eventId?: string;
      userId?: string;
    };
    if (!eventId || !userId) {
      return NextResponse.json(
        { ok: false, message: "Missing event or user id" },
        { status: 400 },
      );
    }
    
    try {
      const db = getDb();
      await db.collection("eventRsvps").add({
        eventId,
        userId,
        createdAt: serverTimestamp(),
      });
      console.log("✅ Event RSVP saved to Firestore");
      return NextResponse.json({ ok: true, message: "RSVP confirmed." });
    } catch (firestoreError) {
      console.error("❌ Firestore save failed:", String(firestoreError));
      return NextResponse.json(
        { 
          ok: false, 
          message: "Failed to save RSVP. Please check your database connection.",
          error: String(firestoreError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("event rsvp error", error);
    return NextResponse.json(
      { ok: false, message: "Unable to RSVP.", error: String(error) },
      { status: 500 },
    );
  }
}
