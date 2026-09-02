import jsPDF from "jspdf";

export interface CertificateData {
  candidateName: string;
  candidateEmail?: string;
  topic: string;
  subTopic?: string;
  difficulty: string;
  mode: string;
  overallScore: number;
  date: string;
  certificateId: string;
  totalQuestions: number;
  timeSpentMinutes?: number;
  summaryReport?: {
    strengths: string[];
    improvements: string[];
    recommendedTopics: string[];
  };
}

export const generateCsCertificate = (data: CertificateData): void => {
  // A4 Landscape format: 297mm x 210mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Background Dark Theme Canvas
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Outer Border Accent (Indigo / Violet Gradient effect)
  doc.setDrawColor(99, 102, 241); // #6366f1
  doc.setLineWidth(2);
  doc.roundedRect(8, 8, pageWidth - 16, pageHeight - 16, 4, 4, "S");

  // Inner Subtle Golden Border
  doc.setDrawColor(234, 179, 8); // #eab308 (Gold)
  doc.setLineWidth(0.6);
  doc.roundedRect(12, 12, pageWidth - 24, pageHeight - 24, 3, 3, "S");

  // Top Header Eyebrow
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(129, 140, 248); // Indigo 400
  doc.text("HOLBERTON SCHOOL  •  INTERVIEWIQ AI COMPUTER SCIENCE ACADEMY", pageWidth / 2, 24, {
    align: "center",
  });

  // Certificate Main Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text("CERTIFICATE OF TECHNICAL MASTERY", pageWidth / 2, 38, {
    align: "center",
  });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text("This credential formally certifies that the candidate has successfully demonstrated technical proficiency in", pageWidth / 2, 46, {
    align: "center",
  });

  // Candidate Name Header Box
  const nameY = 62;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(99, 102, 241); // Indigo Accent
  doc.text(data.candidateName.toUpperCase(), pageWidth / 2, nameY, {
    align: "center",
  });

  // Underline beneath candidate name
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(1);
  doc.line((pageWidth / 2) - 50, nameY + 3, (pageWidth / 2) + 50, nameY + 3);

  // Examination Details Section
  const detailsY = 80;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225); // Slate 300
  const topicTitle = `${data.topic.toUpperCase()} (${data.subTopic || "Core Examination"})`;
  doc.text(`Domain: ${topicTitle}`, pageWidth / 2, detailsY, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  const modeText = data.mode === "exam" ? "Full CS Mock Examination" : data.mode === "deep_dive" ? "Topic Deep-Dive Assessment" : "Sprint Technical Challenge";
  doc.text(`Evaluation Track: ${modeText}  |  Difficulty Tier: ${data.difficulty.toUpperCase()}`, pageWidth / 2, detailsY + 7, { align: "center" });

  // Score & Grade Card
  const scoreCardY = 98;
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(pageWidth / 2 - 45, scoreCardY, 90, 26, 3, 3, "F");
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.8);
  doc.roundedRect(pageWidth / 2 - 45, scoreCardY, 90, 26, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const scoreColor = data.overallScore >= 80 ? [74, 222, 128] : data.overallScore >= 60 ? [250, 204, 21] : [248, 113, 113];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${data.overallScore} / 100`, pageWidth / 2, scoreCardY + 11, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  const grade = data.overallScore >= 90 ? "GRADE: A+ (EXCELLENT)" : data.overallScore >= 80 ? "GRADE: A (VERY GOOD)" : data.overallScore >= 70 ? "GRADE: B (PROFICIENT)" : "GRADE: C (PASSED)";
  doc.text(grade, pageWidth / 2, scoreCardY + 19, { align: "center" });

  // Two Column Skills & Key Insights Box
  const summaryBoxY = 132;
  const colWidth = 120;
  const colLeftX = 22;
  const colRightX = pageWidth - colLeftX - colWidth;

  // Strengths column
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(colLeftX, summaryBoxY, colWidth, 34, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(74, 222, 128); // Green
  doc.text("✓ KEY DEMONSTRATED STRENGTHS:", colLeftX + 5, summaryBoxY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const strengths = data.summaryReport?.strengths && data.summaryReport.strengths.length > 0
    ? data.summaryReport.strengths.slice(0, 2)
    : ["Solid command of algorithmic fundamentals.", "Appropriate consideration of time and space trade-offs."];

  strengths.forEach((s, idx) => {
    const wrapped = doc.splitTextToSize(`• ${s}`, colWidth - 10);
    doc.text(wrapped, colLeftX + 5, summaryBoxY + 14 + (idx * 9));
  });

  // Recommendations column
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(colRightX, summaryBoxY, colWidth, 34, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(129, 140, 248); // Indigo
  doc.text("💡 ARCHITECTURAL & CODING RECOMMENDATIONS:", colRightX + 5, summaryBoxY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const improvements = data.summaryReport?.improvements && data.summaryReport.improvements.length > 0
    ? data.summaryReport.improvements.slice(0, 2)
    : ["Elaborate further on concurrency and memory edge cases.", "Validate boundary conditions and extreme constraints."];

  improvements.forEach((imp, idx) => {
    const wrapped = doc.splitTextToSize(`• ${imp}`, colWidth - 10);
    doc.text(wrapped, colRightX + 5, summaryBoxY + 14 + (idx * 9));
  });

  // Footer: Signatures, Verification Code, and Date
  const footerY = 184;
  doc.setDrawColor(51, 65, 85); // Slate 700
  doc.setLineWidth(0.4);
  doc.line(22, footerY, pageWidth - 22, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);

  // Left: Verification ID
  doc.text(`Credential ID: ${data.certificateId}`, 22, footerY + 7);
  doc.text(`Issued Date: ${data.date}`, 22, footerY + 12);

  // Center: Seal / AI verification
  doc.setFont("helvetica", "bold");
  doc.setTextColor(234, 179, 8); // Gold
  doc.text("VERIFIED BY INTERVIEWIQ AI ENGINE", pageWidth / 2, footerY + 8, { align: "center" });

  // Right: Signature simulation
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Holberton School Capstone Evaluation", pageWidth - 22, footerY + 7, { align: "right" });
  doc.text("Authorized Academic Technical Board", pageWidth - 22, footerY + 12, { align: "right" });

  // Save the PDF
  const sanitizedName = data.candidateName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`InterviewIQ_CS_Certificate_${sanitizedName}.pdf`);
};
