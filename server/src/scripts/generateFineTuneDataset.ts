import fs from "fs";
import path from "path";

interface DatasetEntry {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
}

const SYSTEM_PROMPT = `You are InterviewIQ AI, a world-class Computer Science Professor and FAANG Staff Software Engineer evaluating coding submissions with strict Big-O rigor, algorithm accuracy, and Holberton School peer-learning standards.
Always produce clean, accurate, valid JSON matching the requested schema without conversational filler.`;

const SAMPLE_DATASET: Array<{
  problem: {
    title: string;
    topic: string;
    subTopic: string;
    difficulty: string;
    statement: string;
    expectedTime: string;
    expectedSpace: string;
  };
  submissions: Array<{
    userCode: string;
    userTime: string;
    userSpace: string;
    evaluation: {
      score: number;
      technicalAccuracy: number;
      conceptualDepth: number;
      edgeCasesHandling: number;
      timeComplexityVerdict: string;
      spaceComplexityVerdict: string;
      strengths: string[];
      weaknesses: string[];
      feedback: string;
      optimalSolution: string;
      followUpQuestion: string;
    };
  }>;
}> = [
  {
    problem: {
      title: "Two Sum (Target Pair Detection)",
      topic: "data-structures",
      subTopic: "Hash Tables & Arrays",
      difficulty: "beginner",
      statement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Each input would have exactly one solution, and you may not use the same element twice.",
      expectedTime: "O(n)",
      expectedSpace: "O(n)",
    },
    submissions: [
      {
        userCode: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
        userTime: "O(n)",
        userSpace: "O(n)",
        evaluation: {
          score: 96,
          technicalAccuracy: 98,
          conceptualDepth: 94,
          edgeCasesHandling: 95,
          timeComplexityVerdict: "Optimal O(n) single-pass hash map traversal.",
          spaceComplexityVerdict: "O(n) auxiliary space to store elements in hash map.",
          strengths: [
            "Optimal single-pass hash map implementation",
            "Clear variable naming and early termination return",
          ],
          weaknesses: [
            "Could mention how hash collisions would affect worst-case lookup in non-standard engines",
          ],
          feedback: "Flawless solution demonstrating textbook hash map lookup mastery. Both time and space complexities are optimal.",
          optimalSolution: `function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (seen.has(complement)) return [seen.get(complement), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}`,
          followUpQuestion: "If the input array were already sorted in ascending order, how could you solve this in O(1) auxiliary space?",
        },
      },
      {
        userCode: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`,
        userTime: "O(n^2)",
        userSpace: "O(1)",
        evaluation: {
          score: 72,
          technicalAccuracy: 88,
          conceptualDepth: 65,
          edgeCasesHandling: 75,
          timeComplexityVerdict: "Suboptimal O(n^2) quadratic nested loops.",
          spaceComplexityVerdict: "O(1) constant auxiliary space.",
          strengths: [
            "Correct output for small inputs",
            "Avoids using auxiliary memory (O(1) space)",
          ],
          weaknesses: [
            "Quadratic O(n^2) time complexity will Time Out (TLE) on large datasets (e.g. n >= 10^5)",
            "Did not leverage hash table for O(1) complement lookups",
          ],
          feedback: "Brute-force approach works functionally but will fail production scale requirements. Trade O(n) memory using a hash map to achieve O(n) linear execution time.",
          optimalSolution: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
          followUpQuestion: "Can you explain why looking up a key in a Hash Map is O(1) on average, and what triggers O(n) worst case?",
        },
      },
    ],
  },
  {
    problem: {
      title: "Reverse a Singly Linked List",
      topic: "data-structures",
      subTopic: "Linked Lists & Pointers",
      difficulty: "beginner",
      statement: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
      expectedTime: "O(n)",
      expectedSpace: "O(1)",
    },
    submissions: [
      {
        userCode: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`,
        userTime: "O(n)",
        userSpace: "O(1)",
        evaluation: {
          score: 98,
          technicalAccuracy: 100,
          conceptualDepth: 96,
          edgeCasesHandling: 98,
          timeComplexityVerdict: "Optimal O(n) single pass across all linked nodes.",
          spaceComplexityVerdict: "Optimal O(1) iterative in-place pointer manipulation.",
          strengths: [
            "Excellent in-place pointer reassignment with zero memory allocation",
            "Gracefully handles empty lists (head === null) and single-element lists",
          ],
          weaknesses: [
            "None. Clean production-grade iterative algorithm.",
          ],
          feedback: "Outstanding implementation. Pointer manipulation is precise, avoiding memory leaks or cyclical references.",
          optimalSolution: `function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    const next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}`,
          followUpQuestion: "How would you implement this recursively, and what would the space complexity be on the call stack?",
        },
      },
    ],
  },
  {
    problem: {
      title: "LRU Cache Architecture",
      topic: "system-design",
      subTopic: "Memory Caching & Architecture",
      difficulty: "advanced",
      statement: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) average time complexity for both get and put operations.",
      expectedTime: "O(1)",
      expectedSpace: "O(capacity)",
    },
    submissions: [
      {
        userCode: `class Node {
  constructor(key, val) {
    this.key = key;
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = new Node(0, 0);
    this.tail = new Node(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _insert(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this._remove(node);
    this._insert(node);
    return node.val;
  }

  put(key, value) {
    if (this.map.has(key)) {
      this._remove(this.map.get(key));
    }
    const node = new Node(key, value);
    this._insert(node);
    this.map.set(key, node);
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev;
      this._remove(lru);
      this.map.delete(lru.key);
    }
  }
}`,
        userTime: "O(1)",
        userSpace: "O(capacity)",
        evaluation: {
          score: 97,
          technicalAccuracy: 98,
          conceptualDepth: 97,
          edgeCasesHandling: 96,
          timeComplexityVerdict: "Strict O(1) guaranteed for both get and put via Hash Table + Doubly Linked List.",
          spaceComplexityVerdict: "O(capacity) bounded memory usage.",
          strengths: [
            "Used sentinel head and tail dummy nodes to eliminate boundary edge cases",
            "Correctly synchronized map deletions with DLL removals",
          ],
          weaknesses: [
            "In multi-threaded / concurrent environments, this would require read-write mutex locks",
          ],
          feedback: "Exemplary Staff-level System Design implementation. The sentinel node pattern prevents null pointer exceptions cleanly.",
          optimalSolution: `// Solution provided by candidate is identical to industry gold standard.`,
          followUpQuestion: "If this cache is accessed concurrently by 10,000 worker threads, what concurrency control pattern would you use?",
        },
      },
    ],
  },
];

export const generateDataset = (): void => {
  const outputDir = path.resolve(__dirname, "../../datasets");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "interviewiq_coder_sft.jsonl");
  const stream = fs.createWriteStream(outputPath, { encoding: "utf-8" });

  let count = 0;

  for (const item of SAMPLE_DATASET) {
    for (const sub of item.submissions) {
      const userPrompt = `EVALUATE THE CANDIDATE'S COMPUTER SCIENCE SUBMISSION:

Topic: ${item.problem.topic} (${item.problem.subTopic})
Difficulty: ${item.problem.difficulty}
Problem Title: ${item.problem.title}
Question Statement:
${item.problem.statement}

Candidate's Answer / Code:
${sub.userCode}

Candidate's Stated Time Complexity: ${sub.userTime}
Candidate's Stated Space Complexity: ${sub.userSpace}
Expected Complexity: Time: ${item.problem.expectedTime}, Space: ${item.problem.expectedSpace}

Return ONLY valid JSON matching this schema:
{
  "score": number,
  "technicalAccuracy": number,
  "conceptualDepth": number,
  "edgeCasesHandling": number,
  "timeComplexityVerdict": string,
  "spaceComplexityVerdict": string,
  "strengths": string[],
  "weaknesses": string[],
  "feedback": string,
  "optimalSolution": string,
  "followUpQuestion": string
}`;

      const entry: DatasetEntry = {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
          { role: "assistant", content: JSON.stringify(sub.evaluation, null, 2) },
        ],
      };

      stream.write(JSON.stringify(entry) + "\n");
      count++;
    }
  }

  stream.end();
  console.log(`✅ Generated ${count} training samples to: ${outputPath}`);
};

if (require.main === module) {
  generateDataset();
}
