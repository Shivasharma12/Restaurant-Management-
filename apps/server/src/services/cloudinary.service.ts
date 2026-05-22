import { v2 as cloudinaryV2, UploadApiResponse } from 'cloudinary';
import multer from 'multer';
import { AppError } from '../utils/AppError';

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Multer setup for memory storage (files stored in buffer)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG, PNG, and WebP images are allowed.', 400, 'INVALID_FILE_TYPE'));
    }
  },
});

export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryV2.uploader.upload_stream(
      {
        folder: `qr-restaurant/${folder}`,
        public_id: publicId,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:best', fetch_format: 'auto' },
          { width: 1200, crop: 'limit' },
        ],
        overwrite: true,
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new AppError('Image upload failed: ' + error.message, 500, 'UPLOAD_FAILED'));
          return;
        }
        if (!result) {
          reject(new AppError('Upload returned no result', 500, 'UPLOAD_FAILED'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  await cloudinaryV2.uploader.destroy(publicId);
}

export async function uploadMenuItemImage(
  buffer: Buffer,
  restaurantSlug: string,
  itemName: string
): Promise<string> {
  const sanitizedName = itemName.toLowerCase().replace(/\s+/g, '-');
  const { url } = await uploadImageToCloudinary(
    buffer,
    `menus/${restaurantSlug}`,
    `${sanitizedName}-${Date.now()}`
  );
  return url;
}

export async function uploadRestaurantLogo(
  buffer: Buffer,
  slug: string
): Promise<string> {
  const { url } = await uploadImageToCloudinary(buffer, 'logos', `${slug}-logo`);
  return url;
}

export async function uploadRestaurantBanner(
  buffer: Buffer,
  slug: string
): Promise<string> {
  const { url } = await uploadImageToCloudinary(buffer, 'banners', `${slug}-banner`);
  return url;
}
