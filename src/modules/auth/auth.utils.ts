import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ENV } from "../../config/env";

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export const comparePassword = (password: string, hash: string) =>
  bcrypt.compare(password!, hash!);

export const generateAccessToken = (payload: any) =>
  jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "15m" });

export const generateRefreshToken = (payload: any) =>
  jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string) => jwt.verify(token, ENV.JWT_SECRET);
