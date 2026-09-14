import { User } from "../models/User";
import { Question, type QuestionDifficulty, type InterviewType } from "../models/Question";
import { Job } from "../models/Job";
import { Field } from "../models/Field";
import { jobs } from "../data/jobs";
import fs from "fs";
import path from "path";

import mongoose from "mongoose";

export const autoSeed = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 1) {
    console.log("ℹ️ MongoDB not connected. Skipping auto-seed.");
    return;
  }

  try {
    // 1. Seed Demo User
    let demoUser = await User.findOne({ email: "demo@interviewiq.ai" });
    if (!demoUser) {
      demoUser = await User.create({
        fullName: "Demo İstifadəçi",
        email: "demo@interviewiq.ai",
        password: "Password123!",
        role: "user",
        isEmailVerified: true,
        authProvider: "local",
      });
      console.log("✅ Auto-seed: Demo user created (demo@interviewiq.ai / Password123!)");
    }
  } catch (error) {
    console.error("⚠️ Auto-seed user error:", error);
  }

  // 2. Seed Fields
  try {
    const fieldCount = await Field.countDocuments();
    if (fieldCount === 0) {
      const fieldsFilePath = path.join(__dirname, "../data/fields.json");
      if (fs.existsSync(fieldsFilePath)) {
        const raw = fs.readFileSync(fieldsFilePath, "utf-8");
        const parsed = JSON.parse(raw);
        const docs = parsed.map((item: any) => ({
          slug: item.id || item.slug,
          name: item.name,
          category: item.category || "software-development",
          description: item.description || "",
          aliases: item.aliases || [],
          searchQueries: item.searchQueries || [],
          coreSkills: item.coreSkills || [],
          secondarySkills: item.secondarySkills || [],
          keywords: item.keywords || [],
          negativeKeywords: item.negativeKeywords || [],
          relatedRoles: (item.relatedRoles || []).map((rr: any) => ({
            title: rr.title || rr.role || "Developer",
            similarity: typeof rr.similarity === "number" ? rr.similarity : 50,
          })),
          relatedFields: (item.relatedFields || []).map((rf: any) => ({
            fieldSlug: rf.fieldSlug || rf.fieldId || "",
            similarity: typeof rf.similarity === "number" ? rf.similarity : 50,
          })),
          isActive: true,
        }));
        await Field.insertMany(docs);
        console.log(`✅ Auto-seed: ${docs.length} career fields seeded.`);
      }
    }
  } catch (error) {
    console.error("⚠️ Auto-seed fields error:", error);
  }

  // 3. Seed Jobs
  try {
    const jobCount = await Job.countDocuments();
    if (jobCount === 0 && jobs && jobs.length > 0) {
      const formattedJobs = jobs.slice(0, 30).map((j: any) => ({
        ...j,
        source: "Greenhouse",
        isActive: true,
        salary: typeof j.salary === "number" ? j.salary : (j.salary?.max || j.salary?.min || 75000),
        salaryMin: typeof j.salary === "object" ? j.salary?.min : 50000,
        salaryMax: typeof j.salary === "object" ? j.salary?.max : 90000,
        salaryCurrency: (typeof j.salary === "object" && j.salary?.currency) || "USD",
        salaryPeriod: (typeof j.salary === "object" && j.salary?.period) || "year",
        experienceMin: j.experienceLevel === "entry" ? 0 : j.experienceLevel === "junior" ? 1 : 3,
        experienceMax: j.experienceLevel === "entry" ? 1 : j.experienceLevel === "junior" ? 3 : null,
      }));
      await Job.insertMany(formattedJobs);
      console.log(`✅ Auto-seed: ${formattedJobs.length} jobs seeded.`);
    }
  } catch (error) {
    console.error("⚠️ Auto-seed jobs error:", error);
  }

  // 4. Seed Questions
  try {
    const demoUser = await User.findOne({ email: "demo@interviewiq.ai" });
    const questionCount = await Question.countDocuments();
    if (questionCount < 15 && demoUser) {
      const sampleQuestions: Array<{
        text: string;
        category: string;
        difficulty: QuestionDifficulty;
        interviewType: InterviewType;
        tags: string[];
      }> = [
        // Frontend Developer - Technical
        {
          text: "Explain the difference between useEffect and useLayoutEffect in React. When would you choose one over the other?",
          category: "frontend-developer",
          difficulty: "intermediate",
          interviewType: "technical",
          tags: ["react", "hooks", "javascript"],
        },
        {
          text: "What is the Virtual DOM in React and how does the reconciliation algorithm (Fiber) work?",
          category: "frontend-developer",
          difficulty: "intermediate",
          interviewType: "technical",
          tags: ["react", "virtual-dom", "performance"],
        },
        {
          text: "Explain CSS Box Model and the difference between content-box and border-box sizing.",
          category: "frontend-developer",
          difficulty: "beginner",
          interviewType: "technical",
          tags: ["css", "html"],
        },
        {
          text: "How does the JavaScript Event Loop handle microtasks vs macrotasks (Promises vs setTimeout)?",
          category: "frontend-developer",
          difficulty: "advanced",
          interviewType: "technical",
          tags: ["javascript", "event-loop", "async"],
        },
        {
          text: "Describe strategies you use to optimize Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS).",
          category: "frontend-developer",
          difficulty: "senior",
          interviewType: "technical",
          tags: ["web-vitals", "performance", "optimization"],
        },

        // Frontend Developer - Behavioral
        {
          text: "Tell me about a time when you received contradictory feedback from designers and product managers. How did you resolve it?",
          category: "frontend-developer",
          difficulty: "intermediate",
          interviewType: "behavioral",
          tags: ["communication", "collaboration"],
        },
        {
          text: "Describe a situation where a production bug affected users. How did you diagnose, communicate, and fix the issue?",
          category: "frontend-developer",
          difficulty: "intermediate",
          interviewType: "behavioral",
          tags: ["problem-solving", "debugging"],
        },
        {
          text: "How do you stay updated with rapidly changing frontend libraries, tools, and best practices?",
          category: "frontend-developer",
          difficulty: "beginner",
          interviewType: "behavioral",
          tags: ["learning", "growth"],
        },
        {
          text: "Can you give an example of how you advocated for code quality or refactoring when there was pressure to ship fast?",
          category: "frontend-developer",
          difficulty: "senior",
          interviewType: "behavioral",
          tags: ["leadership", "best-practices"],
        },

        // Backend Developer - Technical
        {
          text: "Explain the differences between SQL and NoSQL databases, and how you decide between PostgreSQL and MongoDB for a new project.",
          category: "backend-developer",
          difficulty: "intermediate",
          interviewType: "technical",
          tags: ["database", "sql", "mongodb"],
        },
        {
          text: "How does JWT authentication work and how do you securely handle token expiration and revocation?",
          category: "backend-developer",
          difficulty: "intermediate",
          interviewType: "technical",
          tags: ["security", "jwt", "auth"],
        },
        {
          text: "What is horizontal vs vertical scaling, and how would you design a rate limiter for an Express API?",
          category: "backend-developer",
          difficulty: "advanced",
          interviewType: "technical",
          tags: ["system-design", "scaling", "express"],
        },
        {
          text: "Explain indexing in databases: how does a B-Tree index speed up read queries and impact write operations?",
          category: "backend-developer",
          difficulty: "intermediate",
          interviewType: "technical",
          tags: ["database", "indexing", "performance"],
        },

        // Backend Developer - Behavioral
        {
          text: "Describe a time when you had to balance technical debt against immediate feature delivery.",
          category: "backend-developer",
          difficulty: "intermediate",
          interviewType: "behavioral",
          tags: ["decision-making", "prioritization"],
        },
        {
          text: "Tell me about a complex backend outage or performance bottleneck you identified and solved.",
          category: "backend-developer",
          difficulty: "advanced",
          interviewType: "behavioral",
          tags: ["troubleshooting", "system-reliability"],
        },
        {
          text: "How do you approach API design to ensure backwards compatibility when introducing breaking changes?",
          category: "backend-developer",
          difficulty: "senior",
          interviewType: "behavioral",
          tags: ["architecture", "api-design"],
        },

        // General / Software Engineer
        {
          text: "Explain the SOLID design principles with practical real-world examples.",
          category: "software-engineer",
          difficulty: "intermediate",
          interviewType: "technical",
          tags: ["software-design", "solid", "oop"],
        },
        {
          text: "Tell me about yourself, your background in software engineering, and why you are interested in this role.",
          category: "software-engineer",
          difficulty: "beginner",
          interviewType: "behavioral",
          tags: ["introduction", "culture-fit"],
        },
        {
          text: "Describe a project you are most proud of. What architectural decisions did you make and what would you improve?",
          category: "software-engineer",
          difficulty: "intermediate",
          interviewType: "behavioral",
          tags: ["portfolio", "architecture"],
        },
      ];

      const questionDocs = sampleQuestions.map((q) => ({
        ...q,
        isActive: true,
        createdBy: demoUser._id,
      }));

      await Question.insertMany(questionDocs);
      console.log(`✅ Auto-seed: ${questionDocs.length} interview questions seeded.`);
    }
  } catch (error) {
    console.error("⚠️ Auto-seed error (non-fatal):", error);
  }
};
