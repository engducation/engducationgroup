"use client";

import { useState, useCallback } from "react";

export interface Review {
  id: string;
  courseId: string;
  rating: number;
  comment: string | null;
  createdAt: string | Date;
  course?: {
    id: string;
    title: string;
  };
}

export interface UseReviewsReturn {
  createReview: (data: CreateReviewInput) => Promise<Review | null>;
  getUserReviewForCourse: (courseId: string) => Promise<Review | null>;
  getUserReviews: () => Promise<Review[]>;
  isLoading: boolean;
  error: string | null;
}

export interface CreateReviewInput {
  courseId: string;
  rating: number;
  comment?: string;
}

export function useReviews(): UseReviewsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = useCallback(async (data: CreateReviewInput): Promise<Review | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/student/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create review");
      }

      return result.review;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserReviewForCourse = useCallback(async (courseId: string): Promise<Review | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/student/reviews?courseId=${encodeURIComponent(courseId)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch review");
      }

      return result.review;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserReviews = useCallback(async (): Promise<Review[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/student/reviews");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch reviews");
      }

      return result.reviews ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createReview,
    getUserReviewForCourse,
    getUserReviews,
    isLoading,
    error,
  };
}
