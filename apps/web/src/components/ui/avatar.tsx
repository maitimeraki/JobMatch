import * as React from "react";
import { cn } from "../../lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  fallback: string;
}

function Avatar({ src, fallback, className, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center text-sm font-medium",
        className
      )}
      {...props}
    >
      {src && !error ? (
        <img src={src} alt={fallback} className="aspect-square h-full w-full" onError={() => setError(true)} />
      ) : (
        <span>{fallback.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export { Avatar };
