import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";
import { usersApi } from "../../lib/api";

interface CheckItem {
  label: string;
  completed: boolean;
  points: number;
  pointsAwarded: number;
}

interface ProfileStrengthData {
  score: number;
  items: CheckItem[];
  nextStep: string | null;
}

interface ProfileStrengthProps {
  userId: string;
}

function CircularProgress({ score }: { score: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score < 40 ? "text-red-500 stroke-red-500" : score < 70 ? "text-amber-500 stroke-amber-500" : "text-green-500 stroke-green-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
        <circle className="stroke-muted" fill="none" strokeWidth="6" r={r} cx="40" cy="40" />
        <circle className={cn("fill-none transition-all duration-500", color)} strokeWidth="6" strokeLinecap="round" r={r} cx="40" cy="40" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span className={cn("absolute text-2xl font-bold", color.split(" ")[0])}>{score}</span>
    </div>
  );
}

export function ProfileStrengthCard({ userId }: ProfileStrengthProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["profile-strength", userId],
    queryFn: () => usersApi.getProfileStrength(userId),
    enabled: !!userId,
  });

  const strength: ProfileStrengthData | undefined = (data as any)?.data;

  if (isLoading) return <Card><CardContent className="p-4 text-sm text-muted-foreground">Loading profile strength...</CardContent></Card>;
  if (!strength) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span>Profile Strength</span>
          <CircularProgress score={strength.score} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {strength.items.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className={cn("flex items-center gap-2", item.completed ? "text-muted-foreground line-through" : "text-foreground")}>
                <span className={cn("flex h-4 w-4 items-center justify-center rounded-full", item.completed ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground")}>
                  {item.completed ? "✓" : "+"}
                </span>
                {item.label}
              </span>
              <span className={cn("text-xs font-medium", item.completed ? "text-green-600" : "text-muted-foreground")}>
                {item.completed ? `${item.pointsAwarded}/${item.points}` : `+${item.points}`}
              </span>
            </div>
          ))}
        </div>
        {strength.nextStep && (
          <p className="text-center text-xs font-medium text-primary">{strength.nextStep}</p>
        )}
      </CardContent>
    </Card>
  );
}
