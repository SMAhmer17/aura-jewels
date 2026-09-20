import { ApiError, uploadFile } from "@/lib/api/client";
import { fileToBlob } from "@/lib/utils/image";

/** Shrinks a photo in the browser, uploads it through the API, and returns the public link to store on the product. */
export async function uploadProductImage(file: File): Promise<string> {
  const blob = await fileToBlob(file);
  const { url } = await uploadFile<{ url: string }>("/admin/uploads", blob, "image.jpg");
  return url;
}

export const MAX_VIDEO_MB = 25;
const VIDEO_TYPES = ["video/mp4", "video/webm"];

/**
 * Uploads a picture or a short video for a home page tile and says which it was.
 * Pictures are shrunk in the browser first; videos are sent as they are (MP4 or WebM, up to 25 MB).
 */
export async function uploadPostMedia(file: File): Promise<{ url: string; type: "image" | "video" }> {
  if (file.type.startsWith("video/")) {
    if (!VIDEO_TYPES.includes(file.type)) throw new ApiError("Use an MP4 or WebM video. iPhone .mov files need to be exported as MP4 first.", 400);
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new ApiError(`That video is too large. Keep it under ${MAX_VIDEO_MB} MB.`, 400);
    const { url } = await uploadFile<{ url: string }>("/admin/uploads/video", file, file.name);
    return { url, type: "video" };
  }
  return { url: await uploadProductImage(file), type: "image" };
}
