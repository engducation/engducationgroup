import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  createSupportTicket,
  getUserTickets,
  getTicketDetails,
  addTicketMessage,
  type TicketCategory,
} from "@/features/learning-content/services/support-ticket.service";

const VALID_CATEGORIES: TicketCategory[] = [
  "ACCOUNT",
  "VIDEO",
  "QUIZ",
  "SYSTEM_ERROR",
  "PAYMENT",
  "OTHER",
];

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (ticketId) {
      // Get specific ticket details
      const ticket = await getTicketDetails(ticketId, session.user.id);
      if (!ticket) {
        return Response.json({ error: "Ticket not found" }, { status: 404 });
      }
      return Response.json({ ticket });
    }

    // Get all user's tickets
    const tickets = await getUserTickets(session.user.id);
    return Response.json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return Response.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, category, description } = body;

    // Validation
    if (!title || !category || !description) {
      return Response.json(
        { error: "title, category, and description are required" },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return Response.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    if (title.trim().length < 5) {
      return Response.json(
        { error: "Title must be at least 5 characters" },
        { status: 400 }
      );
    }

    if (description.trim().length < 10) {
      return Response.json(
        { error: "Description must be at least 10 characters" },
        { status: 400 }
      );
    }

    const ticket = await createSupportTicket({
      userId: session.user.id,
      title: title.trim(),
      category,
      description: description.trim(),
    });

    return Response.json({ success: true, ticket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return Response.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
