declare module 'passport-naver-v2' {
  import { Strategy } from 'passport-strategy';
  
  export class Strategy extends Strategy {
    constructor(
      options: {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
      },
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => void
    );
  }
}

declare module 'passport-kakao' {
  import { Strategy } from 'passport-strategy';
  
  export class Strategy extends Strategy {
    constructor(
      options: {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
      },
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => void
    );
  }
} 