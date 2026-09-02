export interface TestCaseResult {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTimeMs: number;
  error?: string;
  explanation?: string;
}

export interface RunTestsResponse {
  allPassed: boolean;
  passedTests: number;
  totalTests: number;
  results: TestCaseResult[];
  logs: string[];
}

/**
 * Executes user JavaScript code in a safe in-browser environment against provided test cases.
 */
export const runJavaScriptTestCases = (
  userCode: string,
  testCases: Array<{ id?: string; input: string; expectedOutput: string; explanation?: string }>
): RunTestsResponse => {
  const logs: string[] = [];
  const results: TestCaseResult[] = [];

  if (!testCases || testCases.length === 0) {
    // If no test cases, just test that the code compiles and runs without syntax errors
    try {
      const sanitizedLogs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => sanitizedLogs.push(args.map(String).join(" ")),
        warn: (...args: any[]) => sanitizedLogs.push("[warn] " + args.map(String).join(" ")),
        error: (...args: any[]) => sanitizedLogs.push("[error] " + args.map(String).join(" ")),
      };

      const runner = new Function("console", `"use strict";\n${userCode}`);
      const start = performance.now();
      runner(customConsole);
      const timeMs = Math.round((performance.now() - start) * 100) / 100;

      return {
        allPassed: true,
        passedTests: 1,
        totalTests: 1,
        results: [
          {
            id: "syntax_check",
            input: "Syntax & Compilation Check",
            expectedOutput: "Valid JavaScript code",
            actualOutput: "Compiled and executed successfully with 0 errors",
            passed: true,
            executionTimeMs: timeMs,
          },
        ],
        logs: sanitizedLogs,
      };
    } catch (err: any) {
      return {
        allPassed: false,
        passedTests: 0,
        totalTests: 1,
        results: [
          {
            id: "syntax_check",
            input: "Syntax & Compilation Check",
            expectedOutput: "Valid JavaScript code",
            actualOutput: String(err?.message || err),
            passed: false,
            executionTimeMs: 0,
            error: String(err?.message || err),
          },
        ],
        logs,
      };
    }
  }

  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const testId = tc.id || `tc_${i + 1}`;
    const start = performance.now();
    let actualOutput = "";
    let isPassed = false;
    let errorMsg: string | undefined;

    try {
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(String).join(" ")),
        warn: (...args: any[]) => logs.push("[warn] " + args.map(String).join(" ")),
        error: (...args: any[]) => logs.push("[error] " + args.map(String).join(" ")),
      };

      // Wrap user code and evaluate test expression
      const executor = new Function(
        "console",
        `"use strict";
        ${userCode};
        try {
          return (${tc.input});
        } catch (e) {
          throw e;
        }`
      );

      const rawResult = executor(customConsole);

      if (rawResult === undefined) {
        actualOutput = "undefined";
      } else if (typeof rawResult === "object") {
        actualOutput = JSON.stringify(rawResult);
      } else {
        actualOutput = String(rawResult);
      }

      // Check expected output
      const cleanExpected = tc.expectedOutput.trim();
      const cleanActual = actualOutput.trim();

      if (
        cleanExpected === cleanActual ||
        (cleanExpected === "true" && cleanActual === "true") ||
        (cleanExpected === "false" && cleanActual === "false") ||
        cleanExpected.toLowerCase() === cleanActual.toLowerCase()
      ) {
        isPassed = true;
      } else {
        // Fallback loose comparison for numeric / JSON
        try {
          if (JSON.stringify(JSON.parse(cleanExpected)) === JSON.stringify(JSON.parse(cleanActual))) {
            isPassed = true;
          }
        } catch {
          isPassed = false;
        }
      }
    } catch (err: any) {
      errorMsg = err?.message || String(err);
      actualOutput = `Error: ${errorMsg}`;
      isPassed = false;
    }

    const duration = Math.round((performance.now() - start) * 100) / 100;

    if (isPassed) {
      passedCount++;
    }

    results.push({
      id: testId,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput,
      passed: isPassed,
      executionTimeMs: duration,
      error: errorMsg,
      explanation: tc.explanation,
    });
  }

  return {
    allPassed: passedCount === testCases.length,
    passedTests: passedCount,
    totalTests: testCases.length,
    results,
    logs,
  };
};
