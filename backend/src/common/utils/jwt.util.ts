import jwt, { Secret, SignOptions } from "jsonwebtoken";

import { env } from "../../config/env";

interface GenerateTokenPayload {
  id: string;
  role: string;
}

export const generateToken = (payload: GenerateTokenPayload) => {
  const secret: Secret = env.JWT_SECRET;

  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
};
