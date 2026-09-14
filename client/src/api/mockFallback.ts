import type { AxiosRequestConfig, AxiosResponse } from "axios";

export const handleMockFallback = (
  config: AxiosRequestConfig
): AxiosResponse | null => {
  const url = (config.url || "").toLowerCase();
  const method = (config.method || "get").toLowerCase();

  const makeResponse = (data: any, status = 200): AxiosResponse => ({
    data,
    status,
    statusText: "OK",
    headers: {},
    config: config as any,
  });

  // 1. Auth: Login & Register
  if (url.includes("/auth/login") || url.includes("/auth/register")) {
    return makeResponse({
      success: true,
      message: "Uğurla daxil oldunuz (Demo rejim)",
      data: {
        token: "demo-jwt-token-active-preview",
        user: {
          id: "demo-user-001",
          _id: "demo-user-001",
          fullName: "Demo İstifadəçi",
          email: "demo@interviewiq.ai",
          role: "user",
          isEmailVerified: true,
          authProvider: "local",
        },
      },
    });
  }

  if (url.includes("/auth/me") || url.includes("/users/me")) {
    return makeResponse({
      success: true,
      data: {
        user: {
          id: "demo-user-001",
          _id: "demo-user-001",
          fullName: "Demo İstifadəçi",
          email: "demo@interviewiq.ai",
          role: "user",
          isEmailVerified: true,
        },
      },
    });
  }

  // 2. Dashboard Stats
  if (url.includes("/dashboard/stats")) {
    return makeResponse({
      success: true,
      data: {
        stats: {
          totalInterviews: 6,
          completedInterviews: 5,
          averageScore: 84,
          bestScore: 95,
          recentInterviews: [
            {
              _id: "mock_1",
              category: "frontend-developer",
              roleSlug: "frontend-developer",
              score: 92,
              status: "completed",
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              _id: "mock_2",
              category: "fullstack-developer",
              roleSlug: "fullstack-developer",
              score: 86,
              status: "completed",
              createdAt: new Date(Date.now() - 172800000).toISOString(),
            },
          ],
        },
      },
    });
  }

  // 3. Progress
  if (url.includes("/progress")) {
    return makeResponse({
      success: true,
      data: {
        averageScore: 84,
        totalInterviews: 6,
        scoreProgression: [
          { date: "2026-09-01", score: 68 },
          { date: "2026-09-04", score: 75 },
          { date: "2026-09-07", score: 81 },
          { date: "2026-09-10", score: 88 },
          { date: "2026-09-13", score: 92 },
        ],
        skillBreakdown: {
          React: 88,
          JavaScript: 85,
          TypeScript: 82,
          CSS: 90,
          "System Design": 76,
        },
      },
    });
  }

  // 4. Career Automation & Fields
  if (url.includes("/career-automation/fields") || url.includes("/fields")) {
    return makeResponse({
      success: true,
      data: {
        fields: [
          {
            slug: "frontend-developer",
            name: "Frontend Developer",
            category: "Software Development",
            description: "Müasir veb interfeysləri, React, TypeScript və istifadəçi təcrübəsi arxitekturası.",
          },
          {
            slug: "backend-developer",
            name: "Backend Developer",
            category: "Software Development",
            description: "Server arxitekturası, Node.js, verilənlər bazası və paylanmış sistemlər.",
          },
          {
            slug: "fullstack-developer",
            name: "Full Stack Developer",
            category: "Software Development",
            description: "Həm frontend, həm backend ekosistemlərində ucdan-uca tətbiq inkişafı.",
          },
          {
            slug: "mobile-developer",
            name: "Mobile Developer (React Native / Flutter)",
            category: "Mobile Development",
            description: "iOS və Android platformaları üçün çarpaz mobil tətbiqlərin yaradılması.",
          },
          {
            slug: "ui-ux-designer",
            name: "UI/UX Designer",
            category: "Design",
            description: "İstifadəçi araşdırmaları, interfeys dizaynı, Figma prototipləri və dizayn sistemləri.",
          },
          {
            slug: "devops-engineer",
            name: "DevOps & Cloud Engineer",
            category: "Infrastructure",
            description: "CI/CD, Docker, Kubernetes, AWS və bulud infrastrukturunun avtomatlaşdırılması.",
          },
        ],
        total: 6,
      },
    });
  }

  // 5. Jobs Listing & Single Job
  if (url.includes("/jobs")) {
    const mockJobsList = [
      {
        _id: "job_fe_1",
        title: "Senior Frontend Engineer (React/TypeScript)",
        company: "InnovateTech Global",
        location: "Baku, Azerbaijan (Hybrid)",
        remoteType: "hybrid",
        employmentType: "full-time",
        experienceLevel: "senior",
        description: "Biz genişlənən platformamız üçün qabaqcıl React, TypeScript və dizayn sistemləri sahəsində təcrübəli Senior Frontend mühəndisi axtarırıq.",
        responsibilities: [
          "Mürəkkəb frontend arxitekturasını qurmaq və təmiz kod standartlarını təmin etmək",
          "Web vitals və tətbiqin yüklənmə sürətini optimallaşdırmaq",
          "Dizayn və məhsul komandaları ilə sıx əməkdaşlıq etmək",
        ],
        requirements: [
          "React və TypeScript ilə 4+ il praktiki təcrübə",
          "Redux Toolkit, Zustand və ya React Query ilə güclü iş təcrübəsi",
          "REST və GraphQL API inteqrasiyası",
        ],
        preferredQualifications: ["Next.js", "TailwindCSS", "Jest/Playwright"],
        skills: ["React", "TypeScript", "JavaScript", "HTML/CSS", "Next.js", "TailwindCSS"],
        keywords: ["frontend", "react", "typescript", "web", "ui"],
        education: ["Kompüter elmləri və ya əlaqəli sahə üzrə ali təhsil"],
        salary: 4200,
        source: "Greenhouse",
        isActive: true,
        postedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        match: {
          matchScore: 94,
          matchLevel: "high",
          matchLabel: "Yüksək Uyğunluq",
          matchedSkills: ["React", "TypeScript", "JavaScript", "HTML/CSS"],
          missingSkills: ["GraphQL"],
          matchedKeywords: ["frontend", "react", "typescript"],
          missingKeywords: ["graphql"],
          strengths: ["Güclü React və TypeScript təcrübəsi"],
          improvementAreas: ["Mikro-frontend və SSR təcrübəsini artırmaq"],
          breakdown: { skills: 96, keywords: 92, experience: 90, education: 95 },
        },
      },
      {
        _id: "job_be_2",
        title: "Backend Developer (Node.js / Express / MongoDB)",
        company: "Apex Cloud Services",
        location: "Remote",
        remoteType: "remote",
        employmentType: "full-time",
        experienceLevel: "mid",
        description: "Yüksək yüklü API xidmətləri və mikroxidmətlər arxitekturası üçün bacarıqlı Node.js mütəxəssisi tələb olunur.",
        responsibilities: [
          "Etibarlı və miqyaslana bilən REST API-lər layihələndirmək",
          "Verilənlər bazası sorğularını və indekslərini optimallaşdırmaq",
        ],
        requirements: [
          "Node.js, TypeScript və MongoDB ilə 2+ il təcrübə",
          "JWT və OAuth avtorizasiya prinsiplərini bilmək",
        ],
        preferredQualifications: ["Docker", "Redis", "Kafka"],
        skills: ["Node.js", "Express", "MongoDB", "TypeScript", "Docker"],
        keywords: ["backend", "node", "api", "database", "mongodb"],
        education: ["Ali təhsil"],
        salary: 3500,
        source: "Lever",
        isActive: true,
        postedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        match: {
          matchScore: 88,
          matchLevel: "high",
          matchLabel: "Yaxşı Uyğunluq",
          matchedSkills: ["Node.js", "MongoDB", "TypeScript"],
          missingSkills: ["Redis"],
          matchedKeywords: ["backend", "node", "api"],
          missingKeywords: ["kafka"],
          strengths: ["Təmiz kod və RESTful API standartları"],
          improvementAreas: ["Kəşləmə və mesaj növbələri"],
          breakdown: { skills: 88, keywords: 85, experience: 85, education: 90 },
        },
      },
      {
        _id: "job_fs_3",
        title: "Full Stack Engineer",
        company: "NextGen Digital",
        location: "Baku, Azerbaijan",
        remoteType: "onsite",
        employmentType: "full-time",
        experienceLevel: "junior",
        description: "Gənc və dinamik komandamıza müasir veb tətbiqlər üzərində işləyəcək Full Stack Developer qoşulmaq üçün dəvət olunur.",
        responsibilities: ["Frontend və backend komponentlərini hazırlamaq", "Testlər yazmaq"],
        requirements: ["JavaScript, React və Node.js bilikləri", "Git ilə işləmək bacarığı"],
        preferredQualifications: ["TailwindCSS", "SQL"],
        skills: ["JavaScript", "React", "Node.js", "Git", "SQL"],
        keywords: ["fullstack", "react", "node", "javascript"],
        education: ["Kompüter elmləri və ya kurs sertifikatı"],
        salary: 1800,
        source: "Ashby",
        isActive: true,
        postedAt: new Date(Date.now() - 86400000).toISOString(),
        match: {
          matchScore: 82,
          matchLevel: "medium",
          matchLabel: "Uyğun",
          matchedSkills: ["JavaScript", "React", "Node.js"],
          missingSkills: ["SQL"],
          matchedKeywords: ["react", "node"],
          missingKeywords: ["sql"],
          strengths: ["Həm client, həm server anlayışı"],
          improvementAreas: ["Verilənlər bazası modelləşdirilməsi"],
          breakdown: { skills: 82, keywords: 80, experience: 80, education: 85 },
        },
      },
    ];

    // Check if looking up a single job by id: /jobs/:jobId
    const singleJobMatch = url.match(/\/jobs\/([a-zA-Z0-9_-]+)$/);
    if (singleJobMatch && !["jobs", "refresh", "external"].includes(singleJobMatch[1])) {
      const jobId = singleJobMatch[1];
      const foundJob = mockJobsList.find((j) => j._id === jobId) || mockJobsList[0];
      return makeResponse({
        success: true,
        data: {
          job: foundJob,
        },
      });
    }

    return makeResponse({
      success: true,
      hasResume: true,
      message: "Vakansiyalar yükləndi",
      data: {
        jobs: mockJobsList,
        total: mockJobsList.length,
      },
    });
  }

  // 5.1 CV Optimization & Profile Completeness
  if (url.includes("/cv-optimization")) {
    return makeResponse({
      success: true,
      message: "CV optimizasiyası hazırlandı",
      data: {
        job: {
          id: "job_fe_1",
          title: "Senior Frontend Engineer (React/TypeScript)",
          company: "InnovateTech Global",
          location: "Baku, Azerbaijan (Hybrid)",
          skills: ["React", "TypeScript", "JavaScript", "HTML/CSS", "Next.js", "TailwindCSS"],
          keywords: ["frontend", "react", "typescript", "web", "ui"],
        },
        optimization: {
          overallScore: 88,
          baselineScore: 72,
          targetScore: 94,
          improvementScore: 16,
          summary: "CV-niz vakansiyanın əsas tələblərinə yüksək səviyyədə uyğundur. React və TypeScript təcrübəniz ön plana çıxarılmışdır.",
          sections: {
            summary: {
              status: "strong",
              score: 90,
              feedback: "Peşəkar xülasə aydın və hədəfə uyğundur.",
              suggestions: ["Açar bacarıqları ilk iki cümlədə vurğulayın."],
            },
            skills: {
              status: "strong",
              score: 92,
              feedback: "Tələb olunan bütün əsas texnologiyalar əhatə olunub.",
              suggestions: ["Əlavə olaraq Next.js və Redux Toolkit qeyd edin."],
            },
            experience: {
              status: "needs-improvement",
              score: 82,
              feedback: "Layihə nailiyyətlərini metriklərlə dəstəkləyin.",
              suggestions: ["Sürət və performans artım faizlərini əlavə edin."],
            },
          },
          keywords: {
            matched: ["React", "TypeScript", "JavaScript", "HTML/CSS", "Frontend"],
            missing: ["GraphQL", "CI/CD"],
          },
          priorityActions: [
            {
              id: "act-1",
              title: "Nailiyyətlərə metriklər əlavə edin",
              description: "Yüklənmə sürətinin 40% optimallaşdırılması kimi rəqəmlər göstərin.",
              priority: "high",
              section: "experience",
            },
            {
              id: "act-2",
              title: "Next.js və SSR təcrübəsini vurğulayın",
              description: "Müasir frontend arxitekturalarına bələd olduğunuzu göstərin.",
              priority: "medium",
              section: "skills",
            }
          ]
        },
        pdfUrl: "#",
        downloadUrl: "#",
      }
    });
  }

  if (url.includes("/resume-profile") || url.includes("/resume/profile") || url.includes("/completeness")) {
    return makeResponse({
      success: true,
      message: "Profil məlumatları uğurla yükləndi",
      data: {
        profileId: "profile_mock_001",
        source: {
          hasUploadedResume: true,
          fileName: "Demo_CV.pdf",
        },
        completeness: {
          isComplete: true,
          canGenerateCV: true,
          completionPercentage: 92,
          missingRequiredFields: [],
          missingOptionalFields: [],
          allMissingFields: [],
          existingFields: ["fullName", "email", "phone", "skills", "experience", "education"],
        }
      }
    });
  }

  if (url.includes("/questions")) {
    return makeResponse({
      success: true,
      data: {
        questions: [
          {
            _id: "q_1",
            category: "frontend-developer",
            difficulty: "intermediate",
            type: "technical",
            questionText: "What is the Virtual DOM and how does React reconcile changes?",
          },
          {
            _id: "q_2",
            category: "frontend-developer",
            difficulty: "intermediate",
            type: "technical",
            questionText: "Explain the difference between state and props in React components.",
          },
          {
            _id: "q_3",
            category: "frontend-developer",
            difficulty: "advanced",
            type: "behavioral",
            questionText: "Tell me about a challenging technical trade-off you had to make in a web application.",
          }
        ],
        total: 3
      }
    });
  }

  // 6. Mock Interview: Start / Get / Answer
  if (url.includes("/interviews") && method === "post") {
    // Check if submitting an answer
    if (url.includes("/answers")) {
      let parsedBody: any = {};
      try {
        parsedBody = typeof config.data === "string" ? JSON.parse(config.data || "{}") : (config.data || {});
      } catch {
        parsedBody = {};
      }
      const answer = (parsedBody.answerText || "").trim();
      const wordCount = answer.split(/\s+/).filter(Boolean).length;
      const score = wordCount < 10 ? 58 : wordCount < 30 ? 78 : 92;

      return makeResponse({
        success: true,
        message: "Cavabınız qiymətləndirildi",
        data: {
          evaluation: {
            score,
            technicalAccuracy: score,
            completeness: Math.max(40, score - 5),
            communication: Math.min(100, score + 3),
            strengths: [
              "Əsas texniki anlayışlar düzgün vurğulanıb.",
              "Fikirlər aydın və peşəkar terminologiya ilə ifadə edildi.",
            ],
            weaknesses: [
              "Real layihələrdə qarşılaşılan edge-case-lər daha ətraflı qeyd oluna bilərdi.",
            ],
            feedback:
              "Yaxşı cavabdır! Mövzunu anladığınız aydın görünür. Növbəti suallarda performans və arxitektur nüansları da qeyd etməklə daha yüksək bal toplaya bilərsiniz.",
            improvedAnswer:
              `${answer || "Texniki konsepsiya"} Əlavə olaraq, istehsalat mühitində (production) monitorinq, xətaların idarə edilməsi və miqyaslana bilən dizayn nümunələri də nəzərə alınmalıdır.`,
          },
          currentQuestionIndex: 1,
          totalQuestions: 6,
          isCompleted: false,
          nextQuestion: {
            questionId: "mock_q_2",
            questionText: "Explain the difference between useEffect and useLayoutEffect in React. When would you choose one over the other?",
          },
        },
      });
    }

    // Starting an interview
    return makeResponse({
      success: true,
      message: "Adaptiv müsahibə başladı",
      data: {
        interviewId: "mock_interview_active_001",
        category: "frontend-developer",
        roleSlug: "frontend-developer",
        difficultyMode: "adaptive",
        detectedDifficulty: "intermediate",
        stretchDifficulty: "advanced",
        difficultyScore: 50,
        difficultyReason: "InterviewIQ orta səviyyəli başlanğıc bazasından başlayır.",
        format: {
          technicalQuestions: 3,
          behavioralQuestions: 3,
          totalQuestions: 6,
        },
        status: "in_progress",
        totalQuestions: 6,
        currentQuestionIndex: 0,
        question: {
          questionId: "mock_q_1",
          questionText: "What is the Virtual DOM in React and how does the reconciliation algorithm (Fiber) work?",
        },
      },
    });
  }

  if (url.includes("/interviews")) {
    return makeResponse({
      success: true,
      data: {
        interviews: [
          {
            _id: "mock_interview_active_001",
            category: "frontend-developer",
            roleSlug: "frontend-developer",
            difficulty: "intermediate",
            interviewType: "mixed",
            totalQuestions: 6,
            currentQuestionIndex: 0,
            status: "in_progress",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
  }

  // 7. Resumes: Analyze / History
  if (url.includes("/resume") || url.includes("/resumes")) {
    return makeResponse({
      success: true,
      message: "CV uğurla analiz olundu",
      data: {
        _id: "mock_resume_001",
        analysisId: "mock_resume_001",
        fileName: "Demo_CV_Frontend_Developer.pdf",
        fileSize: 1024 * 250,
        overallScore: 86,
        atsScore: 91,
        contentScore: 84,
        structureScore: 88,
        skillsScore: 85,
        experienceScore: 82,
        summary: "Frontend İnkişafı üzrə güclü texniki baza və React/TypeScript təcrübəsi əks olunmuş yüksək keyfiyyətli CV.",
        skillsDetected: ["React", "TypeScript", "JavaScript", "HTML/CSS", "Redux", "Git", "REST API", "TailwindCSS"],
        strengths: [
          "ATS sistemləri tərəfindən asan oxunan aydın struktur və başlıqlar.",
          "Müasir frontend texnologiyaları və açar sözlər tam yerindədir.",
          "Layihə təcrübəsi və istifadə olunan alətlər dəqiq göstərilib.",
        ],
        weaknesses: [
          "Bəzi bəndlərdə kəmiyyət göstəriciləri (metriklər, faizlər, təsir) artırıla bilər.",
          "Vahid fəaliyyət felləri (Action Verbs) ilə başlanan cümlələr daha çox olmalıdır.",
        ],
        recommendedSkills: ["Next.js", "Docker", "Unit Testing (Jest)", "GraphQL"],
        missingSkills: ["CI/CD", "Testing"],
        atsSuggestions: [
          "Şrift və formatlaşdırma ATS standartlarına tam uyğundur.",
          "Bölmə başlıqları standart adlarla ('Təcrübə', 'Təhsil', 'Bacarıqlar') saxlanılmalıdır.",
        ],
        formattingFeedback: [
          "Bütün bəndlər nöqtə-işarəli (bullet points) siyahı ilə tərtib olunub.",
          "Tarixlər və şirkət adları aydın seçilir.",
        ],
        recommendations: [
          "Nailiyyətləri rəqəmlərlə ifadə edin (məsələn: 'Yüklənmə sürətini 35% artırdım').",
          "Test və keyfiyyət təminatı bacarıqlarını (Jest, Cypress) əlavə edin.",
        ],
        createdAt: new Date().toISOString(),
      },
    });
  }

  // 8. Career Assistant Chat
  if (url.includes("/career") || url.includes("/chat")) {
    return makeResponse({
      success: true,
      message: "Salam! Mən sizin AI Karyera Köməkçinizəm. Müsahibəyə hazırlıq, CV-nizi təkmilləşdirmək və ya vakansiyalara müraciət etmək üçün istənilən sualınızı verə bilərsiniz!",
      data: {
        reply: "Salam! Mən sizin AI Karyera Köməkçinizəm. Müsahibəyə hazırlıq, CV-nizi təkmilləşdirmək və ya vakansiyalara müraciət etmək üçün istənilən sualınızı verə bilərsiniz!",
      },
    });
  }

  // 9. Bookmarks
  if (url.includes("/bookmarks")) {
    return makeResponse({
      success: true,
      data: {
        bookmarks: [],
        total: 0,
      },
    });
  }

  return null;
};
