// src/common/utils/string.util.ts
import crypto from "crypto";

const CHARS = "abcdefghijklmnopqrstuvwxyz";

const randomChar = (): string => {
  // Lấy 1 byte ngẫu nhiên, modulo 26 để map vào alphabet
  // 256 % 26 = 22 → slight bias nhưng chấp nhận được cho session code
  return CHARS[crypto.randomBytes(1)[0] % CHARS.length];
};

export const generateSessionCode = (): string => {
  // Format: xxx-xxxx-xxx  (3-4-3 = 10 ký tự + 2 dấu gạch = 12 tổng)
  const a = Array.from({ length: 3 }, randomChar).join("");
  const b = Array.from({ length: 4 }, randomChar).join("");
  const c = Array.from({ length: 3 }, randomChar).join("");
  return `${a}-${b}-${c}`;
};
