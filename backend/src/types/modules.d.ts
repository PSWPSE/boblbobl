declare module 'pdf-parse' {
  const pdfParse: any;
  export default pdfParse;
}

declare module 'korean-js' {
  const koreanJs: any;
  export default koreanJs;
}

declare module 'express-session' {
  const expressSession: any;
  export = expressSession;
}

declare module 'compromise' {
  const compromise: any;
  export default compromise;
}

declare module 'natural' {
  const natural: any;
  export default natural;
}

declare module 'cheerio' {
  export interface CheerioAPI {
    [key: string]: any;
  }
  export const cheerio: any;
  export = cheerio;
}

declare module 'mammoth' {
  const mammoth: any;
  export default mammoth;
}

declare module 'sharp' {
  const sharp: any;
  export default sharp;
}

declare module 'cloudinary' {
  const cloudinary: any;
  export default cloudinary;
}

declare module 'node-html-parser' {
  export const parse: any;
  export const HTMLElement: any;
}

declare module 'passport' {
  const passport: any;
  export = passport;
}

declare module 'passport-google-oauth20' {
  export class Strategy {
    [key: string]: any;
  }
}

declare module 'passport-naver-v2' {
  const strategy: any;
  export = strategy;
}

declare module 'passport-kakao' {
  const strategy: any;
  export = strategy;
}

declare module 'openai' {
  const openai: any;
  export default openai;
}

declare module 'axios' {
  const axios: any;
  export default axios;
}

declare module 'bcryptjs' {
  const bcrypt: any;
  export = bcrypt;
}

declare module 'jsonwebtoken' {
  const jwt: any;
  export = jwt;
}

declare module 'multer' {
  export interface FileFilterCallback {
    (error: any, acceptFile?: boolean): void;
  }
  const multer: any;
  export = multer;
}

declare namespace multer {
  export interface FileFilterCallback {
    (error: any, acceptFile?: boolean): void;
  }
}

declare module 'express-validator' {
  export const validationResult: any;
  export const body: any;
  export const param: any;
  export const query: any;
  export const check: any;
  export const header: any;
  export const cookie: any;
  export const oneOf: any;
  export const matchedData: any;
}

declare module 'cors' {
  const cors: any;
  export = cors;
}

declare module 'dotenv' {
  const dotenv: any;
  export = dotenv;
}

declare module '@prisma/client' {
  export class PrismaClient {
    [key: string]: any;
  }
  export const prisma: any;
} 