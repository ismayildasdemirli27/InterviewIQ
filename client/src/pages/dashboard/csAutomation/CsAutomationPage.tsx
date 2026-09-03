import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  FiCpu,
  FiCode,
  FiZap,
  FiBookOpen,
  FiAward,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiClock,
  FiHelpCircle,
  FiCopy,
  FiCheck,
  FiBarChart2,
  FiRefreshCw,
  FiChevronRight,
  FiDatabase,
  FiGlobe,
  FiLayers,
  FiShield,
  FiBox,
  FiGitBranch,
  FiActivity,
  FiTerminal,
  FiPlay,
  FiDownload,
  FiVolume2,
  FiVolumeX,
  FiMic,
  FiMicOff,
  FiEdit3,
  FiPhoneCall,
  FiCalendar,
  FiAlertTriangle,
} from "react-icons/fi";
import apiClient from "../../../api/apiClient";
import CodeEditor from "../../../components/cs/CodeEditor";
import WhiteboardCanvas from "../../../components/cs/WhiteboardCanvas";
import MemoryVisualizer from "../../../components/cs/MemoryVisualizer";
import RadarChart, { type RadarDataPoint } from "../../../components/cs/RadarChart";
import BlindInterviewMode from "../../../components/cs/BlindInterviewMode";
import { runJavaScriptTestCases, type RunTestsResponse } from "../../../utils/codeRunner";
import { generateCsCertificate } from "../../../utils/certificateGenerator";
import { getStoredUser } from "../../../utils/authStorage";
import {
  speakText,
  stopSpeaking,
  SpeechRecognizer,
} from "../../../utils/speechService";
import "./csAutomationPage.scss";

/* =========================================
   INTERFACES & TYPES
========================================= */

export type CsPersona = "google" | "meta" | "amazon" | "holberton";

export interface InterviewerPersonaMeta {
  id: CsPersona;
  name: string;
  company: string;
  avatar: string;
  badge: string;
  tagline: string;
  promptQuote: string;
  evaluationFocus: string;
  color: string;
}

export const INTERVIEWER_PERSONAS: InterviewerPersonaMeta[] = [
  {
    id: "google",
    name: "Dr. Arvind Chen",
    company: "Google",
    avatar: "🏛️",
    badge: "Staff Architect",
    tagline: "Big-O & Algorithmic Rigor",
    promptQuote: "I look for optimal asymptotic complexity and zero unhandled boundary conditions.",
    evaluationFocus: "Mathematical rigor, amortized Big-O, edge-case resilience",
    color: "#4285f4",
  },
  {
    id: "meta",
    name: "Alex Rivera",
    company: "Meta",
    avatar: "⚡",
    badge: "E6 Product Engineer",
    tagline: "Speed, Clean Code & Velocity",
    promptQuote: "Ship clean, modular, bug-free implementations quickly under interview pressure.",
    evaluationFocus: "Code cleanliness, speed of iteration, defensive testing",
    color: "#0668e1",
  },
  {
    id: "amazon",
    name: "Marcus Vance",
    company: "Amazon",
    avatar: "📦",
    badge: "Principal Bar Raiser",
    tagline: "Scalability & Distributed Systems",
    promptQuote: "How does your data structure behave when scaled to 100M+ concurrent transactions?",
    evaluationFocus: "Scalability trade-offs, system thinking, customer obsession",
    color: "#ff9900",
  },
  {
    id: "holberton",
    name: "Sarah Jenkins",
    company: "Holberton School",
    avatar: "🎓",
    badge: "Lead Technical Mentor",
    tagline: "Pedagogical & Structural Guidance",
    promptQuote: "Explain your thought process step-by-step. Understand the fundamentals deeply.",
    evaluationFocus: "Conceptual understanding, structured communication, mentoring",
    color: "#ef4444",
  },
];

type CsDifficulty = "beginner" | "intermediate" | "advanced" | "senior";
type CsMode = "challenge" | "deep_dive" | "exam";

interface CsTopic {
  id: string;
  name: string;
  category?: string;
  description: string;
  icon: string;
  subTopics: string[];
  sampleConcepts: string[];
}

interface CsQuestion {
  questionId?: string;
  title: string;
  topic: string;
  subTopic: string;
  difficulty: CsDifficulty;
  questionText: string;
  codeSnippet?: string;
  language?: string;
  testCases?: Array<{
    id?: string;
    input: string;
    expectedOutput: string;
    explanation?: string;
  }>;
  expectedComplexity?: {
    time: string;
    space: string;
  };
  keyConcepts: string[];
  hints: string[];
  userAnswer?: string;
  userTimeComplexity?: string;
  userSpaceComplexity?: string;
  evaluation?: {
    score: number;
    technicalAccuracy: number;
    conceptualDepth: number;
    edgeCasesHandling: number;
    timeComplexityVerdict?: string;
    spaceComplexityVerdict?: string;
    strengths: string[];
    weaknesses: string[];
    feedback: string;
    optimalSolution?: string;
    followUpQuestion?: string;
  };
}

interface CsSession {
  _id: string;
  topic: string;
  subTopic?: string;
  difficulty: CsDifficulty;
  mode: CsMode;
  interviewerPersona?: CsPersona;
  isPressureMode?: boolean;
  isBlindMode?: boolean;
  status: string;
  questions: CsQuestion[];
  currentQuestionIndex: number;
  overallScore?: number;
  timeSpentSeconds?: number;
  summaryReport?: {
    strengths: string[];
    improvements: string[];
    recommendedTopics: string[];
  };
  createdAt?: string;
}

interface CsSkillItem {
  topicId: string;
  topicName: string;
  completedCount: number;
  masteryScore: number;
  status: string;
}

interface CsAnalytics {
  totalCompletedSessions: number;
  totalQuestionsSolved: number;
  averageOverallScore: number;
  strongestTopic: CsSkillItem | null;
  weakestTopic: CsSkillItem | null;
  skillMatrix: CsSkillItem[];
  recommendedFocus: string;
}

const COMPLEXITY_OPTIONS = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
  "O(n²)",
  "O(2ⁿ)",
  "O(n!)",
  "N/A (Theoretical/Architectural)",
];

const TOPIC_ICON_MAP: Record<string, React.ReactNode> = {
  "data-structures": <FiGitBranch />,
  algorithms: <FiCode />,
  "operating-systems": <FiCpu />,
  "computer-networks": <FiGlobe />,
  "database-systems": <FiDatabase />,
  "system-design": <FiLayers />,
  "oop-design-patterns": <FiBox />,
  cybersecurity: <FiShield />,
};

const CsAutomationPage: React.FC = () => {
  // Global Tabs
  const [activeTab, setActiveTab] = useState<"arena" | "matrix" | "history">("arena");

  // Configuration State
  const [topics, setTopics] = useState<CsTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("data-structures");
  const [selectedSubTopic, setSelectedSubTopic] = useState<string>("General");
  const [selectedDifficulty, setSelectedDifficulty] = useState<CsDifficulty>("intermediate");
  const [selectedMode, setSelectedMode] = useState<CsMode>("challenge");
  const [selectedPersona, setSelectedPersona] = useState<CsPersona>("google");
  const [isPressureMode, setIsPressureMode] = useState<boolean>(false);
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);

  // Pressure Mode Countdown & Mid-Interview Check-in
  const [pressureSecondsLeft, setPressureSecondsLeft] = useState<number>(25 * 60);
  const [hasTriggeredMidCheck, setHasTriggeredMidCheck] = useState<boolean>(false);
  const [showMidCheckModal, setShowMidCheckModal] = useState<boolean>(false);

  // Active Session State
  const [session, setSession] = useState<CsSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [userTimeComplexity, setUserTimeComplexity] = useState<string>("O(n)");
  const [userSpaceComplexity, setUserSpaceComplexity] = useState<string>("O(1)");
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Hints
  const [unlockedHints, setUnlockedHints] = useState<{ level: number; text: string }[]>([]);
  const [hintLoading, setHintLoading] = useState<boolean>(false);

  // Submission & Evaluation State
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [lastEvaluation, setLastEvaluation] = useState<CsQuestion["evaluation"] | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [evalProgressText, setEvalProgressText] = useState<string>("Analyzing Code with AI...");
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);

  // Monaco, Whiteboard, Memory Visualizer & In-Browser Test Runner State
  const [editorMode, setEditorMode] = useState<"monaco" | "whiteboard" | "visualizer" | "text">("monaco");
  const [testResults, setTestResults] = useState<RunTestsResponse | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [activeTestTab, setActiveTestTab] = useState<number>(0);

  // Voice Mode State (TTS & STT)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [dictationLanguage, setDictationLanguage] = useState<"az-AZ" | "en-US" | "ru-RU">("az-AZ");
  const [interimSpeech, setInterimSpeech] = useState<string>("");
  const [dictationError, setDictationError] = useState<string | null>(null);
  const speechRecognizerRef = useRef<SpeechRecognizer | null>(null);

  // Analytics & History State
  const [analytics, setAnalytics] = useState<CsAnalytics | null>(null);
  const [historySessions, setHistorySessions] = useState<CsSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [startLoading, setStartLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Provider Status
  const [aiStatus, setAiStatus] = useState<{
    activeProvider: string;
    localLlmOnline: boolean;
    localModelName: string;
    cloudModelName: string;
  } | null>(null);

  /* =========================================
     FETCH TOPICS & ANALYTICS ON LOAD
  ========================================= */

  const fetchInitialData = async () => {
    setPageLoading(true);
    setErrorMessage(null);
    try {
      const [topicsRes, analyticsRes, aiRes] = await Promise.all([
        apiClient.get("/cs-automation/topics"),
        apiClient.get("/cs-automation/analytics"),
        apiClient.get("/cs-automation/ai-status").catch(() => ({ data: null })),
      ]);

      if (aiRes.data?.data) {
        setAiStatus(aiRes.data.data);
      }

      if (topicsRes.data?.data?.topics) {
        setTopics(topicsRes.data.data.topics);
        if (topicsRes.data.data.topics.length > 0) {
          const first = topicsRes.data.data.topics[0];
          setSelectedTopicId(first.id);
          if (first.subTopics?.length > 0) {
            setSelectedSubTopic(first.subTopics[0]);
          }
        }
      }

      if (analyticsRes.data?.data) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load CS Automation data:", err);
      setErrorMessage("Could not connect to the CS Automation service. Please try again.");
    } finally {
      setPageLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.get("/cs-automation/sessions");
      if (res.data?.data?.sessions) {
        setHistorySessions(res.data.data.sessions);
      }
    } catch (err) {
      console.error("Failed to fetch CS sessions history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    } else if (activeTab === "matrix") {
      apiClient.get("/cs-automation/analytics").then((res) => {
        if (res.data?.data) setAnalytics(res.data.data);
      });
    }
  }, [activeTab]);

  // Evaluation Modal Close Handler
  const handleCloseEvaluationModal = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setShowEvaluationModal(false);
  };

  // Close evaluation modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showEvaluationModal) {
        handleCloseEvaluationModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showEvaluationModal]);

  // Selected Topic Object
  const currentTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId) || topics[0];
  }, [topics, selectedTopicId]);

  // When selected topic changes, reset subtopic
  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    const found = topics.find((t) => t.id === topicId);
    if (found && found.subTopics?.length > 0) {
      setSelectedSubTopic(found.subTopics[0]);
    } else {
      setSelectedSubTopic("General");
    }
  };

  /* =========================================
     TIMER EFFECT
  ========================================= */

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [timerSeconds]);

  // Pressure Mode Countdown Timer & Mid-Interview AI Check-in
  useEffect(() => {
    let timer: any = null;
    if (session && isPressureMode && pressureSecondsLeft > 0) {
      timer = setInterval(() => {
        setPressureSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          // Mid-interview check at 12 minutes (720 seconds)
          if (prev === 12 * 60 && !hasTriggeredMidCheck) {
            setHasTriggeredMidCheck(true);
            setShowMidCheckModal(true);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [session, isPressureMode, pressureSecondsLeft, hasTriggeredMidCheck]);

  const formattedPressureTimer = useMemo(() => {
    const mins = Math.floor(pressureSecondsLeft / 60);
    const secs = pressureSecondsLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [pressureSecondsLeft]);

  const activePersonaMeta = useMemo(() => {
    return (
      INTERVIEWER_PERSONAS.find((p) => p.id === (session?.interviewerPersona || selectedPersona)) ||
      INTERVIEWER_PERSONAS[0]
    );
  }, [session?.interviewerPersona, selectedPersona]);

  const getRadarPoints = (): RadarDataPoint[] => {
    const defaultDomains = [
      { key: "data-structures", label: "Data Structures", color: "#6366f1" },
      { key: "algorithms", label: "Algorithms", color: "#ec4899" },
      { key: "operating-systems", label: "OS & Threads", color: "#3b82f6" },
      { key: "computer-networks", label: "Networks", color: "#06b6d4" },
      { key: "database-systems", label: "DBMS & SQL", color: "#10b981" },
      { key: "system-design", label: "System Design", color: "#f59e0b" },
      { key: "oop-design-patterns", label: "OOP Patterns", color: "#8b5cf6" },
      { key: "cybersecurity", label: "Cybersecurity", color: "#ef4444" },
    ];

    return defaultDomains.map((d) => {
      const found = analytics?.skillMatrix?.find((s) => s.topicId === d.key);
      const score = found ? found.masteryScore : 72;
      return {
        domainKey: d.key,
        label: d.label,
        score,
        color: d.color,
      };
    });
  };

  const get7DayStudyPlan = () => {
    const radar = getRadarPoints();
    const sorted = [...radar].sort((a, b) => a.score - b.score);
    const weak1 = sorted[0]?.label || "Data Structures";
    const weak2 = sorted[1]?.label || "Algorithms";

    return [
      {
        day: 1,
        title: `Core Remediation: ${weak1} Fundamentals`,
        focus: `Deep-dive into underlying pointer manipulation and boundary conditions in ${weak1}.`,
        tasks: [
          `Review amortized time vs worst-case space complexity in ${weak1}`,
          `Solve 2 Intermediate Challenge problems in ${weak1}`,
          `Trace algorithm pointers step-by-step in Memory Visualizer`,
        ],
      },
      {
        day: 2,
        title: `Edge Case Mastery & Memory Safety`,
        focus: `Handling empty inputs, integer overflow, cyclic references, and memory leaks.`,
        tasks: [
          `Test edge cases: null pointers, single elements, negative inputs`,
          `Write unit test runner assertions for all custom corner cases`,
        ],
      },
      {
        day: 3,
        title: `Secondary Domain Reinforcement: ${weak2}`,
        focus: `Targeting weaknesses identified in ${weak2} evaluations.`,
        tasks: [
          `Solve 2 Deep Dive sessions focusing on algorithmic efficiency`,
          `Explain solutions verbally using Voice Dictation mode`,
        ],
      },
      {
        day: 4,
        title: `Systems Architecture & Whiteboard Practice`,
        focus: `Practice architectural and tree/graph diagramming.`,
        tasks: [
          `Diagram a high-concurrency architecture on the Interactive Whiteboard`,
          `Export diagram as PNG and review component boundaries`,
        ],
      },
      {
        day: 5,
        title: `FAANG Pressure Mode Drills`,
        focus: `Working effectively under strict time constraints.`,
        tasks: [
          `Complete two 25-minute timed sessions with Pressure Mode ON`,
          `Respond to the mid-interview check-in without losing composure`,
        ],
      },
      {
        day: 6,
        title: `Blind Audio-Only Phone Screen Simulation`,
        focus: `Verbal technical communication and mental algorithm visualization.`,
        tasks: [
          `Complete 1 session in Blind Audio-Only mode with zero code sheet peaking`,
          `Articulate time & space complexity trade-offs verbally`,
        ],
      },
      {
        day: 7,
        title: `Full FAANG Exam Simulation & Certification`,
        focus: `Comprehensive multi-topic test and credential achievement.`,
        tasks: [
          `Attempt the 4-Question Exam Mode under your chosen FAANG persona`,
          `Achieve 80%+ overall score to generate your Holberton / InterviewIQ Certificate`,
        ],
      },
    ];
  };

  /* =========================================
     START SESSION
  ========================================= */

  const handleStartSession = async () => {
    setStartLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.post("/cs-automation/start", {
        topic: selectedTopicId,
        subTopic: selectedSubTopic,
        difficulty: selectedDifficulty,
        mode: selectedMode,
        interviewerPersona: selectedPersona,
        isPressureMode,
        isBlindMode,
      });

      if (res.data?.data?.session) {
        const newSession = res.data.data.session;
        if (!newSession.questions || newSession.questions.length === 0) {
          newSession.questions = newSession.currentQuestion ? [newSession.currentQuestion] : [];
        }
        setSession(newSession);
        setCurrentQuestionIndex(0);
        const firstQ = newSession.questions?.[0] || newSession.currentQuestion;
        const defaultBoilerplate = firstQ?.codeSnippet?.trim()
          ? firstQ.codeSnippet
          : `/*\n * Problem: ${firstQ?.title || "Həll"}\n * Zəhmət olmasa izahınızı və ya həll kodunuzu bura qeyd edin:\n */\n`;
        setUserAnswer(defaultBoilerplate);
        setUserTimeComplexity(firstQ?.expectedComplexity?.time || "O(n)");
        setUserSpaceComplexity(firstQ?.expectedComplexity?.space || "O(1)");
        setUnlockedHints([]);
        setTimerSeconds(0);
        setIsTimerRunning(true);
        setLastEvaluation(null);
        setShowEvaluationModal(false);
        setSubmitWarning(null);
        setTestResults(null);
        setActiveTestTab(0);

        if (window.innerWidth <= 768 || firstQ?.language === "text") {
          setEditorMode("text");
        } else {
          setEditorMode("monaco");
        }

        if (isPressureMode) {
          setPressureSecondsLeft(25 * 60);
          setHasTriggeredMidCheck(false);
          setShowMidCheckModal(false);
        }
      }
    } catch (err: any) {
      console.error("Start session error:", err);
      setErrorMessage(err.response?.data?.message || "Failed to start CS Automation session.");
    } finally {
      setStartLoading(false);
    }
  };

  /* =========================================
     HINT REQUEST
  ========================================= */

  const handleRequestHint = async () => {
    if (!session) return;
    const nextLevel = unlockedHints.length + 1;
    if (nextLevel > 3) return;

    setHintLoading(true);
    try {
      const res = await apiClient.post("/cs-automation/hint", {
        sessionId: session._id,
        questionIndex: currentQuestionIndex,
        hintLevel: nextLevel,
      });

      if (res.data?.data?.hint) {
        setUnlockedHints((prev) => [
          ...prev,
          { level: nextLevel, text: res.data.data.hint },
        ]);
      }
    } catch (err) {
      console.error("Hint request error:", err);
    } finally {
      setHintLoading(false);
    }
  };

  /* =========================================
     SUBMIT ANSWER
  ========================================= */

  const handleSubmitAnswer = async () => {
    if (!session) {
      setSubmitWarning("Aktiv sessiya tapılmadı. Zəhmət olmasa sessiyanı başladın.");
      return;
    }
    if (!userAnswer.trim()) {
      setSubmitWarning("⚠️ Zəhmət olmasa kod redaktoruna həllinizi və ya izahınızı daxil edin. Boş cavab qiymətləndirilə bilməz.");
      if (window.innerWidth <= 768) {
        setEditorMode("text");
      }
      return;
    }

    setSubmitWarning(null);
    setIsEvaluating(true);
    setIsTimerRunning(false);
    setErrorMessage(null);
    setEvalProgressText("Parsing Code Logic...");

    const progressSteps = [
      "Parsing Code Logic...",
      "Analyzing Big-O Time & Space...",
      "Evaluating Edge Cases...",
      "Synthesizing FAANG Review...",
    ];
    let stepIndex = 0;
    const progressTimer = setInterval(() => {
      stepIndex = (stepIndex + 1) % progressSteps.length;
      setEvalProgressText(progressSteps[stepIndex]);
    }, 1100);

    try {
      const res = await apiClient.post("/cs-automation/submit-answer", {
        sessionId: session._id,
        questionIndex: currentQuestionIndex,
        answer: userAnswer,
        userTimeComplexity,
        userSpaceComplexity,
        timeSpentSeconds: timerSeconds,
      });

      if (res.data?.data) {
        const evalData = res.data.data.evaluation;
        setLastEvaluation(evalData);
        setShowEvaluationModal(true);

        if (res.data.data.session) {
          setSession(res.data.data.session);
        }

        // Refresh analytics in background
        apiClient.get("/cs-automation/analytics").then((aRes) => {
          if (aRes.data?.data) setAnalytics(aRes.data.data);
        });
      }
    } catch (err: any) {
      console.error("Submit answer error:", err);
      const msg = err.response?.data?.message || "Evaluation failed. Please try again.";
      setErrorMessage(msg);
      setSubmitWarning(msg);
      setIsTimerRunning(true);
    } finally {
      clearInterval(progressTimer);
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (!session) return;
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < session.questions.length) {
      setCurrentQuestionIndex(nextIdx);
      const nextQ = session.questions[nextIdx];
      const defaultBoilerplate = nextQ?.codeSnippet?.trim()
        ? nextQ.codeSnippet
        : `/*\n * Problem: ${nextQ?.title || "Həll"}\n * Zəhmət olmasa izahınızı və ya həll kodunuzu bura qeyd edin:\n */\n`;
      setUserAnswer(defaultBoilerplate);
      setUserTimeComplexity(nextQ?.expectedComplexity?.time || "O(n)");
      setUserSpaceComplexity(nextQ?.expectedComplexity?.space || "O(1)");
      setUnlockedHints([]);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      setShowEvaluationModal(false);
      setSubmitWarning(null);
      setLastEvaluation(null);
      setTestResults(null);
      setActiveTestTab(0);
      stopSpeaking();
      setIsSpeaking(false);
      if (speechRecognizerRef.current) speechRecognizerRef.current.stop();
      setIsListening(false);

      if (window.innerWidth <= 768 || nextQ?.language === "text") {
        setEditorMode("text");
      }
    } else {
      setShowEvaluationModal(false);
    }
  };

  const handleResetSession = () => {
    setSession(null);
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setUnlockedHints([]);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setShowEvaluationModal(false);
    setLastEvaluation(null);
    setTestResults(null);
    setActiveTestTab(0);
    stopSpeaking();
    setIsSpeaking(false);
    if (speechRecognizerRef.current) speechRecognizerRef.current.stop();
    setIsListening(false);
  };

  const copyOptimalCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stop();
      }
    };
  }, []);

  const handleToggleSpeakQuestion = () => {
    if (!currentQ) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const textToRead = `${currentQ.title}. ${currentQ.questionText}`;
    speakText(
      textToRead,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleToggleSpeakFeedback = () => {
    if (!lastEvaluation) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const strengthsText = lastEvaluation.strengths?.length
      ? `Key strengths: ${lastEvaluation.strengths.join(". ")}.`
      : "";
    const improvementsText = lastEvaluation.weaknesses?.length
      ? `Recommendations: ${lastEvaluation.weaknesses.join(". ")}.`
      : "";
    const textToRead = `Overall score: ${lastEvaluation.score} out of 100. ${lastEvaluation.feedback}. ${strengthsText} ${improvementsText}`;

    speakText(
      textToRead,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleChangeDictationLang = (newLang: "az-AZ" | "en-US" | "ru-RU") => {
    setDictationLanguage(newLang);
    if (speechRecognizerRef.current) {
      speechRecognizerRef.current.setLanguage(newLang);
    }
  };

  const handleToggleVoiceDictation = async () => {
    setDictationError(null);

    if (isListening) {
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stop();
      }
      setIsListening(false);
      setInterimSpeech("");
      return;
    }

    speechRecognizerRef.current = new SpeechRecognizer(
      (finalText, interimText) => {
        if (finalText && finalText.trim()) {
          setUserAnswer((prev) => (prev ? `${prev} ${finalText.trim()}` : finalText.trim()));
          setInterimSpeech("");
        } else if (interimText) {
          setInterimSpeech(interimText);
        }
      },
      (errMsg) => {
        setDictationError(errMsg);
        setInterimSpeech("");
      },
      (listening) => {
        setIsListening(listening);
        if (!listening) setInterimSpeech("");
      },
      dictationLanguage
    );

    const res = await speechRecognizerRef.current.start();
    if (!res.success) {
      setDictationError(res.error || "Mikrofon xətası baş verdi.");
      setIsListening(false);
    }
  };

  const handleRunTests = () => {
    if (!currentQ) return;
    setIsRunningTests(true);
    try {
      const cases =
        currentQ.testCases && currentQ.testCases.length > 0
          ? currentQ.testCases
          : [
              {
                id: "tc_default",
                input: "true",
                expectedOutput: "true",
                explanation: "Syntax & Compilation sanity check.",
              },
            ];

      const res = runJavaScriptTestCases(userAnswer, cases);
      setTestResults(res);
      setActiveTestTab(0);
    } catch (err) {
      console.error("Test execution failed:", err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleDownloadCertificate = (s?: CsSession | null) => {
    const targetSession = s || session;
    if (!targetSession) return;

    const user = getStoredUser();
    const candidateName = user?.fullName || "Holberton Student";
    const candidateEmail = user?.email || "";
    const score = targetSession.overallScore || lastEvaluation?.score || 85;

    generateCsCertificate({
      candidateName,
      candidateEmail,
      topic: targetSession.topic,
      subTopic: targetSession.subTopic,
      difficulty: targetSession.difficulty,
      mode: targetSession.mode,
      overallScore: score,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      certificateId: `HIQ-${targetSession._id ? targetSession._id.slice(-8).toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      totalQuestions: targetSession.questions?.length || 1,
      timeSpentMinutes: Math.max(1, Math.round((targetSession.timeSpentSeconds || timerSeconds) / 60)),
      summaryReport: targetSession.summaryReport || {
        strengths: lastEvaluation?.strengths || ["Solid understanding of core algorithmic structures."],
        improvements: lastEvaluation?.weaknesses || ["Deepen edge case analysis and asymptotic boundaries."],
        recommendedTopics: [targetSession.topic, "Algorithms & Data Structures"],
      },
    });
  };

  const currentQ: CsQuestion | undefined = session?.questions?.[currentQuestionIndex];

  return (
    <div className="cs-automation-page">
      {/* =========================================
          PAGE HEADER
      ========================================= */}
      <header className="cs-page-header">
        <div className="header-text">
          <span className="page-eyebrow">AI-POWERED COMPUTER SCIENCE AUTOMATION</span>
          <h1>
            CS Interview & Exam <span>Simulator</span>
          </h1>
          <p>
            Master Data Structures, Algorithms, Operating Systems, Computer Networks, DBMS, and System
            Design through automated AI evaluations, real-time complexity analysis, and progressive hints.
          </p>
        </div>

        {/* Header Quick Stats */}
        <div className="header-status-pill">
          <div className="status-icon-box">
            <FiZap />
          </div>
          <div className="status-meta">
            <span className="meta-label">Mastery Score</span>
            <strong className="meta-value">
              {analytics?.averageOverallScore ? `${analytics.averageOverallScore}%` : "85%"}
            </strong>
          </div>
          <div className="status-badge">
            <FiCheckCircle /> CS PRO
          </div>
        </div>

        {/* AI Engine Status Pill */}
        <div className="header-status-pill ai-engine-pill" style={{ borderColor: aiStatus?.localLlmOnline ? "rgba(16, 185, 129, 0.4)" : "rgba(59, 130, 246, 0.4)" }}>
          <div className="status-icon-box" style={{ background: aiStatus?.localLlmOnline ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)", color: aiStatus?.localLlmOnline ? "#10b981" : "#3b82f6" }}>
            <FiCpu />
          </div>
          <div className="status-meta">
            <span className="meta-label">AI Engine</span>
            <strong className="meta-value" style={{ fontSize: "0.82rem" }}>
              {aiStatus?.localLlmOnline ? "Local RTX 3050" : "Gemini Cloud"}
            </strong>
          </div>
          <div className="status-badge" style={{ background: aiStatus?.localLlmOnline ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.2)", color: aiStatus?.localLlmOnline ? "#10b981" : "#60a5fa" }}>
            {aiStatus?.localLlmOnline ? "Qwen-2.5-Coder" : "Flash-Lite"}
          </div>
        </div>
      </header>

      {/* =========================================
          NAV TABS
      ========================================= */}
      <div className="cs-nav-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === "arena" ? "active" : ""}`}
          onClick={() => setActiveTab("arena")}
        >
          <FiTerminal />
          <span>Automation Arena</span>
          {session && <span className="live-dot" />}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "matrix" ? "active" : ""}`}
          onClick={() => setActiveTab("matrix")}
        >
          <FiBarChart2 />
          <span>Skill Matrix & Analytics</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <FiBookOpen />
          <span>Session History</span>
        </button>
      </div>

      {errorMessage && (
        <div className="cs-error-banner">
          <FiAlertCircle />
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)}>
            Dismiss
          </button>
        </div>
      )}

      {pageLoading && (
        <div className="loading-state" style={{ marginBottom: "20px" }}>
          <FiRefreshCw className="spin" /> Initializing CS Automation Environment...
        </div>
      )}

      {/* =========================================================
          TAB 1: AUTOMATION ARENA
      ========================================================= */}
      {activeTab === "arena" && (
        <div className="arena-wrapper">
          {!session ? (
            /* CONFIGURATION & TOPIC SELECTOR */
            <div className="arena-config-view">
              {/* Domain Cards Grid */}
              <div className="section-title-row">
                <h2>1. Select Computer Science Domain</h2>
                <span className="badge-count">{topics.length} Domains Available</span>
              </div>

              <div className="topics-grid">
                {topics.map((t) => {
                  const isSelected = t.id === selectedTopicId;
                  return (
                    <div
                      key={t.id}
                      className={`topic-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleTopicChange(t.id)}
                    >
                      <div className="card-top">
                        <div className="topic-icon">
                          {TOPIC_ICON_MAP[t.id] || <FiCpu />}
                        </div>
                        <span className="topic-category">{t.category}</span>
                      </div>
                      <h3>{t.name}</h3>
                      <p>{t.description}</p>
                      <div className="card-subtopics-count">
                        <span>{t.subTopics.length} Core Modules</span>
                        {isSelected && <FiCheck className="check-icon" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtopic & Mode Selection Row */}
              <div className="config-dual-grid">
                {/* Subtopics selector */}
                <div className="config-card">
                  <div className="config-card-header">
                    <FiGitBranch />
                    <h3>2. Focus Sub-Topic</h3>
                  </div>
                  <p className="config-hint">Select a specific area of {currentTopic?.name}:</p>
                  <div className="subtopic-pills">
                    {currentTopic?.subTopics?.map((sub) => {
                      const isSubSelected = sub === selectedSubTopic;
                      return (
                        <button
                          key={sub}
                          type="button"
                          className={`subtopic-pill ${isSubSelected ? "active" : ""}`}
                          onClick={() => setSelectedSubTopic(sub)}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mode & Difficulty */}
                <div className="config-card">
                  <div className="config-card-header">
                    <FiActivity />
                    <h3>3. Execution Mode & Difficulty</h3>
                  </div>

                  <div className="mode-selector">
                    <div
                      className={`mode-option ${selectedMode === "challenge" ? "active" : ""}`}
                      onClick={() => setSelectedMode("challenge")}
                    >
                      <div className="mode-radio" />
                      <div>
                        <strong>⚡ Sprint Challenge</strong>
                        <span>1 fast problem, instant AI grading</span>
                      </div>
                    </div>

                    <div
                      className={`mode-option ${selectedMode === "deep_dive" ? "active" : ""}`}
                      onClick={() => setSelectedMode("deep_dive")}
                    >
                      <div className="mode-radio" />
                      <div>
                        <strong>📚 Topic Deep-Dive</strong>
                        <span>2 multi-faceted theory & code problems</span>
                      </div>
                    </div>

                    <div
                      className={`mode-option ${selectedMode === "exam" ? "active" : ""}`}
                      onClick={() => setSelectedMode("exam")}
                    >
                      <div className="mode-radio" />
                      <div>
                        <strong>🎓 Full CS Mock Exam</strong>
                        <span>4 comprehensive algorithmic & systems problems</span>
                      </div>
                    </div>
                  </div>

                  <div className="difficulty-row">
                    <label>Difficulty Tier:</label>
                    <div className="difficulty-pills">
                      {(["beginner", "intermediate", "advanced", "senior"] as CsDifficulty[]).map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`diff-pill ${d} ${selectedDifficulty === d ? "active" : ""}`}
                          onClick={() => setSelectedDifficulty(d)}
                        >
                          {d.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. FAANG Interviewer Persona Selector */}
              <div className="config-card personas-config-section">
                <div className="config-card-header">
                  <FiCpu />
                  <h3>4. Choose FAANG Interviewer Persona</h3>
                </div>
                <p className="config-hint">
                  Select your simulated technical interviewer. Each persona challenges you with distinct industry evaluation criteria:
                </p>

                <div className="personas-grid">
                  {INTERVIEWER_PERSONAS.map((persona) => {
                    const isPersonaSelected = selectedPersona === persona.id;
                    return (
                      <div
                        key={persona.id}
                        className={`persona-card ${isPersonaSelected ? "selected" : ""}`}
                        onClick={() => setSelectedPersona(persona.id)}
                      >
                        <div className="persona-top">
                          <span className="persona-avatar">{persona.avatar}</span>
                          <span
                            className="company-badge"
                            style={{ backgroundColor: `${persona.color}15`, color: persona.color }}
                          >
                            {persona.company}
                          </span>
                        </div>
                        <h4>{persona.name}</h4>
                        <span className="persona-title">{persona.badge}</span>
                        <p className="persona-quote">"{persona.promptQuote}"</p>
                        <div className="persona-focus-tag">
                          <strong>Focus:</strong> {persona.evaluationFocus}
                        </div>
                        {isPersonaSelected && <FiCheck className="persona-check" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. Advanced Simulation Protocols (Pressure Mode & Blind Mode) */}
              <div className="config-card protocols-config-section">
                <div className="config-card-header">
                  <FiZap />
                  <h3>5. Advanced Interview Protocols</h3>
                </div>
                <p className="config-hint">
                  Elevate the realism of your practice with industry-standard simulation constraints:
                </p>

                <div className="protocols-dual-grid">
                  {/* Pressure Mode Switch */}
                  <div
                    className={`protocol-box ${isPressureMode ? "active" : ""}`}
                    onClick={() => setIsPressureMode(!isPressureMode)}
                  >
                    <div className="protocol-switch">
                      <div className={`switch-toggle ${isPressureMode ? "checked" : ""}`} />
                    </div>
                    <div className="protocol-text">
                      <div className="protocol-title">
                        <FiClock />
                        <strong>FAANG Pressure Mode (25 Min Countdown)</strong>
                      </div>
                      <p>
                        Real-time ticking clock with visual urgency warnings and a mid-interview AI check-in to test your composure under deadline stress.
                      </p>
                    </div>
                  </div>

                  {/* Blind Phone Screen Switch */}
                  <div
                    className={`protocol-box ${isBlindMode ? "active" : ""}`}
                    onClick={() => setIsBlindMode(!isBlindMode)}
                  >
                    <div className="protocol-switch">
                      <div className={`switch-toggle ${isBlindMode ? "checked" : ""}`} />
                    </div>
                    <div className="protocol-text">
                      <div className="protocol-title">
                        <FiPhoneCall />
                        <strong>Blind Audio-Only Phone Screen</strong>
                      </div>
                      <p>
                        Screenless verbal tele-interview. AI speaks the problem and evaluates your verbal articulation, mental data structures, and trade-off analysis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Action Banner */}
              <div className="start-action-banner">
                <div className="banner-details">
                  <h4>Ready to initiate automated CS session?</h4>
                  <p>
                    Target: <strong>{currentTopic?.name}</strong> • Sub-topic:{" "}
                    <strong>{selectedSubTopic}</strong> • Difficulty:{" "}
                    <strong>{selectedDifficulty.toUpperCase()}</strong> • Interviewer:{" "}
                    <strong>
                      {activePersonaMeta.name} ({activePersonaMeta.company})
                    </strong>
                    {isPressureMode && <span className="banner-pill timed">⏱️ 25m Timed</span>}
                    {isBlindMode && <span className="banner-pill blind">🎧 Blind Audio Call</span>}
                  </p>
                </div>

                <button
                  type="button"
                  className="start-session-btn"
                  onClick={handleStartSession}
                  disabled={startLoading}
                >
                  {startLoading ? (
                    <>
                      <FiRefreshCw className="spin" /> Generating AI Challenge...
                    </>
                  ) : (
                    <>
                      <FiPlay /> Launch Automation Session <FiArrowRight />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE WORKSPACE / QUESTION SOLVING */
            <div className="arena-workspace">
              {/* Active Interviewer Persona Header Banner */}
              <div className="interviewer-active-banner">
                <div className="persona-info-left">
                  <span className="persona-avatar-icon">{activePersonaMeta.avatar}</span>
                  <div>
                    <div className="persona-meta-name">
                      <strong>{activePersonaMeta.name}</strong>
                      <span className="company-pill" style={{ color: activePersonaMeta.color }}>
                        {activePersonaMeta.company} • {activePersonaMeta.badge}
                      </span>
                    </div>
                    <p className="persona-prompt-quote">"{activePersonaMeta.promptQuote}"</p>
                  </div>
                </div>

                <div className="persona-focus-right">
                  <span className="focus-label">Evaluation Bias:</span>
                  <span className="focus-value">{activePersonaMeta.evaluationFocus}</span>
                </div>
              </div>

              {/* Top Session Status Bar */}
              <div className="workspace-header">
                <div className="session-breadcrumbs">
                  <span className="tag-topic">{session.topic.toUpperCase()}</span>
                  <FiChevronRight />
                  <span className="tag-subtopic">{session.subTopic}</span>
                  <FiChevronRight />
                  <span className="tag-question-count">
                    Question {currentQuestionIndex + 1} of {session?.questions?.length || 1}
                  </span>
                </div>

                <div className="session-controls">
                  {session.isPressureMode && (
                    <div
                      className={`pressure-timer-badge ${
                        pressureSecondsLeft <= 180
                          ? "critical"
                          : pressureSecondsLeft <= 600
                          ? "warning"
                          : ""
                      }`}
                      title="FAANG Pressure Mode Countdown"
                    >
                      <FiZap />
                      <span>{formattedPressureTimer}</span>
                    </div>
                  )}

                  <div className="timer-badge">
                    <FiClock />
                    <span>{formattedTimer}</span>
                  </div>

                  <button type="button" className="exit-btn" onClick={handleResetSession}>
                    Exit Arena
                  </button>
                </div>
              </div>

              {/* Mid-Interview AI Check-In Alert Banner */}
              {showMidCheckModal && (
                <div className="mid-check-banner">
                  <div className="mid-check-icon">
                    <FiAlertTriangle />
                  </div>
                  <div className="mid-check-content">
                    <strong>Mid-Interview Check from {activePersonaMeta.name}:</strong>
                    <p>
                      12 minutes remaining! Consider corner cases (e.g. empty arrays, duplicates, single elements) and confirm your algorithmic time and space complexity before submitting.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="dismiss-mid-check-btn"
                    onClick={() => setShowMidCheckModal(false)}
                  >
                    Acknowledged
                  </button>
                </div>
              )}

              {/* Blind Phone Screen Mode View or Standard 2-Column Engineering Layout */}
              {session.isBlindMode && editorMode !== "monaco" ? (
                <BlindInterviewMode
                  interviewerName={activePersonaMeta.name}
                  interviewerCompany={activePersonaMeta.company}
                  interviewerAvatar={activePersonaMeta.avatar}
                  isSpeaking={isSpeaking}
                  isListening={isListening}
                  interimSpeech={interimSpeech}
                  userAnswer={userAnswer}
                  onToggleSpeakQuestion={handleToggleSpeakQuestion}
                  onToggleVoiceDictation={handleToggleVoiceDictation}
                  onSwitchToCodeEditor={() => setEditorMode("monaco")}
                  onOpenWhiteboard={() => setEditorMode("whiteboard")}
                  onSubmitAnswer={handleSubmitAnswer}
                  isSubmitting={isEvaluating}
                />
              ) : (
                <div className="workspace-grid">
                {/* Left Column: Problem & Hints */}
                <div className="problem-panel">
                  <div className="problem-card">
                    <div className="problem-header-row">
                      <h2>{currentQ?.title || "Computer Science Problem"}</h2>
                      <div className="problem-header-actions">
                        <button
                          type="button"
                          className={`voice-listen-btn ${isSpeaking ? "active" : ""}`}
                          onClick={handleToggleSpeakQuestion}
                          title={isSpeaking ? "Stop AI Voice" : "Listen to Problem with AI Voice"}
                        >
                          {isSpeaking ? (
                            <>
                              <FiVolumeX />
                              <span className="sound-wave">
                                <span />
                                <span />
                                <span />
                              </span>
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <FiVolume2 />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        <span className={`diff-badge ${currentQ?.difficulty || selectedDifficulty}`}>
                          {(currentQ?.difficulty || selectedDifficulty).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="expected-meta-row">
                      <div className="meta-item">
                        <span>Expected Time:</span>
                        <code>{currentQ?.expectedComplexity?.time || "O(n)"}</code>
                      </div>
                      <div className="meta-item">
                        <span>Expected Space:</span>
                        <code>{currentQ?.expectedComplexity?.space || "O(1)"}</code>
                      </div>
                    </div>

                    <div className="problem-statement">
                      <p>{currentQ?.questionText}</p>
                    </div>

                    {/* Key Concepts Tags */}
                    {currentQ?.keyConcepts && currentQ.keyConcepts.length > 0 && (
                      <div className="key-concepts-section">
                        <h4>Core CS Concepts:</h4>
                        <div className="concepts-list">
                          {currentQ.keyConcepts.map((kc, i) => (
                            <span key={i} className="concept-tag">
                              {kc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hints Section */}
                  <div className="hints-card">
                    <div className="hints-card-header">
                      <div className="hints-title">
                        <FiHelpCircle />
                        <h3>AI Progressive Hints</h3>
                      </div>

                      <button
                        type="button"
                        className="request-hint-btn"
                        onClick={handleRequestHint}
                        disabled={hintLoading || unlockedHints.length >= 3}
                      >
                        {hintLoading ? (
                          <>
                            <FiRefreshCw className="spin" /> Thinking...
                          </>
                        ) : unlockedHints.length >= 3 ? (
                          "All Hints Unlocked (3/3)"
                        ) : (
                          `Request Hint (${unlockedHints.length}/3)`
                        )}
                      </button>
                    </div>

                    {unlockedHints.length === 0 ? (
                      <p className="no-hints-text">
                        Stuck? Ask for a progressive AI hint without forfeiting the full solution.
                      </p>
                    ) : (
                      <div className="unlocked-hints-list">
                        {unlockedHints.map((h) => (
                          <div key={h.level} className="hint-bubble">
                            <div className="hint-level-badge">Level {h.level} Hint</div>
                            <p>{h.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Code Editor & Complexity Submission */}
                <div className="editor-panel">
                  <div className="editor-card">
                    <div className="editor-top-bar">
                      <div className="editor-lang-tag">
                        <FiTerminal /> Engineering Workspace & Code
                      </div>

                      <div className="editor-controls-right">
                        {/* Voice Dictation Language Switcher */}
                        <div className="dictate-lang-selector" title="Diktə dili">
                          <button
                            type="button"
                            className={`lang-pill ${dictationLanguage === "az-AZ" ? "active" : ""}`}
                            onClick={() => handleChangeDictationLang("az-AZ")}
                            title="Azərbaycan dili"
                          >
                            AZ
                          </button>
                          <button
                            type="button"
                            className={`lang-pill ${dictationLanguage === "en-US" ? "active" : ""}`}
                            onClick={() => handleChangeDictationLang("en-US")}
                            title="English"
                          >
                            EN
                          </button>
                          <button
                            type="button"
                            className={`lang-pill ${dictationLanguage === "ru-RU" ? "active" : ""}`}
                            onClick={() => handleChangeDictationLang("ru-RU")}
                            title="Русский"
                          >
                            RU
                          </button>
                        </div>

                        {/* Voice Dictation Button */}
                        <button
                          type="button"
                          className={`voice-dictate-btn ${isListening ? "active" : ""}`}
                          onClick={handleToggleVoiceDictation}
                          title={isListening ? "Diktəni dayandır" : "Mikrofonla danışaraq cavab yaz"}
                        >
                          {isListening ? (
                            <>
                              <FiMicOff />
                              <span className="pulse-mic-dot" />
                              <span>Dinlənilir...</span>
                            </>
                          ) : (
                            <>
                              <FiMic />
                              <span>Dictate</span>
                            </>
                          )}
                        </button>

                        {/* Mode Switcher: Code, Whiteboard, Memory Visualizer, Text */}
                        <div className="editor-toggle-pills">
                          <button
                            type="button"
                            className={`editor-tab-btn ${editorMode === "monaco" ? "active" : ""}`}
                            onClick={() => setEditorMode("monaco")}
                          >
                            <FiCode /> Code Editor
                          </button>
                          <button
                            type="button"
                            className={`editor-tab-btn ${editorMode === "whiteboard" ? "active" : ""}`}
                            onClick={() => setEditorMode("whiteboard")}
                          >
                            <FiEdit3 /> Whiteboard
                          </button>
                          <button
                            type="button"
                            className={`editor-tab-btn ${editorMode === "visualizer" ? "active" : ""}`}
                            onClick={() => setEditorMode("visualizer")}
                          >
                            <FiCpu /> Visualizer
                          </button>
                          <button
                            type="button"
                            className={`editor-tab-btn ${editorMode === "text" ? "active" : ""}`}
                            onClick={() => setEditorMode("text")}
                          >
                            Text Area
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Speech Recognition Feedback Banner */}
                    {isListening && (
                      <div className="live-dictation-banner">
                        <div className="dictation-listening-indicator">
                          <span className="pulse-mic-dot" />
                          <strong>Mikrofon aktivdir ({dictationLanguage === "az-AZ" ? "Azərbaycanca" : dictationLanguage === "en-US" ? "English" : "Rusca"}):</strong>
                        </div>
                        <span className="live-speech-text">
                          {interimSpeech ? `"${interimSpeech}"` : "Danışın, dediyiniz sözlər canlı olaraq bura yazılacaq..."}
                        </span>
                      </div>
                    )}

                    {/* Dictation Error Alert Banner */}
                    {dictationError && (
                      <div className="dictation-error-banner">
                        <FiAlertCircle />
                        <span>{dictationError}</span>
                        <button
                          type="button"
                          className="close-error-btn"
                          onClick={() => setDictationError(null)}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {editorMode === "monaco" ? (
                      <CodeEditor
                        value={userAnswer}
                        onChange={setUserAnswer}
                        language={currentQ?.language || "javascript"}
                        onReset={() => setUserAnswer(currentQ?.codeSnippet || "")}
                        height="360px"
                      />
                    ) : editorMode === "whiteboard" ? (
                      <WhiteboardCanvas height="380px" />
                    ) : editorMode === "visualizer" ? (
                      <MemoryVisualizer />
                    ) : (
                      <textarea
                        className="code-input-area"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your solution, algorithm implementation, or architectural explanation here..."
                        rows={14}
                        spellCheck={false}
                      />
                    )}

                    {/* Interactive Test Cases Runner */}
                    <div className="test-runner-panel">
                      <div className="test-runner-header">
                        <div className="runner-title">
                          <FiPlay style={{ color: "#38bdf8" }} />
                          <h4>Interactive Test Cases</h4>
                          {testResults && (
                            <span className={`test-summary-pill ${testResults.allPassed ? "passed" : "failed"}`}>
                              {testResults.passedTests} / {testResults.totalTests} Passed
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="run-tests-btn"
                          onClick={handleRunTests}
                          disabled={isRunningTests || !userAnswer.trim()}
                        >
                          {isRunningTests ? (
                            <>
                              <FiRefreshCw className="spin" /> Running...
                            </>
                          ) : (
                            <>
                              <FiPlay /> Run Tests
                            </>
                          )}
                        </button>
                      </div>

                      <div className="test-cases-content">
                        {currentQ?.testCases && currentQ.testCases.length > 0 ? (
                          <>
                            <div className="test-case-nav-tabs">
                              {currentQ.testCases.map((_, idx) => {
                                const tr = testResults?.results?.[idx];
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    className={`tc-tab-btn ${activeTestTab === idx ? "active" : ""} ${
                                      tr ? (tr.passed ? "passed" : "failed") : ""
                                    }`}
                                    onClick={() => setActiveTestTab(idx)}
                                  >
                                    Case {idx + 1}
                                    {tr && (tr.passed ? <FiCheck className="tc-icon" /> : <FiAlertCircle className="tc-icon" />)}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="active-tc-details">
                              {(() => {
                                const tc = currentQ.testCases[activeTestTab] || currentQ.testCases[0];
                                const tr = testResults?.results?.[activeTestTab];

                                return (
                                  <div className="tc-box">
                                    <div className="tc-row">
                                      <span className="tc-label">Expression / Input:</span>
                                      <code>{tc.input}</code>
                                    </div>
                                    <div className="tc-row">
                                      <span className="tc-label">Expected Output:</span>
                                      <code className="expected">{tc.expectedOutput}</code>
                                    </div>
                                    {tr && (
                                      <div className="tc-row">
                                        <span className="tc-label">Actual Output:</span>
                                        <code className={tr.passed ? "actual-pass" : "actual-fail"}>
                                          {tr.actualOutput}
                                        </code>
                                        <span className="execution-time">⏱️ {tr.executionTimeMs} ms</span>
                                      </div>
                                    )}
                                    {tc.explanation && (
                                      <p className="tc-explanation">ℹ️ {tc.explanation}</p>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </>
                        ) : (
                          <div className="tc-box empty">
                            <p>Write your code and click "Run Tests" to run automated syntax and validation checks.</p>
                            {testResults && testResults.results[0] && (
                              <div className="tc-row">
                                <span className="tc-label">Execution Status:</span>
                                <code className={testResults.results[0].passed ? "actual-pass" : "actual-fail"}>
                                  {testResults.results[0].actualOutput}
                                </code>
                                <span className="execution-time">⏱️ {testResults.results[0].executionTimeMs} ms</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Complexity Selectors */}
                    <div className="complexity-selectors-row">
                      <div className="complexity-group">
                        <label>Your Stated Time Complexity:</label>
                        <select
                          value={userTimeComplexity}
                          onChange={(e) => setUserTimeComplexity(e.target.value)}
                        >
                          {COMPLEXITY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="complexity-group">
                        <label>Your Stated Space Complexity:</label>
                        <select
                          value={userSpaceComplexity}
                          onChange={(e) => setUserSpaceComplexity(e.target.value)}
                        >
                          {COMPLEXITY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Inline Submit Warning & Quick Starter Helper */}
                    {submitWarning && (
                      <div
                        className="submit-warning-banner"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "#fffbeb",
                          border: "1.5px solid #fde68a",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          color: "#92400e",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          gap: "10px",
                          marginTop: "8px",
                          marginBottom: "4px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <FiAlertCircle style={{ color: "#d97706", fontSize: "1.2rem", flexShrink: 0 }} />
                          <span>{submitWarning}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const starter = `// Problem: ${currentQ?.title || "Həll"}\n// İzah və ya kod nümunəsi:\nfunction solve() {\n  return true;\n}`;
                            setUserAnswer(starter);
                            setSubmitWarning(null);
                          }}
                          style={{
                            background: "#d97706",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "5px 12px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Nümunə Kod Əlavə Et
                        </button>
                      </div>
                    )}

                    {/* Submit Bar */}
                    <div className="editor-footer">
                      <div className="footer-left">
                        <span>Characters: {userAnswer.length}</span>
                      </div>

                      <button
                        type="button"
                        className="submit-eval-btn"
                        onClick={handleSubmitAnswer}
                        disabled={isEvaluating}
                      >
                        {isEvaluating ? (
                          <>
                            <FiRefreshCw className="spin" /> {evalProgressText}
                          </>
                        ) : (
                          <>
                            <FiCheckCircle /> Submit for Automated Evaluation
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 2: CS SKILL MATRIX & ANALYTICS
      ========================================================= */}
      {activeTab === "matrix" && (
        <div className="matrix-wrapper">
          {/* Top Metric Cards */}
          <div className="matrix-metrics-grid">
            <div className="matrix-metric-card">
              <div className="metric-icon-wrap blue">
                <FiCheckCircle />
              </div>
              <div className="metric-info">
                <span>Completed Sessions</span>
                <strong>{analytics?.totalCompletedSessions || 0}</strong>
              </div>
            </div>

            <div className="matrix-metric-card">
              <div className="metric-icon-wrap purple">
                <FiAward />
              </div>
              <div className="metric-info">
                <span>Average CS Score</span>
                <strong>{analytics?.averageOverallScore ? `${analytics.averageOverallScore}%` : "0%"}</strong>
              </div>
            </div>

            <div className="matrix-metric-card">
              <div className="metric-icon-wrap green">
                <FiZap />
              </div>
              <div className="metric-info">
                <span>Strongest Domain</span>
                <strong>{analytics?.strongestTopic?.topicName || "DSA"}</strong>
              </div>
            </div>

            <div className="matrix-metric-card">
              <div className="metric-icon-wrap orange">
                <FiActivity />
              </div>
              <div className="metric-info">
                <span>Total Questions Solved</span>
                <strong>{analytics?.totalQuestionsSolved || 0}</strong>
              </div>
            </div>
          </div>

          {/* AI Focus Recommendation */}
          {analytics?.recommendedFocus && (
            <div className="recommendation-card">
              <div className="rec-icon">
                <FiZap />
              </div>
              <div className="rec-text">
                <h4>AI Recommended Focus</h4>
                <p>{analytics.recommendedFocus}</p>
              </div>
              <button
                type="button"
                className="rec-action-btn"
                onClick={() => {
                  setActiveTab("arena");
                  if (analytics.weakestTopic) {
                    setSelectedTopicId(analytics.weakestTopic.topicId);
                  }
                }}
              >
                Practice Now <FiArrowRight />
              </button>
            </div>
          )}

          {/* 360° Radar Chart Section */}
          <div className="radar-chart-section">
            <RadarChart data={getRadarPoints()} size={380} />
          </div>

          {/* Mastery Breakdown Bars */}
          <div className="mastery-table-card">
            <div className="card-head">
              <h3>Computer Science Domain Mastery Matrix</h3>
              <p>Real-time competency assessment across all fundamental CS areas</p>
            </div>

            <div className="skill-bars-list">
              {analytics?.skillMatrix?.map((skill) => (
                <div key={skill.topicId} className="skill-bar-item">
                  <div className="skill-bar-meta">
                    <div className="skill-title-wrap">
                      <span className="skill-topic-icon">
                        {TOPIC_ICON_MAP[skill.topicId] || <FiCpu />}
                      </span>
                      <strong>{skill.topicName}</strong>
                    </div>

                    <div className="skill-stats">
                      <span className="skill-count">{skill.completedCount} Sessions</span>
                      <span className="skill-percent">{skill.masteryScore}%</span>
                    </div>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.max(5, skill.masteryScore)}%`,
                        background:
                          skill.masteryScore >= 80
                            ? "linear-gradient(90deg, #10b981, #059669)"
                            : skill.masteryScore >= 60
                            ? "linear-gradient(90deg, #6366f1, #4f46e5)"
                            : "linear-gradient(90deg, #f59e0b, #d97706)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 7-Day Personalized Study Roadmap */}
          <div className="study-plan-card">
            <div className="study-plan-header">
              <div className="plan-title-group">
                <div className="plan-icon-wrap">
                  <FiCalendar />
                </div>
                <div>
                  <h3>AI 7-Day Personalized CS Preparation Roadmap</h3>
                  <p>Algorithmic strategy generated based on your real-time 360° mastery gaps</p>
                </div>
              </div>
              <button
                type="button"
                className="start-today-btn"
                onClick={() => {
                  setActiveTab("arena");
                  const sorted = [...getRadarPoints()].sort((a, b) => a.score - b.score);
                  if (sorted[0]) setSelectedTopicId(sorted[0].domainKey);
                }}
              >
                Launch Day 1 Drills <FiArrowRight />
              </button>
            </div>

            <div className="study-days-grid">
              {get7DayStudyPlan().map((dayItem) => (
                <div key={dayItem.day} className={`study-day-box day-${dayItem.day}`}>
                  <div className="day-number-badge">Day {dayItem.day}</div>
                  <h4>{dayItem.title}</h4>
                  <p className="day-focus">{dayItem.focus}</p>
                  <ul className="day-tasks-list">
                    {dayItem.tasks.map((task, tIdx) => (
                      <li key={tIdx}>
                        <FiCheckCircle className="task-check" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: SESSION HISTORY
      ========================================================= */}
      {activeTab === "history" && (
        <div className="history-wrapper">
          <div className="history-header">
            <h3>Completed Automation Sessions</h3>
            <p>Review past challenges, AI feedback, time complexity verdicts, and optimal solutions.</p>
          </div>

          {historyLoading ? (
            <div className="loading-state">
              <FiRefreshCw className="spin" /> Loading your session history...
            </div>
          ) : historySessions.length === 0 ? (
            <div className="empty-history-state">
              <FiBookOpen className="empty-icon" />
              <h4>No CS sessions recorded yet</h4>
              <p>Launch your first automated CS challenge in the arena to start building your portfolio.</p>
              <button
                type="button"
                className="start-session-btn"
                onClick={() => setActiveTab("arena")}
              >
                Go to Arena
              </button>
            </div>
          ) : (
            <div className="history-cards-grid">
              {historySessions.map((hs) => (
                <div key={hs._id} className="history-card">
                  <div className="history-card-top">
                    <div className="h-topic-badge">
                      {TOPIC_ICON_MAP[hs.topic] || <FiCpu />}
                      <span>{hs.topic.toUpperCase()}</span>
                    </div>
                    <span className={`h-score-badge ${hs.overallScore && hs.overallScore >= 75 ? "high" : "med"}`}>
                      {hs.overallScore ? `${hs.overallScore}%` : "In Progress"}
                    </span>
                  </div>

                  <h4>{hs.subTopic || "General Topic Practice"}</h4>

                  <div className="history-meta-row">
                    <span>Mode: {hs.mode}</span>
                    <span>•</span>
                    <span>{hs.difficulty}</span>
                    <span>•</span>
                    <span>{hs.questions?.length || 1} Question(s)</span>
                  </div>

                  {hs.summaryReport?.strengths && hs.summaryReport.strengths.length > 0 && (
                    <div className="history-strengths">
                      <strong>Key Strengths:</strong>
                      <ul>
                        {hs.summaryReport.strengths.slice(0, 2).map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="history-card-footer">
                    <span className="date-text">
                      {hs.createdAt ? new Date(hs.createdAt).toLocaleDateString() : ""}
                    </span>

                    {hs.overallScore && (
                      <button
                        type="button"
                        className="download-cert-btn"
                        onClick={() => handleDownloadCertificate(hs)}
                        title="Download Certificate PDF"
                      >
                        <FiDownload /> Certificate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          EVALUATION RESULTS MODAL
      ========================================================= */}
      {showEvaluationModal && lastEvaluation && (
        <div
          className="eval-modal-overlay"
          onClick={handleCloseEvaluationModal}
        >
          <div
            className="eval-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              className="eval-modal-close-btn"
              onClick={handleCloseEvaluationModal}
              title="Bağla (və ya kənara klikləyin)"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="eval-modal-header">
              <div className="score-ring-wrap">
                <div
                  className={`score-badge-circle ${
                    lastEvaluation.score >= 80 ? "green" : lastEvaluation.score >= 60 ? "blue" : "orange"
                  }`}
                >
                  <strong>{lastEvaluation.score}</strong>
                  <span>/ 100</span>
                </div>
                <div>
                  <h3>Automated AI Evaluation Complete</h3>
                  <p className="eval-subhead">
                    Detailed assessment of technical accuracy, Big-O efficiency, and conceptual depth.
                  </p>
                </div>
              </div>
            </div>

            {/* Score Pillars */}
            <div className="score-pillars-row">
              <div className="pillar-item">
                <span>Technical Accuracy</span>
                <strong>{lastEvaluation.technicalAccuracy}%</strong>
                <div className="mini-track">
                  <div
                    className="mini-fill"
                    style={{ width: `${lastEvaluation.technicalAccuracy}%` }}
                  />
                </div>
              </div>

              <div className="pillar-item">
                <span>Conceptual Depth</span>
                <strong>{lastEvaluation.conceptualDepth}%</strong>
                <div className="mini-track">
                  <div
                    className="mini-fill"
                    style={{ width: `${lastEvaluation.conceptualDepth}%` }}
                  />
                </div>
              </div>

              <div className="pillar-item">
                <span>Edge Cases Handling</span>
                <strong>{lastEvaluation.edgeCasesHandling}%</strong>
                <div className="mini-track">
                  <div
                    className="mini-fill"
                    style={{ width: `${lastEvaluation.edgeCasesHandling}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Complexity Verdicts */}
            <div className="complexity-verdicts-box">
              <div className="verdict-item">
                <strong>⏱️ Time Complexity:</strong>
                <span>{lastEvaluation.timeComplexityVerdict}</span>
              </div>
              <div className="verdict-item">
                <strong>📦 Space Complexity:</strong>
                <span>{lastEvaluation.spaceComplexityVerdict}</span>
              </div>
            </div>

            {/* Strengths & Weaknesses Grid */}
            <div className="feedback-dual-grid">
              <div className="feedback-card strengths">
                <h4>
                  <FiCheckCircle /> Strengths & Correct Logic
                </h4>
                <ul>
                  {lastEvaluation.strengths?.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="feedback-card weaknesses">
                <h4>
                  <FiAlertCircle /> Constructive Improvements
                </h4>
                <ul>
                  {lastEvaluation.weaknesses?.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Detailed Feedback Paragraph */}
            <div className="feedback-summary-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <h4 style={{ margin: 0 }}>Comprehensive Feedback:</h4>
                <button
                  type="button"
                  className={`voice-listen-btn mini ${isSpeaking ? "active" : ""}`}
                  onClick={handleToggleSpeakFeedback}
                  title={isSpeaking ? "Stop Voice" : "Listen to Feedback with AI Voice"}
                >
                  {isSpeaking ? (
                    <>
                      <FiVolumeX /> Stop Voice
                    </>
                  ) : (
                    <>
                      <FiVolume2 /> Listen to Feedback
                    </>
                  )}
                </button>
              </div>
              <p>{lastEvaluation.feedback}</p>
            </div>

            {/* Optimal Reference Solution Code */}
            {lastEvaluation.optimalSolution && (
              <div className="optimal-solution-box">
                <div className="solution-header">
                  <h4>💡 Optimal Reference Solution</h4>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={() => copyOptimalCode(lastEvaluation.optimalSolution || "")}
                  >
                    {copiedCode ? (
                      <>
                        <FiCheck /> Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy /> Copy Code
                      </>
                    )}
                  </button>
                </div>
                <pre className="code-block">
                  <code>{lastEvaluation.optimalSolution}</code>
                </pre>
              </div>
            )}

            {/* Adaptive Follow-up Question */}
            {lastEvaluation.followUpQuestion && (
              <div className="followup-box">
                <h4>🧠 Adaptive Follow-Up Question:</h4>
                <p>{lastEvaluation.followUpQuestion}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="eval-modal-actions">
              <button
                type="button"
                className="download-cert-modal-btn"
                onClick={() => handleDownloadCertificate(session)}
                title="Download Holberton / InterviewIQ Verified Certificate"
              >
                <FiDownload /> Download Holberton Certificate (PDF)
              </button>

              {session && currentQuestionIndex < session.questions.length - 1 ? (
                <button type="button" className="next-q-btn" onClick={handleNextQuestion}>
                  Proceed to Next Question <FiArrowRight />
                </button>
              ) : (
                <button
                  type="button"
                  className="finish-session-btn"
                  onClick={() => {
                    setShowEvaluationModal(false);
                    setActiveTab("matrix");
                  }}
                >
                  <FiAward /> Finish Session & View Skill Matrix
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsAutomationPage;
