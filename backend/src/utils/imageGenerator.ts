import OpenAI from 'openai';
import sharp from 'sharp';
import axios from 'axios';
import { uploadFileToCloudinary } from './cloudinary';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ThumbnailGenerationRequest {
  title: string;
  content: string;
  tags: string[];
  style?: 'modern' | 'minimal' | 'colorful' | 'professional' | 'illustration' | 'photorealistic';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';
  language?: 'ko' | 'en';
}

export interface ThumbnailGenerationResponse {
  originalUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  prompt: string;
  style: string;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
    generatedAt: string;
    cloudinaryPublicId: string;
  };
}

/**
 * 콘텐츠 기반 이미지 프롬프트 생성
 */
export function generateImagePrompt(request: ThumbnailGenerationRequest): string {
  const { title, content, tags, style = 'modern', language = 'ko' } = request;
  
  // 콘텐츠에서 핵심 키워드 추출
  const keywordPrompt = createKeywordPrompt(title, content, tags);
  
  // 스타일별 프롬프트 설정
  const stylePrompts = {
    modern: "modern, clean design, geometric shapes, gradients, contemporary",
    minimal: "minimalist, simple, clean lines, white space, elegant",
    colorful: "vibrant colors, energetic, dynamic, bold, eye-catching",
    professional: "professional, business-like, sophisticated, corporate",
    illustration: "digital illustration, artistic, creative, hand-drawn style",
    photorealistic: "photorealistic, high quality, detailed, realistic lighting"
  };

  // 네이버 블로그 썸네일에 최적화된 기본 프롬프트
  let basePrompt = `Create a high-quality blog thumbnail image for Korean blog content. `;
  
  if (language === 'ko') {
    basePrompt += `The image should be suitable for Korean audience and blog platforms. `;
  }
  
  basePrompt += `Theme: ${keywordPrompt}. `;
  basePrompt += `Style: ${stylePrompts[style]}. `;
  basePrompt += `Requirements: no text overlays, clean composition, suitable for blog thumbnail, `;
  basePrompt += `high contrast, visually appealing, professional quality. `;
  basePrompt += `Avoid: cluttered design, inappropriate content, copyrighted elements.`;

  return basePrompt;
}

/**
 * 키워드 기반 프롬프트 생성
 */
function createKeywordPrompt(title: string, content: string, tags: string[]): string {
  // 제목에서 핵심 단어 추출
  const titleWords = title.replace(/[^\w\s가-힣]/g, '').split(' ').filter(word => word.length > 1);
  
  // 태그 활용
  const mainTags = tags.slice(0, 3);
  
  // 콘텐츠에서 빈도수 높은 단어 추출 (간단한 버전)
  const contentWords = content
    .replace(/[^\w\s가-힣]/g, '')
    .split(' ')
    .filter(word => word.length > 2)
    .slice(0, 10);

  const allKeywords = [...titleWords, ...mainTags, ...contentWords.slice(0, 3)];
  const uniqueKeywords = [...new Set(allKeywords)].slice(0, 5);
  
  return uniqueKeywords.join(', ');
}

/**
 * DALL-E 3로 이미지 생성
 */
export async function generateThumbnailImage(request: ThumbnailGenerationRequest): Promise<ThumbnailGenerationResponse> {
  try {
    const prompt = generateImagePrompt(request);
    const { aspectRatio = '16:9' } = request;
    
    // 비율에 따른 크기 설정
    const sizeMap = {
      '16:9': '1792x1024' as const,
      '4:3': '1024x1024' as const,
      '1:1': '1024x1024' as const,
      '9:16': '1024x1792' as const,
    };

    console.log('🎨 Generating image with DALL-E 3...');
    console.log('📝 Prompt:', prompt);

    // DALL-E 3 API 호출
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: sizeMap[aspectRatio],
      quality: 'standard',
      style: 'natural'
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('이미지 생성에 실패했습니다.');
    }

    console.log('✅ Image generated successfully:', imageUrl);

    // 생성된 이미지 다운로드
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const originalBuffer = Buffer.from(imageResponse.data);

    // 이미지 최적화 및 다양한 크기 생성
    const optimizedImages = await optimizeImages(originalBuffer);

    // Cloudinary에 업로드
    const uploadResults = await uploadImagesToCloudinary(optimizedImages, request.title);

    return {
      originalUrl: uploadResults.original.secure_url,
      optimizedUrl: uploadResults.optimized.secure_url,
      thumbnailUrl: uploadResults.thumbnail.secure_url,
      prompt,
      style: request.style || 'modern',
      metadata: {
        width: optimizedImages.original.info.width,
        height: optimizedImages.original.info.height,
        fileSize: optimizedImages.original.data.length,
        format: optimizedImages.original.info.format,
        generatedAt: new Date().toISOString(),
        cloudinaryPublicId: uploadResults.original.public_id
      }
    };

  } catch (error) {
    console.error('🚨 Image generation error:', error);
    throw new Error(`썸네일 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 이미지 최적화 및 리사이징
 */
async function optimizeImages(originalBuffer: Buffer) {
  try {
    const originalImage = sharp(originalBuffer);
    const metadata = await originalImage.metadata();

    // 원본 이미지 (품질 개선)
    const optimizedBuffer = await originalImage
      .jpeg({ quality: 90, progressive: true })
      .toBuffer({ resolveWithObject: true });

    // 썸네일 크기 (400x225 for 16:9)
    const thumbnailBuffer = await originalImage
      .resize(400, 225, { 
        fit: 'cover', 
        position: 'center' 
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer({ resolveWithObject: true });

    // 중간 크기 (800x450 for 16:9)
    const mediumBuffer = await originalImage
      .resize(800, 450, { 
        fit: 'cover', 
        position: 'center' 
      })
      .jpeg({ quality: 90, progressive: true })
      .toBuffer({ resolveWithObject: true });

    return {
      original: optimizedBuffer,
      optimized: mediumBuffer,
      thumbnail: thumbnailBuffer
    };

  } catch (error) {
    throw new Error(`이미지 최적화 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cloudinary에 이미지들 업로드
 */
async function uploadImagesToCloudinary(images: any, title: string) {
  const timestamp = Date.now();
  const safeName = title.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 50);

  try {
    const [originalResult, optimizedResult, thumbnailResult] = await Promise.all([
      uploadFileToCloudinary(images.original.data, {
        folder: 'blogcraft/thumbnails/original',
        public_id: `${safeName}_original_${timestamp}`,
        resource_type: 'image'
      }),
      uploadFileToCloudinary(images.optimized.data, {
        folder: 'blogcraft/thumbnails/optimized',
        public_id: `${safeName}_optimized_${timestamp}`,
        resource_type: 'image'
      }),
      uploadFileToCloudinary(images.thumbnail.data, {
        folder: 'blogcraft/thumbnails/thumb',
        public_id: `${safeName}_thumb_${timestamp}`,
        resource_type: 'image'
      })
    ]);

    return {
      original: originalResult,
      optimized: optimizedResult,
      thumbnail: thumbnailResult
    };

  } catch (error) {
    throw new Error(`이미지 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 텍스트 오버레이가 포함된 썸네일 생성
 */
export async function generateThumbnailWithText(
  request: ThumbnailGenerationRequest,
  overlayText: {
    title: string;
    subtitle?: string;
    backgroundColor?: string;
    textColor?: string;
  }
): Promise<ThumbnailGenerationResponse> {
  try {
    // 기본 이미지 생성
    const baseImage = await generateThumbnailImage(request);
    
    // 원본 이미지 다운로드
    const imageResponse = await axios.get(baseImage.optimizedUrl, {
      responseType: 'arraybuffer'
    });

    const imageBuffer = Buffer.from(imageResponse.data);
    
    // 텍스트 오버레이 추가
    const overlayBuffer = await addTextOverlay(imageBuffer, overlayText);
    
    // 텍스트가 포함된 이미지 업로드
    const timestamp = Date.now();
    const safeName = request.title.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 50);
    
    const finalResult = await uploadFileToCloudinary(overlayBuffer, {
      folder: 'blogcraft/thumbnails/with-text',
      public_id: `${safeName}_text_${timestamp}`,
      resource_type: 'image'
    });

    return {
      ...baseImage,
      optimizedUrl: finalResult.secure_url,
      metadata: {
        ...baseImage.metadata,
        cloudinaryPublicId: finalResult.public_id
      }
    };

  } catch (error) {
    throw new Error(`텍스트 오버레이 썸네일 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 이미지에 텍스트 오버레이 추가
 */
async function addTextOverlay(
  imageBuffer: Buffer,
  overlay: {
    title: string;
    subtitle?: string;
    backgroundColor?: string;
    textColor?: string;
  }
): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer);
    const { width = 800, height = 450 } = await image.metadata();
    
    // SVG를 사용한 텍스트 오버레이 생성
    const textOverlay = `
      <svg width="${width}" height="${height}">
        <defs>
          <style>
            .title { 
              font-family: 'Arial', sans-serif; 
              font-size: ${Math.min(width * 0.08, 48)}px; 
              font-weight: bold; 
              fill: ${overlay.textColor || '#ffffff'};
              text-anchor: middle;
              dominant-baseline: middle;
            }
            .subtitle { 
              font-family: 'Arial', sans-serif; 
              font-size: ${Math.min(width * 0.04, 24)}px; 
              fill: ${overlay.textColor || '#ffffff'};
              text-anchor: middle;
              dominant-baseline: middle;
              opacity: 0.9;
            }
            .background {
              fill: ${overlay.backgroundColor || 'rgba(0,0,0,0.5)'};
            }
          </style>
        </defs>
        
        <!-- 배경 오버레이 -->
        <rect x="0" y="${height * 0.6}" width="${width}" height="${height * 0.4}" class="background"/>
        
        <!-- 제목 텍스트 -->
        <text x="${width / 2}" y="${height * 0.75}" class="title">${overlay.title}</text>
        
        ${overlay.subtitle ? `
        <!-- 부제목 텍스트 -->
        <text x="${width / 2}" y="${height * 0.85}" class="subtitle">${overlay.subtitle}</text>
        ` : ''}
      </svg>
    `;

    const result = await image
      .composite([{
        input: Buffer.from(textOverlay),
        blend: 'over'
      }])
      .jpeg({ quality: 90 })
      .toBuffer();

    return result;

  } catch (error) {
    throw new Error(`텍스트 오버레이 추가 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 미리 정의된 템플릿 기반 썸네일 생성
 */
export async function generateTemplateBasedThumbnail(
  request: ThumbnailGenerationRequest,
  template: 'tech' | 'lifestyle' | 'business' | 'travel' | 'food' | 'health'
): Promise<ThumbnailGenerationResponse> {
  const templatePrompts = {
    tech: "technology, digital, modern interface, coding, innovation, blue and purple colors",
    lifestyle: "lifestyle, modern living, comfortable, warm colors, home decoration, personal growth",
    business: "business, professional, corporate, growth, success, clean design, formal",
    travel: "travel, adventure, beautiful destinations, landscapes, exploration, vibrant colors",
    food: "delicious food, cooking, recipes, ingredients, appetizing, warm lighting",
    health: "health, fitness, wellness, medical, clean, fresh, green and blue colors"
  };

  const enhancedRequest = {
    ...request,
    content: `${request.content} ${templatePrompts[template]}`
  };

  return generateThumbnailImage(enhancedRequest);
} 