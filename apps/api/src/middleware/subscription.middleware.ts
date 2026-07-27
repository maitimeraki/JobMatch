// Subscription middleware — plan limit gating for recruiter endpoints.
// Every protected action checks: "does this recruiter's plan allow this?"

import { Request, Response, NextFunction } from "express";
import { subscriptionService } from "../services/subscription.service.js";

type LimitCheck =
  | "MAX_ACTIVE_JOBS"
  | "MAX_APPLICANTS_PER_JOB"
  | "MAX_CANDIDATE_VIEWS"
  | "CAN_FEATURE_JOB"
  | "CAN_URGENT_BOOST"
  | "CAN_EXPORT_CSV"
  | "PRIORITY_SEARCH";

export function checkPlanLimit(limit: LimitCheck) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const limits = await subscriptionService.getLimits(req.user!.id);
      const limitMap: Record<LimitCheck, boolean | number> = {
        MAX_ACTIVE_JOBS: limits.maxActiveJobs,
        MAX_APPLICANTS_PER_JOB: limits.maxApplicantsPerJob,
        MAX_CANDIDATE_VIEWS: limits.maxCandidateViews,
        CAN_FEATURE_JOB: limits.canFeatureJob,
        CAN_URGENT_BOOST: limits.canUrgentBoost,
        CAN_EXPORT_CSV: limits.canExportCsv,
        PRIORITY_SEARCH: limits.prioritySearch,
      };

      const value = limitMap[limit];

      if (typeof value === "boolean" && !value) {
        res.status(403).json({
          success: false,
          error: {
            code: "PLAN_LIMIT_REACHED",
            message:
              "Your plan does not include this feature. Upgrade to Pro.",
            upgradeUrl: "/pricing",
          },
        });
        return;
      }

      if (typeof value === "number") {
        const plan =
          await subscriptionService.getOrCreatePlan(req.user!.id);
        let usage = 0;
        if (limit === "MAX_ACTIVE_JOBS") usage = plan.activeJobsUsed;
        if (limit === "MAX_CANDIDATE_VIEWS")
          usage = plan.candidateViewsUsed;

        if (usage >= value) {
          res.status(403).json({
            success: false,
            error: {
              code: "PLAN_LIMIT_REACHED",
              message: `Limit reached (${usage}/${value}). Upgrade to Pro for more.`,
              usage,
              limit: value,
              upgradeUrl: "/pricing",
            },
          });
          return;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
