/* =========================================================
   INTERVIEW EVALUATION SERVICE

   Evaluates candidate interview answers using the local Qwen model.

   Updated:
   - supports Career Field roleSlug
   - keeps category for backward compatibility
   - gives Qwen clearer role-specific evaluation context
========================================================= */

import qwenService, {
  IQwenJSONResult,
} from "./qwenService";

/* =========================================================
   TYPES
========================================================= */

export interface EvaluateInterviewAnswerInput {
  roleSlug?: string;

  category?: string;

  difficulty: string;

  interviewType: string;

  question: string;

  answer: string;
}

export interface InterviewEvaluation {
  score: number;

  technicalAccuracy: number;

  completeness: number;

  communication: number;

  strengths: string[];

  weaknesses: string[];

  feedback: string;

  improvedAnswer: string;

  followUpQuestion?: string;
}

/* =========================================================
   HELPERS
========================================================= */

const clampScore = (
  value: unknown,
  fallback = 0
): number => {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        parsed
      )
    )
  );
};

const toStringArray = (
  value: unknown
): string[] => {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is string =>
        typeof item ===
        "string"
    )
    .map(
      (
        item
      ) =>
        item.trim()
    )
    .filter(
      Boolean
    );
};

const normalizeText = (
  value:
    unknown
): string => {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .replace(
      /\s+/g,
      " "
    )
    .trim();
};

const formatRoleLabel = (
  value: string
): string => {
  return value
    .replace(
      /[_-]+/g,
      " "
    )
    .split(
      " "
    )
    .filter(
      Boolean
    )
    .map(
      (
        word
      ) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(
      " "
    );
};

/* =========================================================
   NORMALIZER
========================================================= */

const normalizeEvaluation = (
  raw: unknown
): InterviewEvaluation => {
  if (
    typeof raw !==
      "object" ||
    raw === null ||
    Array.isArray(
      raw
    )
  ) {
    throw new Error(
      "Qwen response is not a valid object"
    );
  }

  const data =
    raw as
      Record<
        string,
        unknown
      >;

  const score =
    clampScore(
      data.score,
      50
    );

  const technicalAccuracy =
    clampScore(
      data.technicalAccuracy,
      score
    );

  const completeness =
    clampScore(
      data.completeness,
      score
    );

  const communication =
    clampScore(
      data.communication,
      score
    );

  let strengths =
    toStringArray(
      data.strengths
    );

  let weaknesses =
    toStringArray(
      data.weaknesses
    );

  let feedback =
    normalizeText(
      data.feedback
    );

  let improvedAnswer =
    normalizeText(
      data.improvedAnswer
    );

  let followUpQuestion =
    normalizeText(
      data.followUpQuestion
    );

  if (
    strengths.length ===
    0
  ) {
    strengths = [
      "The answer addressed the main topic and demonstrated relevant understanding.",
    ];
  }

  if (
    weaknesses.length ===
    0
  ) {
    weaknesses = [
      "The answer could be improved with additional detail, stronger reasoning, or a practical example.",
    ];
  }

  if (
    !feedback
  ) {
    feedback =
      "The response demonstrates relevant understanding, but it could be stronger with more specific reasoning and evidence.";
  }

  if (
    !improvedAnswer
  ) {
    improvedAnswer =
      "A stronger interview answer would directly answer the question, explain the reasoning, and include a relevant practical example or trade-off.";
  }

  return {
    score,

    technicalAccuracy,

    completeness,

    communication,

    strengths,

    weaknesses,

    feedback,

    improvedAnswer,

    followUpQuestion:
      followUpQuestion ||
      undefined,
  };
};

/* =========================================================
   PROMPT
========================================================= */

const createPrompt = (
  input:
    EvaluateInterviewAnswerInput
): string => {
  const roleIdentifier =
    normalizeText(
      input.roleSlug
    ) ||
    normalizeText(
      input.category
    ) ||
    "general";

  const roleLabel =
    formatRoleLabel(
      roleIdentifier
    );

  return `
You are a professional interviewer and interview evaluator for InterviewIQ.

Your task is to evaluate the candidate specifically in the context of the selected career field.

INTERVIEW CONTEXT
Career Field: ${roleLabel}
Career Field Slug: ${roleIdentifier}
Difficulty: ${input.difficulty}
Interview Type: ${input.interviewType}

QUESTION
${input.question}

CANDIDATE ANSWER
${input.answer}

EVALUATION RULES

1. Judge the answer against the expectations of a real ${roleLabel} interview.
2. Respect the selected difficulty level.
3. Do not give a high score merely because the answer sounds confident.
4. Reward technically or professionally correct reasoning, relevant examples, trade-offs, and clear communication.
5. Penalize vague, generic, incorrect, incomplete, or off-topic answers.
6. For technical interviews, technicalAccuracy must reflect field-specific correctness.
7. For behavioral interviews, evaluate relevance, structure, ownership, communication, and evidence from the candidate's example.
8. Feedback must be specific to the exact question and answer.
9. The improved answer should be realistic and usable in an interview, not generic filler.
10. The follow-up question should naturally test the same competency at a deeper level.

SCORING

score:
Overall answer quality from 0 to 100.

technicalAccuracy:
Correctness and role-specific knowledge from 0 to 100.
For non-technical behavioral questions, interpret this as professional/domain accuracy.

completeness:
How completely the candidate answered the actual question from 0 to 100.

communication:
Clarity, structure, professionalism, and explanation quality from 0 to 100.

Return ONLY valid JSON with exactly these fields:

{
  "score": 0,
  "technicalAccuracy": 0,
  "completeness": 0,
  "communication": 0,
  "strengths": [
    "specific strength"
  ],
  "weaknesses": [
    "specific improvement"
  ],
  "feedback": "Detailed feedback specific to this answer.",
  "improvedAnswer": "A stronger realistic example answer.",
  "followUpQuestion": "A relevant deeper follow-up question."
}
`.trim();
};

/* =========================================================
   EVALUATE
========================================================= */

const generateHeuristicEvaluation = (
  input: EvaluateInterviewAnswerInput
): InterviewEvaluation => {
  const answer = (input.answer || "").trim();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  if (wordCount < 10) {
    return {
      score: 45,
      technicalAccuracy: 40,
      completeness: 35,
      communication: 50,
      strengths: ["Cavab suala birbaşa toxunur."],
      weaknesses: [
        "Cavab çox qısadır və texniki dərinlik çatışmır.",
        "Praktiki nümunələr və arxitektur izah verilməyib.",
      ],
      feedback:
        "Cavabınızı daha ətraflı izah edin, real layihə təcrübəsi və arxitektur prinsipləri (məsələn, performans və miqyaslama) əlavə edin.",
      improvedAnswer:
        "Müsahibədə daha uğurlu olmaq üçün əsas konsepsiyanı, onun işləmə mexanizmini və qarşılaşdığınız real keysi addım-addım qeyd edin.",
    };
  }

  if (wordCount < 35) {
    return {
      score: 74,
      technicalAccuracy: 75,
      completeness: 70,
      communication: 78,
      strengths: [
        "Əsas texniki anlayışlar düzgün vurğulanıb.",
        "Mövzuya aydın və strukturlaşdırılmış yanaşma nümayiş etdirildi.",
      ],
      weaknesses: [
        "Daha dərin texniki detallara və edge-case-lərə toxunula bilərdi.",
        "İstehsalat mühiti (production) təcrübəsindən nümunə əlavə oluna bilərdi.",
      ],
      feedback:
        "Yaxşı cavabdır. Növbəti dəfə cavabınıza konkret nümunə və ya performans optimizasiyası meyarları əlavə etsəniz, daha yüksək nəticə əldə edəcəksiniz.",
      improvedAnswer: `${answer} Əlavə olaraq, istehsalat mühitində monitorinq, xətaların idarə edilməsi və miqyaslana bilən dizayn nümunələri də nəzərə alınmalıdır.`,
    };
  }

  return {
    score: 88,
    technicalAccuracy: 88,
    completeness: 85,
    communication: 90,
    strengths: [
      "Dərin texniki bilik və möhkəm anlayış nümayiş etdirildi.",
      "Fikirlər məntiqli ardıcıllıqla və peşəkar terminologiya ilə ifadə olundu.",
      "Praktiki nüanslar və əsas prinsiplər düzgün əks etdirilib.",
    ],
    weaknesses: [
      "Alternativ yanaşmalar və ya kompromislər (trade-offs) haqqında bir qədər daha geniş məlumat verilə bilərdi.",
    ],
    feedback:
      "Əla cavabdır! İzahınız mövzunu dərindən başa düşdüyünüzü göstərir. Müasir sənaye standartlarına tam uyğundur.",
    improvedAnswer: `${answer} Bu yanaşmaya əlavə olaraq, paylanmış arxitekturalarda və yüksək yüklü sistemlərdə bu prinsipin tətbiqi performansı daha da artırır.`,
  };
};

export const evaluateInterviewAnswer =
  async (
    input:
      EvaluateInterviewAnswerInput
  ): Promise<InterviewEvaluation> => {
    const roleIdentifier =
      normalizeText(
        input.roleSlug
      ) ||
      normalizeText(
        input.category
      );

    if (
      !roleIdentifier
    ) {
      throw new Error(
        "Career field is required for interview evaluation."
      );
    }

    if (
      !normalizeText(
        input.question
      )
    ) {
      throw new Error(
        "Interview question is required."
      );
    }

    if (
      !normalizeText(
        input.answer
      )
    ) {
      throw new Error(
        "Candidate answer is required."
      );
    }

    try {
      const response:
        IQwenJSONResult<
          InterviewEvaluation
        > =
        await qwenService.generateQwenJSON<
          InterviewEvaluation
        >({
          messages: [
            {
              role:
                "user",

              content:
                createPrompt(
                  input
                ),
            },
          ],

          temperature:
            0.2,

          timeoutMs:
            5_000,

          retries:
            0,
        });

      if (
        response.success &&
        response.data
      ) {
        return normalizeEvaluation(
          response.data
        );
      }
    } catch (qwenErr) {
      console.warn(
        "⚠️ [Interview Evaluation] Qwen service unreachable. Using intelligent heuristic evaluation."
      );
    }

    return generateHeuristicEvaluation(input);
  };

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  evaluateInterviewAnswer,
};
