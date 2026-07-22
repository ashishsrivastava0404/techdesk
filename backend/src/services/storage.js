import crypto from 'crypto';

/**
 * Storage Service
 * Handles file uploads to S3, Cloudinary, or local storage
 */

class StorageService {
  constructor() {
    this.s3Configured = () => !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    this.cloudinaryConfigured = () => !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME);
  }

  /**
   * Generate a unique filename
   */
  generateFilename(originalName) {
    const ext = originalName.split('.').pop();
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${hash}.${ext}`;
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadToCloudinary(buffer, filename, mimeType) {
    if (!this.cloudinaryConfigured()) {
      throw new Error('Cloudinary is not configured');
    }

    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: mimeType }), filename);
    formData.append('upload_preset', 'promote_uploads');
    formData.append('folder', 'tickets');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Cloudinary upload failed');
    }

    const result = await response.json();
    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: 'cloudinary'
    };
  }

  /**
   * Upload file to AWS S3
   */
  async uploadToS3(buffer, filename, mimeType) {
    if (!this.s3Configured()) {
      throw new Error('AWS S3 is not configured');
    }

    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const key = `tickets/${this.generateFilename(filename)}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'private'
    });

    await s3.send(command);

    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return {
      url,
      publicId: key,
      type: 's3'
    };
  }

  /**
   * Upload file locally (development fallback)
   */
  async uploadLocally(buffer, filename) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const newFilename = this.generateFilename(filename);
    const filepath = path.join(uploadDir, newFilename);
    
    await fs.writeFile(filepath, buffer);
    
    return {
      url: `/uploads/${newFilename}`,
      publicId: newFilename,
      type: 'local'
    };
  }

  /**
   * Upload file (auto-selects provider based on configuration)
   */
  async upload(buffer, filename, mimeType) {
    if (this.cloudinaryConfigured()) {
      return this.uploadToCloudinary(buffer, filename, mimeType);
    }
    
    if (this.s3Configured()) {
      return this.uploadToS3(buffer, filename, mimeType);
    }
    
    // Fallback to local storage
    return this.uploadLocally(buffer, filename);
  }

  /**
   * Delete file
   */
  async deleteFile(publicId, type = 'local') {
    if (type === 'cloudinary' && this.cloudinaryConfigured()) {
      const { v2 } = await import('cloudinary');
      await v2.uploader.destroy(publicId);
      return true;
    }

    if (type === 's3' && this.s3Configured()) {
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: publicId
      }));
      return true;
    }

    if (type === 'local') {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filepath = path.join(process.cwd(), 'uploads', publicId);
      await fs.unlink(filepath);
      return true;
    }

    return false;
  }

  /**
   * Get signed URL for private files
   */
  async getSignedUrl(publicId, expiresIn = 3600) {
    if (this.cloudinaryConfigured()) {
      const { v2 } = await import('cloudinary');
      return v2.url(publicId, { secure: true, sign_url: true });
    }

    if (this.s3Configured()) {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      
      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });

      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: publicId
      });

      return getSignedUrl(s3, command, { expiresIn });
    }

    // Local files don't need signed URLs
    return `/uploads/${publicId}`;
  }

  /**
   * Validate file type
   */
  validateFileType(mimeType) {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return allowedTypes.includes(mimeType);
  }

  /**
   * Validate file size (max 10MB)
   */
  validateFileSize(size) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return size <= maxSize;
  }
}

export const storageService = new StorageService();
export default storageService;
