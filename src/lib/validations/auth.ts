import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  nameEn: z.string().min(2, { message: "Name must be at least 2 characters" }),
  nameAr: z.string().min(2, { message: "Name must be at least 2 characters" }),
});

export const verifyEmailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  code: z.string().min(6, { message: "Verification code must be 6 characters" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>; 