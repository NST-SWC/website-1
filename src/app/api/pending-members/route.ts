import { NextResponse } from "next/server";
import { getDb, serverTimestamp } from "@/lib/firebase/admin";
import { sendCredentialsEmail } from "@/lib/email";

export const runtime = "nodejs";

// GET - Fetch all pending member requests
export async function GET(request: Request) {
  try {
    console.log("🔄 Fetching pending members...");
    const db = getDb();
    
    // Fetch all pending members without orderBy to avoid index requirement
    const snapshot = await db
      .collection("pendingMembers")
      .where("status", "==", "pending")
      .get();
    
    // Sort in JavaScript instead
    const pendingMembers = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        // Sort by createdAt descending (newest first)
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return bTime - aTime;
      });
    
    console.log(`✅ Found ${pendingMembers.length} pending members`);
    
    return NextResponse.json({
      ok: true,
      data: pendingMembers,
    });
  } catch (error) {
    console.error("❌ Error fetching pending members:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to fetch pending members",
        error: String(error),
      },
      { status: 500 },
    );
  }
}

// PATCH - Approve or reject a pending member
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { memberId, decision, adminId } = body;
    
    if (!memberId || !decision) {
      return NextResponse.json(
        { ok: false, message: "Missing memberId or decision" },
        { status: 400 },
      );
    }
    
    console.log(`📝 Processing member ${decision}:`, memberId);
    
    const db = getDb();
    
    // Get the pending member data
    const pendingMemberDoc = await db
      .collection("pendingMembers")
      .doc(memberId)
      .get();
    
    if (!pendingMemberDoc.exists) {
      return NextResponse.json(
        { ok: false, message: "Pending member not found" },
        { status: 404 },
      );
    }
    
    const memberData = pendingMemberDoc.data();
    
    let userId = null;
    let username = null;
    let password = null;
    
    if (decision === "approved") {
      // Create a unique user ID
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate username and password with unique pattern
      const firstName = (memberData?.name || "member").split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const lastName = (memberData?.name || "").split(" ")[1]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
      
      username = firstName;
      
      // Generate truly random password
      const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit number (1000-9999)
      const specialChars = ['@', '!', '#', '$', '&'];
      const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
      
      // Random pattern selection
      const patternChoices = [
        `${firstName}${randomSpecial}${randomNum}`,
        `${firstName}${randomNum}${randomSpecial}`,
        `${firstName}_${randomNum}`,
        `${firstName}${lastName ? lastName.charAt(0).toUpperCase() : ''}${randomNum}`,
      ];
      
      password = patternChoices[Math.floor(Math.random() * patternChoices.length)];
      
      // Add to members collection
      await db.collection("members").doc(userId).set({
        id: userId,
        name: memberData?.name || "Unknown",
        email: memberData?.email || "",
        phone: memberData?.phone || "",
        github: memberData?.github || null,
        portfolio: memberData?.portfolio || null,
        interests: memberData?.interests || [],
        experience: memberData?.experience || "beginner",
        goals: memberData?.goals || "",
        role: memberData?.role || "student",
        availability: memberData?.availability || "",
        points: 0,
        badges: 0,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberData?.email || userId}`,
        joinedAt: serverTimestamp(),
        approvedBy: adminId || "admin",
        username,
        password,
        credentialsUpdated: new Date().toISOString(),
      });
      
      console.log("✅ Added to members collection with ID:", userId);
      console.log(`🔑 Credentials: ${username} / ${password}`);
      
      // Send welcome email with credentials
      if (memberData?.email) {
        try {
          console.log(`📧 Attempting to send welcome email...`);
          console.log(`   To: ${memberData.email}`);
          console.log(`   Name: ${memberData.name}`);
          console.log(`   Username: ${username}`);
          console.log(`   Password: ${password}`);
          console.log(`   SMTP Config:`, {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            hasPass: !!process.env.SMTP_PASS,
          });
          
          const emailResult = await sendCredentialsEmail({
            to: memberData.email,
            name: memberData.name || "Member",
            username: username,
            password: password,
          });
          
          if (emailResult.success) {
            console.log(`✅ Welcome email sent successfully to ${memberData.email}`);
            console.log(`   Message ID: ${emailResult.messageId}`);
          } else {
            console.error(`❌ Failed to send welcome email: ${emailResult.error}`);
          }
        } catch (emailError) {
          console.error("❌ Error sending welcome email:", emailError);
          console.error("   Full error:", JSON.stringify(emailError, null, 2));
          // Don't fail the approval if email fails
        }
      } else {
        console.warn('⚠️  No email address found for member, skipping email send');
      }
    }
    
    // Record admin decision
    await db.collection("adminDecisions").add({
      type: "member_approval",
      memberId,
      decision,
      adminId: adminId || "admin",
      memberData,
      timestamp: serverTimestamp(),
    });
    
    console.log("✅ Recorded admin decision");
    
    // Delete from pendingMembers
    await db.collection("pendingMembers").doc(memberId).delete();
    
    console.log("✅ Deleted from pendingMembers");
    
    return NextResponse.json({
      ok: true,
      message: decision === "approved" 
        ? `Member approved! Welcome email sent to ${memberData?.email}` 
        : `Member ${decision}!`,
      ...(userId && { userId }),
      ...(username && password && { credentials: { username, password } }),
      ...(memberData?.name && { name: memberData.name }),
      ...(memberData?.email && { email: memberData.email }),
    });
  } catch (error) {
    console.error("❌ Error processing member:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to process member",
        error: String(error),
      },
      { status: 500 },
    );
  }
}
