import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
  isVerified: boolean;
  className?: string;
}

export function VerifiedBadge({ isVerified, className = "" }: VerifiedBadgeProps) {
  if (!isVerified) return null;
  return (
    <span title="Verified Recruiter" className={`inline-flex ${className}`}>
      <BadgeCheck className="h-4 w-4 text-blue-500" />
    </span>
  );
}
