import { uploadFile } from "@/lib/api/client";
import { fileToBlob } from "@/lib/utils/image";

/** Shrinks a photo in the browser, uploads it through the API, and returns the public link to store on the product. */
export async function uploadProductImage(file: File): Promise<string> {
  const blob = await fileToBlob(file);
  const { url } = await uploadFile<{ url: string }>("/admin/uploads", blob, "image.jpg");
  return url;
}
