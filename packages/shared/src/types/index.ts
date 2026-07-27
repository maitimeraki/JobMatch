export type UserRole = "SEEKER" | "RECRUITER" | "ADMIN";
export type PostCategory = "PROJECT_SHOWCASE" | "LEARNING" | "QUESTION" | "ACHIEVEMENT" | "DISCUSSION";
export type MediaType = "IMAGE" | "VIDEO";
export type JobType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "FREELANCE";
export type ExperienceLevel = "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
export type JobStatus = "ACTIVE" | "PAUSED" | "CLOSED" | "DRAFT";
export type ApplicationStatus = "PENDING" | "REVIEWING" | "SHORTLISTED" | "REJECTED" | "HIRED";
export type ApplicationSource = "DIRECT" | "REFERRAL";
export type ReferralStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";
export type NotificationType =
  | "FOLLOW"
  | "LIKE"
  | "COMMENT"
  | "POST_ENDORSED"
  | "REFERRAL_REQUEST"
  | "REFERRAL_ACCEPTED"
  | "APPLICATION_UPDATE"
  | "NEW_APPLICANT"
  | "JOB_RECOMMENDATION";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
  meta?: { total: number; page: number; limit: number; hasMore?: boolean; nextCursor?: string | null };
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  emailVerified: string | null;
  createdAt: string;
  profile?: ProfileResponse | null;
  isVerified?: boolean;
}

export interface ProfileResponse {
  id: string;
  bio: string | null;
  headline: string | null;
  location: string | null;
  website: string | null;
  skills: string[];
  experience: Experience[];
  education: Education[];
  resumeUrl: string | null;
  communityScore: number;
}

export interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
}

export interface Education {
  degree: string;
  school: string;
  year: number;
}

export interface PostResponse {
  id: string;
  authorId: string;
  author: { id: string; name: string; avatar: string | null; isVerified?: boolean };
  content: string;
  category: PostCategory;
  mediaUrl: string | null;
  mediaType: MediaType | null;
  likes: number;
  comments: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface CommentResponse {
  id: string;
  postId: string;
  author: { id: string; name: string; avatar: string | null };
  content: string;
  createdAt: string;
}

export interface SkillResponse {
  id: string;
  name: string;
  endorsementCount?: number;
}

export interface EndorsementResponse {
  id: string;
  skill: SkillResponse;
  endorser: { id: string; name: string; avatar: string | null };
  createdAt: string;
}

export interface JobResponse {
  id: string;
  recruiterId: string;
  recruiter: { id: string; name: string; avatar: string | null; isVerified?: boolean };
  title: string;
  description: string;
  location: string;
  type: JobType;
  level: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  skills: string[];
  status: JobStatus;
  applicationsCount?: number;
  bookmarked?: boolean;
  matchScore?: number;
  // Monetization
  isFeatured?: boolean;
  isUrgent?: boolean;
  featuredExpiresAt?: string | null;
  urgentExpiresAt?: string | null;
  referralBonus?: number | null;
  createdAt: string;
  // Recruiter metrics
  avgResponseDays?: number | null;
  totalHires?: number;
  activeJobs?: number;
  lastActive?: string | null;
}

export interface ApplicationResponse {
  id: string;
  jobId: string;
  job: { id: string; title: string; company: string };
  applicant: { id: string; name: string; email: string; avatar: string | null };
  resumeUrl: string;
  coverLetter: string | null;
  status: ApplicationStatus;
  source: ApplicationSource;
  createdAt: string;
}

export interface ReferralRequestResponse {
  id: string;
  requester: { id: string; name: string; avatar: string | null };
  connector: { id: string; name: string; avatar: string | null };
  job: { id: string; title: string } | null;
  message: string | null;
  status: ReferralStatus;
  createdAt: string;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DashboardStats {
  activeJobs: number;
  totalApplications: number;
  avgTimeToHire: number;
  referralHires: number;
  applicationsOverTime: { date: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
  hiringFunnel: { stage: string; count: number }[];
}

export interface MutualConnection {
  id: string;
  name: string;
  avatar: string | null;
  via: { id: string; name: string };
}
