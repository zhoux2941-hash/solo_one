import { Request } from 'express';
import { User, UserRole } from '../entities/User';

export interface AuthRequest extends Request {
  user?: User;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  affiliation?: string;
  researchKeywords?: string[];
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface SubmitPaperDto {
  title: string;
  abstract: string;
  keywords: string;
}

export interface ReviewDto {
  rating: number;
  comment: string;
  recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject';
}

export interface AssignReviewerDto {
  paperId: number;
  reviewerIds: number[];
}
