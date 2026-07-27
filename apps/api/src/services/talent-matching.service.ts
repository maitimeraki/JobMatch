import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "is", "are", "was", "were", "be", "been", "being", "have",
  "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "shall", "can", "need", "must", "about", "into", "over",
  "after", "before", "between", "under", "above", "below", "out", "off",
  "up", "down", "this", "that", "these", "those", "it", "its", "i", "me",
  "my", "we", "our", "you", "your", "he", "him", "his", "she", "her",
  "they", "them", "their", "what", "which", "who", "whom",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function estimateLevel(totalYears: number): string {
  if (totalYears <= 2) return "JUNIOR";
  if (totalYears <= 5) return "MID";
  if (totalYears <= 10) return "SENIOR";
  return "LEAD";
}

function calcTotalYears(experience: any): number {
  if (!experience) return 0;
  const entries = typeof experience === "string" ? JSON.parse(experience) : experience;
  let total = 0;
  for (const entry of entries) {
    if (entry.startDate && entry.endDate) {
      const start = new Date(entry.startDate);
      const end = new Date(entry.endDate);
      total += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    }
  }
  return total;
}

const LEVEL_ORDER: Record<string, number> = { JUNIOR: 0, MID: 1, SENIOR: 2, LEAD: 3, EXECUTIVE: 4 };

export const talentMatchingService = {
  async matchCandidatesToJob(jobId: string, recruiterId: string, limit = 20) {
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      select: { recruiterId: true, title: true, description: true, skills: true, level: true },
    });
    if (!job) throw new AppError(404, "NOT_FOUND", "Job not found");
    if (job.recruiterId !== recruiterId) throw new AppError(403, "FORBIDDEN", "Not your job listing");

    // Step 1 — Build weighted description terms
    const descTerms = tokenize(job.description);
    const skillSet = new Set(job.skills.map((s) => s.toLowerCase()));
    const titleTerms = tokenize(job.title);
    const titleSet = new Set(titleTerms);

    const termWeights: Record<string, number> = {};
    for (const term of descTerms) {
      let weight = 1;
      if (skillSet.has(term)) weight = 3;
      else if (titleSet.has(term)) weight = 2;
      termWeights[term] = termWeights[term] ? Math.max(termWeights[term], weight) : weight;
    }

    // Step 2 — Fetch all seekers with profiles
    const seekers = await prisma.user.findMany({
      where: { role: "SEEKER" },
      include: {
        profile: { select: { bio: true, headline: true, skills: true, experience: true, education: true, communityScore: true } },
      },
    });

    // Step 3 — Score each candidate
    let maxDescScore = 1; // ponytail: simple term overlap. Upgrade to TF-IDF or embeddings if precision matters.
    const scored: any[] = [];

    for (const user of seekers) {
      if (!user.profile) continue;

      const bio = user.profile.bio?.toLowerCase() ?? "";
      const skills = user.profile.skills.map((s) => s.toLowerCase());
      const allExperience = (typeof user.profile.experience === "string"
        ? JSON.parse(user.profile.experience)
        : user.profile.experience ?? []) as any[];
      const allEducation = (typeof user.profile.education === "string"
        ? JSON.parse(user.profile.education)
        : user.profile.education ?? []) as any[];

      // a) SKILL MATCH (0-40)
      let matchedCount = 0;
      for (const js of job.skills) {
        const jsl = js.toLowerCase();
        if (skills.includes(jsl)) { matchedCount++; continue; }
        if (bio.includes(jsl)) { matchedCount++; continue; }
        const inExp = allExperience.some((e: any) =>
          e.description?.toLowerCase().includes(jsl)
        );
        if (inExp) { matchedCount++; continue; }
      }
      const skillScore = job.skills.length > 0
        ? (matchedCount / job.skills.length) * 40
        : 0;

      // b) DESCRIPTION MATCH (0-35)
      let weightedScore = 0;
      for (const [term, weight] of Object.entries(termWeights)) {
        let appears = 0;
        if (bio.includes(term)) appears += 1;
        for (const exp of allExperience) {
          if (exp.description?.toLowerCase().includes(term)) appears += 1;
        }
        if (skills.includes(term)) appears += 2;
        for (const edu of allEducation) {
          if (edu.degree?.toLowerCase().includes(term) || edu.school?.toLowerCase().includes(term)) appears += 0.5;
        }
        weightedScore += appears * weight;
      }
      if (weightedScore > maxDescScore) maxDescScore = weightedScore;
      const descScore = Math.min(weightedScore / maxDescScore, 1) * 35;

      // c) EXPERIENCE LEVEL MATCH (0-15)
      const totalYears = calcTotalYears(user.profile.experience);
      const candidateLevel = estimateLevel(totalYears);
      const jobLevelOrder = LEVEL_ORDER[job.level] ?? 1;
      const candLevelOrder = LEVEL_ORDER[candidateLevel] ?? 0;
      let levelScore = 5;
      if (candLevelOrder === jobLevelOrder) levelScore = 15;
      else if (Math.abs(candLevelOrder - jobLevelOrder) <= 1) levelScore = 10;

      // d) EDUCATION MATCH (0-10)
      let eduScore = 0;
      const descTokens = new Set(descTerms);
      for (const edu of allEducation) {
        const eduText = `${edu.degree ?? ""} ${edu.school ?? ""}`.toLowerCase();
        if (descTokens.size > 0 && [...descTokens].some((t) => eduText.includes(t))) {
          eduScore = 10;
          break;
        }
      }

      const totalScore = Math.round(skillScore + descScore + levelScore + eduScore);
      scored.push({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        headline: user.profile.headline,
        skills: user.profile.skills,
        matchScore: totalScore,
        estimatedLevel: candidateLevel,
        totalYearsExp: Math.round(totalYears),
        scoreBreakdown: {
          skillMatch: Math.round(skillScore),
          descriptionMatch: Math.round(descScore),
          experienceLevelMatch: levelScore,
          educationMatch: eduScore,
        },
      });
    }

    // Step 4 — Sort and return top `limit`
    scored.sort((a, b) => b.matchScore - a.matchScore);
    return { candidates: scored.slice(0, limit), totalCandidates: scored.length };
  },
};
