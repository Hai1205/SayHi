import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_NAME } from "../services/constants.js";
import { CustomError, CustomHandler } from "../services/custom.js";

dotenv.config();

cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const uploadFiles = CustomHandler(async (
  files: Express.Multer.File | Express.Multer.File[],
  folder?: string
) => {
  const fileArray = Array.isArray(files) ? files : [files];

  if (fileArray.length === 0) {
    throw new CustomError(400, "No files to upload");
  }

  const uploadPromises = fileArray.map((file) => {
    const { path: filePath, mimetype } = file;

    if (!mimetype.startsWith("image/") && !mimetype.startsWith("video/")) {
      throw new CustomError(
        400,
        `File ${file.originalname} is invalid (only image or video file)`
      );
    }

    return cloudinary.uploader.upload(filePath, {
      folder: folder || "default",
      resource_type: mimetype.startsWith("video/") ? "video" : "image",
    });
  });

  const results = await Promise.all(uploadPromises);

  const mapped = results.map((result) => ({
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
  }));

  return mapped.length === 1 ? mapped[0] : mapped;
});

export const deleteFiles = CustomHandler(async (publicIds: string | string[]) => {
  const ids = Array.isArray(publicIds) ? publicIds : [publicIds];

  if (ids.length === 0) {
    throw new CustomError(400, "List public id is empty");
  }

  const deletePromises = ids.map((publicId) =>
    cloudinary.uploader.destroy(publicId).then((result) => ({
      publicId,
      result,
    }))
  );

  const results = await Promise.all(deletePromises);

  return results;
});