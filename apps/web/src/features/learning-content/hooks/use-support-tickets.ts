"use client";

import { useState, useCallback, useEffect } from "react";

export type TicketCategory = "ACCOUNT" | "VIDEO" | "QUIZ" | "SYSTEM_ERROR" | "PAYMENT" | "OTHER";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface SupportTicket {
  id: string;
  title: string;
  category: TicketCategory;
  description: string;
  status: TicketStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TicketMessage {
  id: string;
  message: string;
  senderName: string;
  senderRole: string;
  createdAt: string | Date;
}

export interface TicketWithMessages extends SupportTicket {
  messages: TicketMessage[];
}

export interface CreateTicketInput {
  title: string;
  category: TicketCategory;
  description: string;
}

export interface UseSupportTicketsReturn {
  tickets: SupportTicket[];
  currentTicket: TicketWithMessages | null;
  createTicket: (data: CreateTicketInput) => Promise<SupportTicket | null>;
  getTicketDetails: (ticketId: string) => Promise<TicketWithMessages | null>;
  addMessage: (ticketId: string, message: string) => Promise<boolean>;
  refreshTickets: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useSupportTickets(): UseSupportTicketsReturn {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<TicketWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const response = await fetch("/api/student/support");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch tickets");
      }

      setTickets(result.tickets ?? []);
      return result.tickets ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return [];
    }
  }, []);

  const createTicket = useCallback(async (data: CreateTicketInput): Promise<SupportTicket | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/student/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create ticket");
      }

      // Refresh tickets list
      await fetchTickets();

      return result.ticket;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTickets]);

  const getTicketDetails = useCallback(async (ticketId: string): Promise<TicketWithMessages | null> => {
    if (!ticketId) {
      await fetchTickets();
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/student/support?ticketId=${encodeURIComponent(ticketId)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch ticket");
      }

      setCurrentTicket(result.ticket);
      return result.ticket;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTickets]);

  const addMessage = useCallback(async (ticketId: string, message: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/student/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, message }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add message");
      }

      // Refresh ticket details
      if (currentTicket?.id === ticketId) {
        await getTicketDetails(ticketId);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentTicket?.id, getTicketDetails]);

  // Fetch tickets on mount
  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    currentTicket,
    createTicket,
    getTicketDetails,
    addMessage,
    refreshTickets: fetchTickets,
    isLoading,
    error,
  };
}
