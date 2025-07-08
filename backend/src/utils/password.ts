import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * 비밀번호 해싱
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Password hashing failed');
  }
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Password verification failed');
  }
}

/**
 * 비밀번호 강도 검증
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 최소 길이 검증
  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다');
  }

  // 영문 대문자 포함 검증
  if (!/[A-Z]/.test(password)) {
    errors.push('비밀번호에 영문 대문자를 포함해야 합니다');
  }

  // 영문 소문자 포함 검증
  if (!/[a-z]/.test(password)) {
    errors.push('비밀번호에 영문 소문자를 포함해야 합니다');
  }

  // 숫자 포함 검증
  if (!/\d/.test(password)) {
    errors.push('비밀번호에 숫자를 포함해야 합니다');
  }

  // 특수문자 포함 검증
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('비밀번호에 특수문자를 포함해야 합니다');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
} 