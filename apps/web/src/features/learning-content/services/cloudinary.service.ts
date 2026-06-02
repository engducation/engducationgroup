/**
 * Cloudinary Video Service - Quản lý video bài giảng
 *
 * PRD Section 7.7: Lesson Video có tên, thời lượng dự kiến, mô tả ngắn.
 * PRD Section 9.7: Admin có thể thay thế video bất kỳ lúc nào.
 * Tích hợp Cloudinary cho streaming và quản lý media.
 */

import { v2 as cloudinary } from "cloudinary";
import { env } from "@/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ─── Types ─────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  duration: number;
  format: string;
  resourceType: "video" | "image" | "raw";
}

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  quality?: number | "auto";
  format?: "auto" | "mp4" | "webm" | "flv";
  startOffset?: number;
  endOffset?: number;
}

// ─── Upload ────────────────────────────────────────────────────────────────

/**
 * Upload a video file to Cloudinary.
 * Returns the public ID, URL, and duration metadata.
 */
export async function uploadVideo(
  filePathOrUrl: string,
  options?: {
    folder?: string;
    resourceName?: string;
    overwrite?: boolean;
  },
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(filePathOrUrl, {
    resource_type: "video",
    folder: options?.folder ?? "lesson-videos",
    public_id: options?.resourceName,
    overwrite: options?.overwrite ?? false,
    use_filename: true,
    unique_filename: true,
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    duration: Math.round(result.duration ?? 0),
    format: result.format ?? "",
    resourceType: result.resource_type as "video",
  };
}

/**
 * Upload video from a buffer (for streaming uploads via multipart).
 */
export async function uploadVideoBuffer(
  buffer: Buffer,
  resourceName: string,
  folder = "lesson-videos",
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder,
        public_id: resourceName,
        overwrite: true,
      },
      (error: any, result: any) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          duration: Math.round(result.duration ?? 0),
          format: result.format ?? "",
          resourceType: result.resource_type as "video",
        });
      },
    );

    uploadStream.end(buffer);
  });
}

// ─── Transform / Generate Streaming URL ────────────────────────────────────

/**
 * Generate a Cloudinary streaming URL with transformations.
 * Uses Cloudinary's auto-quality and auto-format for adaptive bitrate.
 */
export function getStreamingUrl(
  publicId: string,
  options?: CloudinaryTransformOptions,
): string {
  const transformations: Record<string, unknown>[] = [];

  if (options?.quality || options?.format) {
    transformations.push({
      quality: options.quality ?? "auto",
      format: options.format ?? "auto",
    });
  }

  if (options?.width || options?.height) {
    transformations.push({
      width: options.width,
      height: options.height,
      crop: "limit",
    });
  }

  return cloudinary.url(publicId, {
    resource_type: "video",
    streaming_profile: "auto",
    flags: "streaming_attachment",
    transformation: transformations.length > 0 ? transformations : undefined,
  });
}

/**
 * Generate a thumbnail URL at a specific offset.
 */
export function getVideoThumbnail(publicId: string, offsetSeconds = 0): string {
  return cloudinary.url(publicId, {
    resource_type: "video",
    transformation: [
      { start_offset: offsetSeconds },
      { width: 640, height: 360, crop: "fill" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });
}

// ─── Replace Video ──────────────────────────────────────────────────────────

/**
 * Replace an existing video with a new one, deleting the old asset.
 * Admin can replace at any time per PRD Section 9.7.
 */
export async function replaceVideo(
  oldPublicId: string,
  newFilePathOrUrl: string,
  folder = "lesson-videos",
): Promise<CloudinaryUploadResult> {
  await deleteVideo(oldPublicId);
  return uploadVideo(newFilePathOrUrl, { folder, overwrite: false });
}

// ─── Delete ────────────────────────────────────────────────────────────────

/**
 * Delete a video asset from Cloudinary.
 */
export async function deleteVideo(publicId: string): Promise<boolean> {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "video",
    invalidate: true,
  });
  return result.result === "ok";
}

/**
 * Delete multiple videos in batch.
 */
export async function deleteVideos(publicIds: string[]): Promise<number> {
  let deleted = 0;
  for (const id of publicIds) {
    const ok = await deleteVideo(id);
    if (ok) deleted++;
  }
  return deleted;
}

// ─── Metadata ──────────────────────────────────────────────────────────────

/**
 * Get detailed metadata for a video asset.
 */
export async function getVideoMetadata(publicId: string): Promise<{
  publicId: string;
  url: string;
  duration: number;
  width: number;
  height: number;
  format: string;
  createdAt: string;
} | null> {
  const result = await cloudinary.api.resource(publicId, {
    resource_type: "video",
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    duration: Math.round(result.duration ?? 0),
    width: result.width ?? 0,
    height: result.height ?? 0,
    format: result.format ?? "",
    createdAt: result.created_at,
  };
}

/**
 * Check if a video exists on Cloudinary.
 */
export async function videoExists(publicId: string): Promise<boolean> {
  try {
    await cloudinary.api.resource(publicId, { resource_type: "video" });
    return true;
  } catch {
    return false;
  }
}
