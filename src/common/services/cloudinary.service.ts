import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'profile_pictures',
    preset?: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: folder,
        resource_type: 'auto',
      };

      // If preset is provided, use it instead of manual transformations
      if (preset) {
        uploadOptions.upload_preset = preset;
      } else {
        // Default transformations for backward compatibility
        uploadOptions.transformation = [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ];
      }

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            // If the error mentions an upload preset, retry without preset
            const msg = error && error.message ? error.message.toString() : '';
            if (preset && msg.toLowerCase().includes('preset')) {
              try {
                const fallbackOptions: any = {
                  folder: folder,
                  resource_type: 'auto',
                  transformation: uploadOptions.transformation,
                };
                cloudinary.uploader
                  .upload_stream(fallbackOptions as any, (err2, res2) => {
                    if (err2) return reject(err2);
                    if (res2) return resolve(res2.secure_url);
                    return reject(
                      new Error(
                        'Upload failed on fallback: No result returned',
                      ),
                    );
                  })
                  .end(file.buffer);
              } catch (e) {
                reject(error);
              }
            } else {
              reject(error);
            }
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        })
        .end(file.buffer);
    });
  }

  async uploadImageFromBase64(
    base64Image: string,
    folder: string = 'profile_pictures',
    preset?: string,
  ): Promise<string> {
    try {
      const uploadOptions: any = {
        folder: folder,
        resource_type: 'auto',
      };

      // If preset is provided, use it instead of manual transformations
      if (preset) {
        uploadOptions.upload_preset = preset;
      } else {
        // Default transformations for backward compatibility
        uploadOptions.transformation = [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ];
      }

      try {
        const result = await cloudinary.uploader.upload(
          base64Image,
          uploadOptions,
        );
        return result.secure_url;
      } catch (error) {
        const msg = error && error.message ? error.message.toString() : '';
        if (preset && msg.toLowerCase().includes('preset')) {
          // Retry without preset
          const fallbackOptions: any = {
            folder: folder,
            resource_type: 'auto',
            transformation: uploadOptions.transformation,
          };
          const result = await cloudinary.uploader.upload(
            base64Image,
            fallbackOptions,
          );
          return result.secure_url;
        }
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  extractPublicId(url: string): string {
    const parts = url.split('/upload/');
    if (parts.length < 2) return '';
    const pathParts = parts[1].split('/');
    pathParts.shift(); // Remove version
    const publicIdWithExtension = pathParts.join('/');
    return publicIdWithExtension.replace(/\.[^/.]+$/, ''); // Remove extension
  }
}
