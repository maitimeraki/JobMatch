import { Request, Response, NextFunction } from "express";
import { jobService } from "../services/job.service.js";
import { talentMatchingService } from "../services/talent-matching.service.js";
import { jobAnalyticsService } from "../services/job-analytics.service.js";
import type { JobSearchInput } from "@jobmatch/shared";

export const jobController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobService.createJob(req.user!.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: JobSearchInput = {
        search: req.query.search as string | undefined,
        location: req.query.location as string | undefined,
        type: req.query.type as any,
        level: req.query.level as any,
        salaryMin: req.query.salaryMin
          ? Number(req.query.salaryMin)
          : undefined,
        salaryMax: req.query.salaryMax
          ? Number(req.query.salaryMax)
          : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };
      const result = await jobService.searchJobs(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobService.getJob(req.params.id, req.user?.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobService.updateJob(
        req.params.id,
        req.user!.id,
        req.body
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await jobService.deleteJob(req.params.id, req.user!.id);
      res.json({ success: true, data: { message: "Job deleted" } });
    } catch (error) {
      next(error);
    }
  },

  async toggleBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobService.toggleBookmark(
        req.user!.id,
        req.params.id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getBookmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const result = await jobService.getBookmarks(req.user!.id, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const { resumeUrl, coverLetter } = req.body;
      if (!resumeUrl) {
        res.status(400).json({
          success: false,
          error: { code: "MISSING_RESUME", message: "Resume URL required" },
        });
        return;
      }
      const result = await jobService.applyForJob(
        req.params.id,
        req.user!.id,
        resumeUrl,
        coverLetter
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const level = req.query.level as string | undefined;
      const result = await jobService.getApplications(
        req.params.id,
        req.user!.id,
        level
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getUserApplications(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await jobService.getUserApplications(req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!status) {
        res.status(400).json({
          success: false,
          error: { code: "MISSING_STATUS", message: "Status required" },
        });
        return;
      }
      const result = await jobService.updateApplicationStatus(
        req.params.id,
        req.user!.id,
        status
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobService.getApplicationTimeline(
        req.params.id,
        req.user!.id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getTalentPool(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const result = await talentMatchingService.matchCandidatesToJob(
        req.params.id,
        req.user!.id,
        limit
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobAnalyticsService.getJobAnalytics(
        req.params.id,
        req.user!.id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
