import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { addTicketMessage } from "@/features/learning-content/services/support-ticket.service";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ticketId, message } = body;

    if (!ticketId || !message) {
      return Response.json(
        { error: "ticketId and message are required" },
        { status: 400 }
      );
    }

    if (message.trim().length < 1) {
      return Response.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    await addTicketMessage(ticketId, session.user.id, message.trim());

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error adding message:", error);
    return Response.json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
}
