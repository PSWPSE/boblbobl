import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  bytes: number;
  format: string;
  resource_type: string;
  created_at: string;
}

/**
 * 파일을 Cloudinary에 업로드
 */
export async function uploadFileToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'auto' | 'image' | 'video' | 'raw';
    allowed_formats?: string[];
  } = {}
): Promise<CloudinaryUploadResult> {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'blogcraft/uploads',
          public_id: options.public_id,
          resource_type: options.resource_type || 'auto',
          allowed_formats: options.allowed_formats,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary 업로드 실패: ${error.message}`));
          } else if (result) {
            resolve(result as CloudinaryUploadResult);
          } else {
            reject(new Error('알 수 없는 Cloudinary 업로드 오류'));
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    throw new Error(`파일 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cloudinary에서 파일 삭제
 */
export async function deleteFileFromCloudinary(public_id: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result !== 'ok') {
      throw new Error(`파일 삭제 실패: ${result.result}`);
    }
  } catch (error) {
    throw new Error(`파일 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 파일 정보 조회
 */
export async function getFileInfoFromCloudinary(public_id: string): Promise<any> {
  try {
    const result = await cloudinary.api.resource(public_id);
    return result;
  } catch (error) {
    throw new Error(`파일 정보 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 이미지 변환 URL 생성
 */
export function generateTransformedImageUrl(
  public_id: string,
  transformations: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  } = {}
): string {
  return cloudinary.url(public_id, {
    width: transformations.width,
    height: transformations.height,
    crop: transformations.crop || 'limit',
    quality: transformations.quality || 'auto',
    format: transformations.format || 'auto',
    fetch_format: 'auto',
  });
}

/**
 * Cloudinary 연결 테스트
 */
export async function testCloudinaryConnection(): Promise<boolean> {
  try {
    await cloudinary.api.ping();
    console.log('✅ Cloudinary connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error);
    return false;
  }
}

export default cloudinary; 