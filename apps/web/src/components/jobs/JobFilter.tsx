import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface JobFilterProps {
  filters: { search?: string; type?: string; level?: string; location?: string };
  onChange: (filters: any) => void;
}

export function JobFilter({ filters, onChange }: JobFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Title, skills, company..."
            className="pl-9"
            value={filters.search || ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Type</label>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={filters.type || ""}
          onChange={(e) => onChange({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="FULL_TIME">Full Time</option>
          <option value="PART_TIME">Part Time</option>
          <option value="CONTRACT">Contract</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="FREELANCE">Freelance</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Level</label>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={filters.level || ""}
          onChange={(e) => onChange({ ...filters, level: e.target.value })}
        >
          <option value="">All Levels</option>
          <option value="JUNIOR">Junior</option>
          <option value="MID">Mid</option>
          <option value="SENIOR">Senior</option>
          <option value="LEAD">Lead</option>
          <option value="EXECUTIVE">Executive</option>
        </select>
      </div>
      <Button variant="secondary" onClick={() => onChange({})}>
        Reset
      </Button>
    </div>
  );
}
