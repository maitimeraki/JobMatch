import { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import { routes } from "./routes";

function Fallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      {useRoutes(routes)}
    </Suspense>
  );
}
