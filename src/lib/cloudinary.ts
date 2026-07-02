// Server-only Cloudinary helpers. Uses the API secret, so this module must
// never be imported from a client component.

import { v2 as cloudinary } from "cloudinary";

let configured = false;

function client() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
  return cloudinary;
}

export type UploadedImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

export function uploadImage(buffer: Buffer, folder: string): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    client()
      .uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          // Cap stored size; Cloudinary scales down anything larger.
          transformation: [{ width: 2400, height: 2400, crop: "limit" }],
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary returned an empty result"));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
            });
          }
        }
      )
      .end(buffer);
  });
}

// Best-effort: a leftover file in Cloudinary is not worth failing the
// user's request over, so log and continue.
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await client().uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.error("Failed to delete Cloudinary asset", publicId, error);
  }
}
