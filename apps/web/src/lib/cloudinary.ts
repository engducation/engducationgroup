/**
 * Cloudinary Client Configuration (Frontend / Client-side)
 *
 * Follows cloudinary-react SKILL.md patterns:
 * - Uses NEXT_PUBLIC_ prefix for client-side access
 * - Creates reusable cld instance from @cloudinary/url-gen
 * - Exports uploadPreset for unsigned uploads
 */

import { Cloudinary } from "@cloudinary/url-gen";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

if (!cloudName) {
  throw new Error(
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set. Add it to .env.local with the NEXT_PUBLIC_ prefix."
  );
}

export const cld = new Cloudinary({
  cloud: {
    cloudName,
  },
});

export { uploadPreset };
