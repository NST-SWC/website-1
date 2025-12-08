import { NextRequest, NextResponse } from "next/server";
import { sendHackathonRegistrationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, type, teamName, memberCount } = body;

        // Validate required fields
        if (!email || !name || !type || !memberCount) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate type
        if (type !== "individual" && type !== "team") {
            return NextResponse.json(
                { success: false, error: "Invalid registration type" },
                { status: 400 }
            );
        }

        // For team registrations, teamName is required
        if (type === "team" && !teamName) {
            return NextResponse.json(
                { success: false, error: "Team name is required for team registrations" },
                { status: 400 }
            );
        }

        console.log(`📧 [API] Sending confirmation email to ${email}...`);

        const result = await sendHackathonRegistrationEmail({
            to: email,
            name,
            type,
            teamName,
            memberCount,
        });

        if (result.success) {
            console.log(`✅ [API] Confirmation email sent successfully to ${email}`);
            return NextResponse.json({
                success: true,
                message: "Confirmation email sent successfully",
                messageId: result.messageId,
            });
        } else {
            console.error(`❌ [API] Failed to send confirmation email to ${email}:`, result.error);
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || "Failed to send confirmation email",
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("❌ [API] Error in send-confirmation endpoint:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 }
        );
    }
}
