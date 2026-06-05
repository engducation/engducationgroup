"use client";

import { useMemo } from "react";
import { adminApi } from "../api/admin-api";
import { useApiQuery } from "./use-api-query";

type AdminDashboardOverview = Awaited<ReturnType<typeof adminApi.getDashboardOverview>>;
type AdminCourses = Awaited<ReturnType<typeof adminApi.getCourses>>;
type AdminCourseContentWorkspace = Awaited<ReturnType<typeof adminApi.getCourseContentWorkspace>>;
type AdminTransactions = Awaited<ReturnType<typeof adminApi.getOrders>>;
type AdminOrderAnalytics = Awaited<ReturnType<typeof adminApi.getOrderAnalytics>>;
type AdminReviews = Awaited<ReturnType<typeof adminApi.getReviews>>;

export function useAdminDashboardOverview() {
  return useApiQuery<AdminDashboardOverview>(() => adminApi.getDashboardOverview(), []);
}

export function useAdminCourses() {
  return useApiQuery<AdminCourses>(() => adminApi.getCourses(), []);
}

export function useAdminCourseContentWorkspace(courseId: string) {
  const deps = useMemo(() => [courseId] as const, [courseId]);
  return useApiQuery<AdminCourseContentWorkspace>(() => adminApi.getCourseContentWorkspace(courseId), deps);
}

export function useAdminTransactions() {
  return useApiQuery<AdminTransactions>(() => adminApi.getOrders(), []);
}

export function useAdminOrderAnalytics() {
  return useApiQuery<AdminOrderAnalytics>(() => adminApi.getOrderAnalytics(), []);
}

export function useAdminReviews() {
  return useApiQuery<AdminReviews>(() => adminApi.getReviews(), []);
}
