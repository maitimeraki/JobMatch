import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SKILLS = [
  "TypeScript", "React", "Node.js", "PostgreSQL", "Python",
  "Docker", "Kubernetes", "AWS", "GraphQL", "Rust",
  "Go", "Vue.js", "Angular", "Redis", "MongoDB",
  "Next.js", "Tailwind CSS", "Git", "CI/CD", "Terraform",
  "Java", "Spring Boot", "C#", ".NET", "SQL",
  "Figma", "UI/UX", "Agile", "Machine Learning", "Data Science",
];

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("demo1234", 12);

  // Seed skills
  console.log("Seeding skills...");
  for (const name of SKILLS) {
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  const allSkills = await prisma.skill.findMany();
  const skillMap = Object.fromEntries(allSkills.map((s) => [s.name, s.id]));

  // Create users
  const seeker = await prisma.user.upsert({
    where: { email: "seeker@demo.com" },
    update: {},
    create: {
      email: "seeker@demo.com",
      password: hashedPassword,
      name: "John Seeker",
      role: "SEEKER",
      profile: {
        create: {
          bio: "Software developer looking for new opportunities",
          headline: "Full Stack Developer",
          location: "San Francisco, CA",
          skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Python", "Docker"],
          communityScore: 42,
          experience: [
            { title: "Software Engineer", company: "Tech Corp", startDate: "2021-01-01", description: "Building full-stack applications" },
          ],
          education: [{ degree: "B.S. Computer Science", school: "UC Berkeley", year: 2020 }],
        },
      },
    },
    include: { profile: true },
  });

  const seeker2 = await prisma.user.upsert({
    where: { email: "alice@demo.com" },
    update: {},
    create: {
      email: "alice@demo.com",
      password: hashedPassword,
      name: "Alice Developer",
      role: "SEEKER",
      profile: {
        create: {
          bio: "Frontend specialist passionate about React",
          headline: "Frontend Engineer",
          location: "Remote",
          skills: ["React", "TypeScript", "Tailwind CSS", "Figma", "Next.js"],
          communityScore: 28,
          experience: [
            { title: "Frontend Developer", company: "WebStudio", startDate: "2022-03-01", description: "Building modern web apps" },
          ],
          education: [{ degree: "B.S. Software Engineering", school: "MIT", year: 2021 }],
        },
      },
    },
    include: { profile: true },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@demo.com" },
    update: {},
    create: {
      email: "recruiter@demo.com",
      password: hashedPassword,
      name: "Alice Recruiter",
      role: "RECRUITER",
      profile: {
        create: {
          bio: "Technical recruiter at TechCorp",
          headline: "Senior Technical Recruiter",
          location: "New York, NY",
          skills: ["Recruiting", "Technical Screening", "HR"],
        },
      },
    },
    include: { profile: true },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      profile: { create: { bio: "Platform administrator", headline: "Admin" } },
    },
    include: { profile: true },
  });

  console.log("Created users:", seeker.email, seeker2.email, recruiter.email, admin.email);

  // Create sample posts with categories
  const postsData = [
    { authorId: seeker.id, content: "Excited to announce that I'm starting a new chapter in my career! Open to new opportunities in full-stack development.", category: "ACHIEVEMENT" as const },
    { authorId: seeker.id, content: "Just finished building a real-time chat application with WebSockets and React. The learning curve was steep but totally worth it! Check out the repo: github.com/john/realtime-chat", category: "PROJECT_SHOWCASE" as const },
    { authorId: seeker.id, content: "Tips for fellow job seekers: Keep learning, stay persistent, and remember that the right opportunity will come along.", category: "DISCUSSION" as const },
    { authorId: seeker2.id, content: "Just completed my portfolio site with Next.js and Tailwind. Would love feedback from the community!", category: "PROJECT_SHOWCASE" as const },
    { authorId: seeker2.id, content: "Has anyone tried the new React Server Components in production? Thinking about migrating our app.", category: "QUESTION" as const },
    { authorId: seeker2.id, content: "Spent the weekend learning Rust. The ownership model is challenging but incredibly powerful.", category: "LEARNING" as const },
  ];

  for (const postData of postsData) {
    const existing = await prisma.post.findFirst({
      where: { content: { startsWith: postData.content.substring(0, 40) } },
    });
    if (!existing) {
      await prisma.post.create({ data: postData });
    }
  }
  console.log("Created sample posts with categories");

  // Create endorsements
  const allPosts = await prisma.post.findMany({ take: 6, orderBy: { createdAt: "desc" } });
  if (allPosts.length >= 2) {
    const existingEndorsement = await prisma.endorsement.findFirst({
      where: { endorserId: seeker2.id, endorsedId: seeker.id },
    });
    if (!existingEndorsement) {
      await prisma.endorsement.create({
        data: { endorserId: seeker2.id, endorsedId: seeker.id, skillId: skillMap["TypeScript"], postId: allPosts[0].id },
      });
      await prisma.endorsement.create({
        data: { endorserId: seeker2.id, endorsedId: seeker.id, skillId: skillMap["React"], postId: allPosts[0].id },
      });
      await prisma.endorsement.create({
        data: { endorserId: seeker2.id, endorsedId: seeker.id, skillId: skillMap["Node.js"], postId: allPosts[0].id },
      });
      console.log("Created endorsements for seeker");
    }
  }

  // Create sample job listings
  const jobsData = [
    {
      recruiterId: recruiter.id,
      title: "Senior Frontend Engineer",
      description: "We are looking for an experienced frontend engineer to join our team. You will be building modern web applications using React, TypeScript, and Next.js.",
      location: "San Francisco, CA (Remote)",
      type: "FULL_TIME" as const,
      level: "SENIOR" as const,
      salaryMin: 140000,
      salaryMax: 180000,
      skills: ["React", "TypeScript", "Next.js", "CSS", "GraphQL"],
    },
    {
      recruiterId: recruiter.id,
      title: "Backend Developer - Node.js",
      description: "Join our backend team to build scalable microservices with Node.js, TypeScript, and PostgreSQL.",
      location: "New York, NY",
      type: "FULL_TIME" as const,
      level: "MID" as const,
      salaryMin: 110000,
      salaryMax: 150000,
      skills: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Docker"],
    },
    {
      recruiterId: recruiter.id,
      title: "DevOps Engineer (Contract)",
      description: "Need a skilled DevOps engineer for a 6-month contract to help migrate infrastructure to Kubernetes.",
      location: "Remote",
      type: "CONTRACT" as const,
      level: "SENIOR" as const,
      salaryMin: 80000,
      salaryMax: 120000,
      skills: ["Kubernetes", "Docker", "Terraform", "AWS", "CI/CD"],
    },
    {
      recruiterId: recruiter.id,
      title: "Junior Data Analyst",
      description: "Great opportunity for someone starting in data analytics. Work with our data team.",
      location: "Austin, TX",
      type: "FULL_TIME" as const,
      level: "JUNIOR" as const,
      salaryMin: 60000,
      salaryMax: 80000,
      skills: ["SQL", "Python", "Excel", "Tableau"],
    },
    {
      recruiterId: recruiter.id,
      title: "Full Stack Developer",
      description: "Looking for a full stack developer proficient in React, Node.js, and PostgreSQL.",
      location: "San Francisco, CA",
      type: "FULL_TIME" as const,
      level: "MID" as const,
      salaryMin: 120000,
      salaryMax: 160000,
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker"],
    },
  ];

  for (const jobData of jobsData) {
    const existing = await prisma.jobListing.findFirst({
      where: { title: jobData.title },
    });
    if (!existing) {
      await prisma.jobListing.create({ data: jobData });
    }
  }
  console.log("Created sample job listings");

  // Create sample referral requests
  const allJobs = await prisma.jobListing.findMany({ take: 3, orderBy: { createdAt: "desc" } });
  if (allJobs.length >= 2) {
    const existingReferral = await prisma.referralRequest.findFirst({
      where: { requesterId: seeker2.id, connectorId: seeker.id },
    });
    if (!existingReferral) {
      await prisma.referralRequest.create({
        data: {
          requesterId: seeker2.id,
          connectorId: seeker.id,
          jobId: allJobs[0].id,
          message: "Hi John, I noticed you work at TechCorp. Would you be willing to refer me for the Senior Frontend Engineer role? I have strong React experience.",
          status: "PENDING",
        },
      });
    }
    const existingReferral2 = await prisma.referralRequest.findFirst({
      where: { requesterId: seeker.id, connectorId: seeker2.id },
    });
    if (!existingReferral2) {
      await prisma.referralRequest.create({
        data: {
          requesterId: seeker.id,
          connectorId: seeker2.id,
          jobId: allJobs[1].id,
          message: "Hi Alice, could you refer me for the Backend Developer role at WebStudio? My Node.js skills match well.",
          status: "ACCEPTED",
        },
      });
    }
  }
  console.log("Created sample referral requests");

  // Update community scores based on endorsements
  const endorsements = await prisma.endorsement.groupBy({
    by: ["endorsedId"],
    _count: { id: true },
  });
  for (const e of endorsements) {
    const score = e._count.id * 3;
    await prisma.profile.updateMany({
      where: { userId: e.endorsedId },
      data: { communityScore: score },
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
