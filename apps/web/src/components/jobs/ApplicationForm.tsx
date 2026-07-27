import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/text-area";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ApplicationFormProps {
  onSubmit: (data: { resumeUrl: string; coverLetter?: string }) => Promise<void>;
  onCancel: () => void;
}

export function ApplicationForm({ onSubmit, onCancel }: ApplicationFormProps) {
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!resumeUrl.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ resumeUrl, coverLetter: coverLetter || undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for this position</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Resume URL *</label>
          <Input
            placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Cover Letter</label>
          <Textarea
            placeholder="Tell the recruiter why you're a great fit..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={5}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={!resumeUrl.trim() || submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
