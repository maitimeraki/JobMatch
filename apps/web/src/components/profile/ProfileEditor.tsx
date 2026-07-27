import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/text-area";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Plus, X, Save, Trash2 } from "lucide-react";

interface ProfileEditorProps {
  profile: any;
  role: string;
  onSave: (data: any) => Promise<any>;
  onCancel: () => void;
}

export default function ProfileEditor({ profile, role, onSave, onCancel }: ProfileEditorProps) {
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState<any[]>(profile?.experience ?? []);
  const [education, setEducation] = useState<any[]>(profile?.education ?? []);
  const [company, setCompany] = useState(profile?.company ?? "");
  const [currentRole, setCurrentRole] = useState(profile?.currentRole ?? "");
  const [saving, setSaving] = useState(false);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const addExperience = () => setExperience([...experience, { title: "", company: "", startDate: "", endDate: "", description: "" }]);
  const updateExperience = (i: number, field: string, value: string) => {
    const copy = experience.map((e, idx) => (idx === i ? { ...e, [field]: value } : e));
    setExperience(copy);
  };
  const removeExperience = (i: number) => setExperience(experience.filter((_, idx) => idx !== i));

  const addEducation = () => setEducation([...education, { degree: "", school: "", year: new Date().getFullYear() }]);
  const updateEducation = (i: number, field: string, value: any) => {
    const copy = education.map((e, idx) => (idx === i ? { ...e, [field]: value } : e));
    setEducation(copy);
  };
  const removeEducation = (i: number) => setEducation(education.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: any = { bio, headline, location, website, skills, experience, education };
      if (role === "RECRUITER") {
        data.company = company;
        data.currentRole = currentRole;
      }
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Headline</label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Bio</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Website</label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recruiter-specific: Company & Role */}
      {role === "RECRUITER" && (
        <Card>
          <CardHeader><CardTitle>Company Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Company</label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Current Role</label>
                <Input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="e.g. HR Manager" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      <Card>
        <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {skills.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 pr-1">
                {s}
                <button onClick={() => removeSkill(s)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Add a skill..."
              className="max-w-xs"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            />
            <Button variant="outline" size="sm" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Experience</CardTitle>
          <Button variant="outline" size="sm" onClick={addExperience}><Plus className="mr-1 h-4 w-4" />Add</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {experience.length === 0 && <p className="text-sm text-muted-foreground">No experience added yet.</p>}
          {experience.map((exp, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Entry #{i + 1}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeExperience(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={exp.title} onChange={(e) => updateExperience(i, "title", e.target.value)} placeholder="Job title" />
                <Input value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} placeholder="Company" />
                <Input value={exp.startDate} onChange={(e) => updateExperience(i, "startDate", e.target.value)} placeholder="Start date (e.g. 2020-01)" />
                <Input value={exp.endDate ?? ""} onChange={(e) => updateExperience(i, "endDate", e.target.value)} placeholder="End date (or leave empty)" />
              </div>
              <Textarea value={exp.description ?? ""} onChange={(e) => updateExperience(i, "description", e.target.value)} placeholder="Description..." rows={2} className="mt-3" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Education</CardTitle>
          <Button variant="outline" size="sm" onClick={addEducation}><Plus className="mr-1 h-4 w-4" />Add</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {education.length === 0 && <p className="text-sm text-muted-foreground">No education added yet.</p>}
          {education.map((edu, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Entry #{i + 1}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeEducation(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} placeholder="Degree" />
                <Input value={edu.school} onChange={(e) => updateEducation(i, "school", e.target.value)} placeholder="School" />
                <Input type="number" value={edu.year} onChange={(e) => updateEducation(i, "year", parseInt(e.target.value) || new Date().getFullYear())} placeholder="Year" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : <><Save className="mr-1 h-4 w-4" />Save Changes</>}
        </Button>
      </div>
    </div>
  );
}
