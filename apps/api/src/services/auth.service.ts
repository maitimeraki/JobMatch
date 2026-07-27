import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error.middleware.js";
import type { RegisterInput, UserResponse, AuthTokens } from "@jobmatch/shared";

function generateAccessToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions);
}

function generateRefreshToken(payload: { id: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY } as jwt.SignOptions);
}

function generateTokens(payload: { id: string; role: string }): AuthTokens {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: payload.id }),
  };
}

function formatUser(user: Record<string, unknown>): UserResponse {
  const createdAt =
    user.createdAt instanceof Date
      ? user.createdAt.toISOString()
      : String(user.createdAt);
  const emailVerified =
    user.emailVerified instanceof Date
      ? user.emailVerified.toISOString()
      : user.emailVerified
        ? String(user.emailVerified)
        : null;

  const profile = user.profile as Record<string, unknown> | null | undefined;
  return {
    id: user.id as string,
    email: user.email as string,
    name: user.name as string,
    avatar: (user.avatar as string) ?? null,
    role: user.role as UserResponse["role"],
    emailVerified,
    createdAt,
    profile: profile
      ? {
          id: profile.id as string,
          bio: (profile.bio as string) ?? null,
          headline: (profile.headline as string) ?? null,
          location: (profile.location as string) ?? null,
          website: (profile.website as string) ?? null,
          skills: (profile.skills as string[]) ?? [],
          experience: (profile.experience as import("@jobmatch/shared").Experience[]) ?? [],
          education: (profile.education as import("@jobmatch/shared").Education[]) ?? [],
          resumeUrl: (profile.resumeUrl as string) ?? null,
          communityScore: (profile.communityScore as number) ?? 0,
        }
      : null,
  };
}

export const authService = {
  async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new AppError(409, "EMAIL_EXISTS", "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        profile: { create: {} },
      },
      include: { profile: true },
    });

    const tokens = generateTokens({ id: user.id, role: user.role });

    return { user: formatUser(user), tokens };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password"
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password"
      );
    }

    const tokens = generateTokens({ id: user.id, role: user.role });

    return { user: formatUser(user), tokens };
  },

  async refreshToken(token: string) {
    try {
      const payload = jwt.verify(
        token,
        env.JWT_REFRESH_SECRET
      ) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
      });
      if (!user) {
        throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token");
      }

      const accessToken = generateAccessToken({
        id: user.id,
        role: user.role,
      });

      return { accessToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        401,
        "INVALID_TOKEN",
        "Invalid or expired refresh token"
      );
    }
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User not found");
    }
    return { user: formatUser(user) };
  },
};
