import axios from "axios";
import type { ApiResponse } from "@jobmatch/shared";
import type {
  RegisterInput, LoginInput, CreatePostInput, CreateCommentInput,
  CreateJobInput, UpdateJobInput, JobSearchInput, UpdateProfileInput,
  CreateEndorsementInput, CreateReferralInput,
} from "@jobmatch/shared";
import type {
  AuthTokens, UserResponse, PostResponse, CommentResponse,
  JobResponse, ApplicationResponse, NotificationResponse,
  SkillResponse, EndorsementResponse, ReferralRequestResponse,
  DashboardStats, MutualConnection,
} from "@jobmatch/shared";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post("/api/v1/auth/refresh", { refreshToken });
          localStorage.setItem("accessToken", data.data.accessToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err.response?.data || err);
  }
);

export const authApi = {
  register: (d: RegisterInput) => api.post<ApiResponse<AuthTokens>>("/auth/register", d),
  login: (d: LoginInput) => api.post<ApiResponse<AuthTokens>>("/auth/login", d),
  refresh: (refreshToken: string) => api.post<ApiResponse<AuthTokens>>("/auth/refresh", { refreshToken }),
  logout: () => api.post<ApiResponse<void>>("/auth/logout"),
  me: () => api.get<ApiResponse<UserResponse>>("/auth/me"),
};

export const postsApi = {
  getFeed: (cursor?: string, mode = "following", category?: string, authorId?: string) => api.get<ApiResponse<PostResponse[]> & { meta: { hasMore: boolean; nextCursor: string | null } }>(`/posts?cursor=${cursor || ""}&mode=${mode}${category ? `&category=${category}` : ""}${authorId ? `&authorId=${authorId}` : ""}`),
  getPost: (id: string) => api.get<ApiResponse<PostResponse>>(`/posts/${id}`),
  create: (d: CreatePostInput) => api.post<ApiResponse<PostResponse>>("/posts", d),
  delete: (id: string) => api.delete<ApiResponse<void>>(`/posts/${id}`),
  toggleLike: (id: string) => api.post<ApiResponse<{ liked: boolean }>>(`/posts/${id}/like`),
  addComment: (id: string, d: CreateCommentInput) =>
    api.post<ApiResponse<CommentResponse>>(`/posts/${id}/comment`, d),
  getComments: (id: string) => api.get<ApiResponse<CommentResponse[]>>(`/posts/${id}/comments`),
};

export const jobsApi = {
  search: (filters: JobSearchInput) =>
    api.get<ApiResponse<JobResponse[]> & { meta: { total: number; page: number; limit: number } }>("/jobs", { params: filters }),
  getById: (id: string) => api.get<ApiResponse<JobResponse>>(`/jobs/${id}`),
  create: (d: CreateJobInput) => api.post<ApiResponse<JobResponse>>("/jobs", d),
  update: (id: string, d: UpdateJobInput) => api.patch<ApiResponse<JobResponse>>(`/jobs/${id}`, d),
  delete: (id: string) => api.delete<ApiResponse<void>>(`/jobs/${id}`),
  apply: (id: string, d: { resumeUrl: string; coverLetter?: string }) =>
    api.post<ApiResponse<ApplicationResponse>>(`/jobs/${id}/apply`, d),
  getApplications: (id: string) =>
    api.get<ApiResponse<ApplicationResponse[]>>(`/jobs/${id}/applications`),
  getTalentPool: (id: string, limit = 20) =>
    api.get<any>(`/jobs/${id}/talent-pool`, { params: { limit } }),
  getAnalytics: (id: string) =>
    api.get<any>(`/jobs/${id}/analytics`),
  toggleBookmark: (id: string) => api.post<ApiResponse<void>>(`/jobs/${id}/bookmark`),
  getBookmarks: () => api.get<ApiResponse<JobResponse[]>>("/jobs/bookmarks/list"),
};

export const usersApi = {
  getProfile: (id: string) => api.get<ApiResponse<UserResponse>>(`/users/${id}/profile`),
  updateProfile: (d: UpdateProfileInput) => api.put<ApiResponse<UserResponse>>("/users/profile", d),
  follow: (id: string) => api.post<ApiResponse<void>>(`/users/${id}/follow`),
  getFollowers: (id: string) => api.get<ApiResponse<UserResponse[]>>(`/users/${id}/followers`),
  getFollowing: (id: string) => api.get<ApiResponse<UserResponse[]>>(`/users/${id}/following`),
  search: (q: string, role?: string) => api.get<ApiResponse<UserResponse[]>>("/users/search", { params: { q, ...(role ? { role } : {}) } }),
  getMutualConnections: (id: string) => api.get<ApiResponse<MutualConnection[]>>(`/users/${id}/mutual-connections`),
  getProfileStrength: (id: string) => api.get<ApiResponse<any>>(`/users/${id}/profile-strength`),
  getSkillGaps: (id: string, jobId?: string) => api.get<ApiResponse<any>>(`/users/${id}/skill-gaps${jobId ? `?jobId=${jobId}` : ""}`),
};

export const endorsementApi = {
  create: (d: CreateEndorsementInput) => api.post<ApiResponse<EndorsementResponse>>("/endorsements", d),
  getSkills: () => api.get<ApiResponse<SkillResponse[]>>("/endorsements/skills"),
  getUserEndorsements: (userId: string) => api.get<ApiResponse<EndorsementResponse[]>>(`/users/${userId}/endorsements`),
};

export const referralApi = {
  create: (d: CreateReferralInput) => api.post<ApiResponse<ReferralRequestResponse>>("/referrals", d),
  getSent: () => api.get<ApiResponse<ReferralRequestResponse[]>>("/referrals/sent"),
  getReceived: () => api.get<ApiResponse<ReferralRequestResponse[]>>("/referrals/received"),
  accept: (id: string) => api.patch<ApiResponse<void>>(`/referrals/${id}/accept`),
  decline: (id: string) => api.patch<ApiResponse<void>>(`/referrals/${id}/decline`),
};

export const applicationsApi = {
  getMyApplications: () => api.get<ApiResponse<ApplicationResponse[]>>("/applications"),
  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<ApplicationResponse>>(`/applications/${id}/status`, { status }),
  getTimeline: (id: string) => api.get<ApiResponse<{ timeline: { status: string; note: string | null; createdAt: string }[] }>>(`/applications/${id}/timeline`),
};

export const notificationsApi = {
  getAll: () => api.get<ApiResponse<NotificationResponse[]>>("/notifications"),
  markAsRead: (id: string) => api.patch<ApiResponse<void>>(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch<ApiResponse<void>>("/notifications/read-all"),
  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>("/notifications/unread-count"),
};

export const uploadApi = {
  uploadFile: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<ApiResponse<{ url: string; mediaType: string }>>("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const dashboardApi = {
  getStats: () => api.get<ApiResponse<DashboardStats>>("/dashboard/stats"),
  getPipeline: () => api.get<ApiResponse<any>>("/dashboard/pipeline"),
  getTalentPool: (jobId?: string) => api.get<ApiResponse<any[]>>("/dashboard/talent-pool", { params: { jobId } }),
  getMostEngaged: () => api.get<ApiResponse<any[]>>("/dashboard/most-engaged"),
  getMatchAlerts: () => api.get<ApiResponse<any>>("/dashboard/match-alerts"),
};

// ─── Monetization APIs ────────────────────────────────────────

export const subscriptionApi = {
  getPlan: () => api.get<ApiResponse<{ plan: any; limits: any }>>("/subscription/plan"),
  upgrade: () => api.post<ApiResponse<{ plan: string; message: string }>>("/subscription/upgrade"),
  downgrade: () => api.post<ApiResponse<{ plan: string; message: string }>>("/subscription/downgrade"),
};

export const boostApi = {
  purchaseBoost: (jobId: string, type: "FEATURED" | "URGENT") =>
    api.post<ApiResponse<any>>(`/boosts/${jobId}/boost`, { type }),
  getActiveBoosts: (jobId: string) =>
    api.get<ApiResponse<any>>(`/boosts/${jobId}/boosts`),
  setReferralBonus: (jobId: string, bonusCents: number) =>
    api.post<ApiResponse<any>>(`/boosts/${jobId}/referral-bonus`, { bonusCents }),
};

export const insightsApi = {
  purchasePremium: () => api.post<ApiResponse<any>>("/insights/premium"),
  getApplicationInsights: (applicationId: string) =>
    api.get<ApiResponse<any>>(`/insights/applications/${applicationId}/insights`),
};

export const payoutApi = {
  getHistory: () => api.get<ApiResponse<any>>("/referrals/payouts"),
};

export const shortlistApi = {
  toggle: (candidateId: string, jobId?: string) =>
    api.post<ApiResponse<{ saved: boolean }>>("/shortlist/toggle", { candidateId, jobId }),
  list: (params?: { jobId?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<{ items: any[]; total: number; page: number; limit: number }>>("/shortlist", { params }),
  updateNote: (candidateId: string, note: string) =>
    api.patch<ApiResponse<{ note: string }>>(`/shortlist/${candidateId}/note`, { note }),
  getNote: (candidateId: string) =>
    api.get<ApiResponse<{ note: string | null }>>(`/shortlist/${candidateId}/note`),
  exportCsv: () => "/api/v1/shortlist/export" as any,
};
