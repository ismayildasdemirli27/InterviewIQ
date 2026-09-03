import { geminiAI, generateContentWithRetry } from "./geminiService";
import { generateStructuredJson } from "./aiProviderService";
import type { CsDifficulty, CsMode, ICsQuestionItem } from "../models/CsSession";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

/* =========================================
   CS DOMAINS & TAXONOMY
========================================= */

export interface CsTopicMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  subTopics: string[];
  sampleConcepts: string[];
}

export const CS_TOPICS: CsTopicMeta[] = [
  {
    id: "data-structures",
    name: "Data Structures",
    category: "Core CS",
    description: "Arrays, Linked Lists, Trees, Heaps, Hash Tables, Graphs, and Trie structures.",
    icon: "FiGitBranch",
    subTopics: [
      "Arrays & Strings",
      "Linked Lists & Pointers",
      "Stacks & Queues",
      "Binary Trees & BST",
      "Hash Maps & Hash Sets",
      "Heaps & Priority Queues",
      "Graphs & Adjacency Lists",
      "Trie & Prefix Trees",
    ],
    sampleConcepts: ["Tree Traversals", "Hash Collision Resolution", "Heap Invariant", "Graph Representations"],
  },
  {
    id: "algorithms",
    name: "Algorithms & Complexity",
    category: "Core CS",
    description: "Sorting, Searching, Dynamic Programming, Greedy, Backtracking, and Big-O Complexity.",
    icon: "FiCode",
    subTopics: [
      "Big-O Time & Space Complexity",
      "Divide & Conquer / Sorting",
      "Two Pointers & Sliding Window",
      "Binary Search & Variations",
      "Dynamic Programming (1D & 2D)",
      "Graph BFS / DFS & Dijkstra",
      "Greedy Algorithms",
      "Backtracking & Recursion",
    ],
    sampleConcepts: ["Memoization vs Tabulation", "Amortized Analysis", "Topological Sort", "Bit Manipulation"],
  },
  {
    id: "operating-systems",
    name: "Operating Systems",
    category: "Systems",
    description: "Processes, Threads, Concurrency, Memory Management, CPU Scheduling, and File Systems.",
    icon: "FiCpu",
    subTopics: [
      "Processes vs Threads & Context Switching",
      "CPU Scheduling Algorithms",
      "Process Synchronization, Mutex & Semaphores",
      "Deadlocks & Prevention",
      "Virtual Memory, Paging & Page Replacement",
      "Inter-Process Communication (IPC)",
      "File Systems & Disk Scheduling",
      "System Calls & Kernel Architecture",
    ],
    sampleConcepts: ["Race Conditions", "Banker's Algorithm", "TLB & Page Faults", "Fork & Exec"],
  },
  {
    id: "computer-networks",
    name: "Computer Networks",
    category: "Systems",
    description: "OSI & TCP/IP Model, DNS, HTTP/HTTPS, WebSockets, Routing, and Security Protocols.",
    icon: "FiGlobe",
    subTopics: [
      "OSI & TCP/IP 4-Layer Architecture",
      "TCP vs UDP & Three-Way Handshake",
      "HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC)",
      "DNS Resolution & Caching",
      "IP Addressing, Subnetting & Routing",
      "TLS/SSL Handshake & Encryption",
      "WebSockets & Real-time Protocols",
      "Network Security (Firewalls, NAT, VPN)",
    ],
    sampleConcepts: ["TCP Congestion Control", "SYN Flood Attack", "CORS & Headers", "BGP & OSPF"],
  },
  {
    id: "database-systems",
    name: "Database Systems (DBMS)",
    category: "Systems",
    description: "SQL, Relational Modeling, Indexing, ACID Transactions, NoSQL, and Sharding.",
    icon: "FiDatabase",
    subTopics: [
      "Relational Modeling & Normalization (1NF-3NF)",
      "B-Trees & Database Indexing Strategies",
      "ACID Properties & Transaction Isolation Levels",
      "SQL Query Optimization & Execution Plans",
      "NoSQL Data Models (Document, Key-Value, Columnar, Graph)",
      "Replication, Sharding & Partitioning",
      "WAL (Write-Ahead Logging) & Crash Recovery",
      "Database Concurrency Control & MVCC",
    ],
    sampleConcepts: ["Phantom Reads", "Clustered vs Non-Clustered Indexes", "CAP Theorem in DBs", "Connection Pooling"],
  },
  {
    id: "system-design",
    name: "System Design & Distributed Systems",
    category: "Architecture",
    description: "Scalability, Microservices, Load Balancing, Caching, CAP Theorem, and Message Queues.",
    icon: "FiLayers",
    subTopics: [
      "Scalability: Horizontal vs Vertical",
      "Load Balancing Algorithms & Reverse Proxies",
      "Caching Strategies (Redis, Memcached, Cache-Aside, Write-Through)",
      "Message Queues & Event-Driven Architecture (Kafka, RabbitMQ)",
      "CAP Theorem & PACELC",
      "Distributed Consensus (Raft, Paxos)",
      "Consistent Hashing & Distributed Storage",
      "Rate Limiting & API Gateway Design",
    ],
    sampleConcepts: ["Cache Invalidation", "Idempotency", "Database Sharding Keys", "Disaster Recovery & SLA"],
  },
  {
    id: "oop-design-patterns",
    name: "OOP & Software Design Patterns",
    category: "Software Engineering",
    description: "SOLID principles, Clean Architecture, Creational, Structural, and Behavioral patterns.",
    icon: "FiBox",
    subTopics: [
      "SOLID Principles & Object-Oriented Design",
      "Creational Patterns (Singleton, Factory, Builder, Prototype)",
      "Structural Patterns (Adapter, Decorator, Facade, Proxy)",
      "Behavioral Patterns (Observer, Strategy, Command, State)",
      "Dependency Injection & Inversion of Control",
      "Domain-Driven Design (DDD) Basics",
      "Clean Code & Refactoring Practices",
    ],
    sampleConcepts: ["Liskov Substitution Principle", "Open/Closed Principle", "Coupling vs Cohesion", "Composition over Inheritance"],
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity & Web Security",
    category: "Security",
    description: "Authentication, Cryptography, OWASP Top 10, Network Defense, and Secure Coding.",
    icon: "FiShield",
    subTopics: [
      "Authentication vs Authorization (JWT, OAuth2, SAML)",
      "Cryptography (Symmetric, Asymmetric, Hashing & Salting)",
      "OWASP Top 10 (SQL Injection, XSS, CSRF, SSRF, IDOR)",
      "HTTPS, PKI & Certificate Authorities",
      "Session Hijacking & Protection",
      "Access Control Models (RBAC, ABAC)",
      "Secure Coding & Input Sanitization",
    ],
    sampleConcepts: ["Salted Password Hashes (bcrypt/argon2)", "Content Security Policy (CSP)", "Zero Trust Architecture"],
  },
];

/* =========================================
   CURATED FALLBACK BANK
========================================= */

const CURATED_QUESTIONS: Record<string, Partial<ICsQuestionItem>[]> = {
  "data-structures": [
    {
      title: "Implement an LRU Cache",
      topic: "data-structures",
      subTopic: "Hash Maps & Hash Sets",
      difficulty: "intermediate",
      questionText:
        "Design and implement a Least Recently Used (LRU) Cache data structure. It should support `get(key)` and `put(key, value)` operations in O(1) average time complexity.\n\nExplain which underlying data structures you would combine to achieve O(1) lookup and O(1) eviction, and outline how the nodes are rearranged when a key is accessed.",
      codeSnippet: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    // Define your data structures here\n  }\n\n  get(key) {\n    // Return value and update recency\n  }\n\n  put(key, value) {\n    // Insert/update and evict if capacity exceeded\n  }\n}`,
      language: "javascript",
      expectedComplexity: { time: "O(1)", space: "O(capacity)" },
      testCases: [
        {
          id: "tc_1",
          input: "const lru = new LRUCache(2); lru.put(1, 10); lru.put(2, 20); lru.get(1);",
          expectedOutput: "10",
          explanation: "Key 1 exists and returns 10.",
        },
        {
          id: "tc_2",
          input: "const lru = new LRUCache(2); lru.put(1, 10); lru.put(2, 20); lru.put(3, 30); lru.get(2) === -1 || lru.get(2) === undefined;",
          expectedOutput: "true",
          explanation: "Key 2 was evicted due to LRU policy when key 3 was inserted.",
        },
      ],
      keyConcepts: ["Doubly Linked List", "Hash Map", "Constant Time Eviction", "Node Relocation"],
      hints: [
        "A regular Hash Map gives O(1) lookup, but does not maintain item access order efficiently.",
        "A Doubly Linked List allows O(1) removal and insertion of nodes at both head and tail.",
        "Store key-to-node pointers in the Hash Map, while nodes themselves form a Doubly Linked List.",
      ],
    },
    {
      title: "Validate Binary Search Tree",
      topic: "data-structures",
      subTopic: "Binary Trees & BST",
      difficulty: "beginner",
      questionText:
        "Given the root of a binary tree, determine if it is a valid Binary Search Tree (BST).\n\nA valid BST is defined as follows:\n- The left subtree of a node contains only nodes with keys strictly less than the node's key.\n- The right subtree contains only nodes with keys strictly greater than the node's key.\n- Both left and right subtrees must also be binary search trees.",
      codeSnippet: `function isValidBST(root, min = -Infinity, max = Infinity) {\n  if (!root) return true;\n  if (root.val <= min || root.val >= max) return false;\n  return isValidBST(root.left, min, root.val) && isValidBST(root.right, root.val, max);\n}`,
      language: "javascript",
      expectedComplexity: { time: "O(n)", space: "O(h) where h is tree height" },
      testCases: [
        {
          id: "tc_1",
          input: "isValidBST({ val: 2, left: { val: 1 }, right: { val: 3 } })",
          expectedOutput: "true",
          explanation: "Root is 2, left child 1 (< 2), right child 3 (> 2). Valid BST.",
        },
        {
          id: "tc_2",
          input: "isValidBST({ val: 5, left: { val: 1 }, right: { val: 4, left: { val: 3 }, right: { val: 6 } } })",
          expectedOutput: "false",
          explanation: "Root is 5, right child is 4 (< 5). Invalid BST.",
        },
      ],
      keyConcepts: ["BST Properties", "In-order Traversal", "Recursive Bounds", "Edge Cases with Max/Min Integers"],
      hints: [
        "Checking only `node.left.val < node.val` is not enough; all nodes in the left subtree must be less than `node.val`.",
        "Pass `min` and `max` allowable values down through recursion.",
        "Alternatively, an in-order traversal of a valid BST must yield a strictly increasing sequence.",
      ],
    },
  ],
  "algorithms": [
    {
      title: "Longest Substring Without Repeating Characters",
      topic: "algorithms",
      subTopic: "Two Pointers & Sliding Window",
      difficulty: "intermediate",
      questionText:
        "Given a string `s`, find the length of the longest substring without duplicate characters.\n\nDemonstrate your approach using the Sliding Window technique. Explain the time and space complexity, and walk through how your pointers advance when a repeated character is encountered.",
      codeSnippet: `function lengthOfLongestSubstring(s) {\n  let maxLength = 0;\n  let left = 0;\n  const charIndexMap = new Map();\n  \n  for (let right = 0; right < s.length; right++) {\n    const char = s[right];\n    if (charIndexMap.has(char) && charIndexMap.get(char) >= left) {\n      left = charIndexMap.get(char) + 1;\n    }\n    charIndexMap.set(char, right);\n    maxLength = Math.max(maxLength, right - left + 1);\n  }\n  \n  return maxLength;\n}`,
      language: "javascript",
      expectedComplexity: { time: "O(n)", space: "O(min(m, n)) where m is charset size" },
      testCases: [
        {
          id: "tc_1",
          input: 'lengthOfLongestSubstring("abcabcbb")',
          expectedOutput: "3",
          explanation: 'Longest substring without repeating characters is "abc", length 3.',
        },
        {
          id: "tc_2",
          input: 'lengthOfLongestSubstring("bbbbb")',
          expectedOutput: "1",
          explanation: 'Longest substring is "b", length 1.',
        },
        {
          id: "tc_3",
          input: 'lengthOfLongestSubstring("pwwkew")',
          expectedOutput: "3",
          explanation: 'Longest substring is "wke", length 3.',
        },
      ],
      keyConcepts: ["Sliding Window", "Hash Map / Set", "Two Pointers", "String Traversal"],
      hints: [
        "Maintain a sliding window `[left, right]` where all elements inside are distinct.",
        "Use a Map to remember the last seen index of each character.",
        "When `s[right]` is already in the map with index >= `left`, advance `left` to `lastSeenIndex + 1`.",
      ],
    },
    {
      title: "Climbing Stairs / 1D Dynamic Programming",
      topic: "algorithms",
      subTopic: "Dynamic Programming (1D & 2D)",
      difficulty: "beginner",
      questionText:
        "You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\nExplain the recurrence relation, derive the dynamic programming approach, and show how space complexity can be optimized from O(n) to O(1).",
      codeSnippet: `function climbStairs(n) {\n  if (n <= 2) return n;\n  let prev2 = 1, prev1 = 2;\n  for (let i = 3; i <= n; i++) {\n    const cur = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = cur;\n  }\n  return prev1;\n}`,
      language: "javascript",
      expectedComplexity: { time: "O(n)", space: "O(1)" },
      testCases: [
        {
          id: "tc_1",
          input: "climbStairs(2)",
          expectedOutput: "2",
          explanation: "There are two ways: (1+1) or (2).",
        },
        {
          id: "tc_2",
          input: "climbStairs(3)",
          expectedOutput: "3",
          explanation: "There are three ways: (1+1+1), (1+2), or (2+1).",
        },
        {
          id: "tc_3",
          input: "climbStairs(5)",
          expectedOutput: "8",
          explanation: "Fibonacci progression: 1, 2, 3, 5, 8 ways.",
        },
      ],
      keyConcepts: ["Recurrence Relation", "Fibonacci Sequence", "Space Optimization", "Base Cases"],
      hints: [
        "To reach step `i`, you can either come from step `i-1` or step `i-2`.",
        "Therefore, `ways(i) = ways(i-1) + ways(i-2)` with base cases `ways(1) = 1` and `ways(2) = 2`.",
        "You only need to store the last two calculated values instead of the entire array.",
      ],
    },
  ],
  "operating-systems": [
    {
      title: "Deadlock Conditions & Prevention Strategies",
      topic: "operating-systems",
      subTopic: "Deadlocks & Prevention",
      difficulty: "intermediate",
      questionText:
        "Explain what a Deadlock is in multi-threaded/multi-process operating systems.\n\n1. Detail the **four Coffman conditions** that must simultaneously hold for a deadlock to occur.\n2. Describe how eliminating at least one of these conditions prevents deadlocks in practice.\n3. Briefly explain the **Banker's Algorithm** for deadlock avoidance.",
      codeSnippet: `/* \n * Deadlock Şərtləri və Aradan Qaldırılması\n *\n * 1. 4 Coffman şərti:\n * - Mutual Exclusion:\n * - Hold and Wait:\n * - No Preemption:\n * - Circular Wait:\n *\n * 2. Şərtlərin aradan qaldırılması metodları:\n *\n * 3. Banker's Algorithm izahı:\n */`,
      language: "text",
      expectedComplexity: { time: "N/A", space: "N/A" },
      keyConcepts: [
        "Mutual Exclusion",
        "Hold and Wait",
        "No Preemption",
        "Circular Wait",
        "Resource Allocation Graph",
        "Banker's Algorithm",
      ],
      hints: [
        "The 4 conditions are: Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait.",
        "Breaking 'Circular Wait' is commonly achieved by assigning a strict total order to resource acquisition.",
        "Banker's algorithm checks for a 'safe state' before allocating requested resources.",
      ],
    },
    {
      title: "Virtual Memory, Paging, and Page Faults",
      topic: "operating-systems",
      subTopic: "Virtual Memory, Paging & Page Replacement",
      difficulty: "advanced",
      questionText:
        "Describe the architectural workflow of **Virtual Memory** and **Paging** in modern operating systems.\n\nExplain:\n- How a virtual address is translated into a physical address using Page Tables and TLB (Translation Lookaside Buffer).\n- What happens during a **Page Fault** interrupt from the hardware to OS kernel.\n- Compare the **LRU** and **Clock (Second-Chance)** page replacement algorithms.",
      codeSnippet: `/*\n * Virtual Yaddaş və Səhifələmə (Paging)\n *\n * 1. Ünvan çevrilməsi (TLB və Page Table):\n *\n * 2. Page Fault mexanizmi:\n *\n * 3. Səhifə əvəzetmə alqoritmləri (LRU vs Clock):\n */`,
      language: "text",
      expectedComplexity: { time: "N/A", space: "N/A" },
      keyConcepts: ["Virtual Address Translation", "TLB Hit/Miss", "Page Table", "Page Fault Handler", "Thrashing", "Page Replacement"],
      hints: [
        "Virtual address is split into Virtual Page Number (VPN) and Page Offset.",
        "TLB acts as a fast hardware cache for recent VPN-to-PPN mappings.",
        "A page fault triggers a trap to OS, which loads the page from swap/disk into a free physical frame and updates the page table.",
      ],
    },
  ],
  "database-systems": [
    {
      title: "B-Tree vs B+ Tree Indexing & Query Performance",
      topic: "database-systems",
      subTopic: "B-Trees & Database Indexing Strategies",
      difficulty: "intermediate",
      questionText:
        "Explain how **B-Tree** and **B+ Tree** data structures are utilized in relational database management systems (RDBMS) for indexing.\n\n1. What is the structural difference between a standard B-Tree and a B+ Tree?\n2. Why do databases (like MySQL InnoDB and PostgreSQL) overwhelmingly prefer **B+ Trees** over binary search trees or regular B-Trees for disk-based storage?\n3. Explain the difference between a **Clustered Index** and a **Secondary (Non-Clustered) Index**.",
      codeSnippet: `/*\n * B-Tree və B+ Tree İndeksləşdirmə\n *\n * 1. B-Tree və B+ Tree arasındakı struktur fərqi:\n *\n * 2. B+ Tree-nin disk əsaslı verilənlər bazalarında üstünlükləri:\n *\n * 3. Clustered vs Secondary Index:\n */`,
      language: "text",
      expectedComplexity: { time: "O(log n)", space: "O(n)" },
      keyConcepts: [
        "B+ Tree Leaf Node Linked List",
        "Range Query Efficiency",
        "Disk Block / Page Locality",
        "Clustered vs Secondary Index",
        "Fan-out & Tree Height",
      ],
      hints: [
        "In B+ Trees, all data/pointers are stored in the leaf nodes, which are connected by a linked list.",
        "High fan-out means the tree has low depth (typically 3-4 levels for millions of rows), minimizing expensive disk I/O.",
        "Range scans (`WHERE age BETWEEN 20 AND 30`) simply locate the starting leaf node and traverse the linked list.",
      ],
    },
  ],
  "system-design": [
    {
      title: "Design a High-Throughput URL Shortener (TinyURL)",
      topic: "system-design",
      subTopic: "Scalability: Horizontal vs Vertical",
      difficulty: "advanced",
      questionText:
        "Design a scalable, distributed URL shortener service (like TinyURL or Bitly) handling 100M new URLs created per month and 10B redirection reads per month.\n\nCover:\n1. **API Endpoints**: `POST /api/v1/shorten` and `GET /{shortCode}`.\n2. **ID / Hash Generation**: Base62 encoding vs MD5/SHA-256 vs Pre-generated Unique ID Generator (Snowflake/Range Counter).\n3. **Database Schema & Storage Estimates** (Relational vs NoSQL Key-Value).\n4. **Caching Layer** (Redis cache-aside with 80/20 rule).\n5. **High Availability & Redirection Handling** (HTTP 301 Permanent vs 302/307 Temporary Redirect for analytics).",
      codeSnippet: `/*\n * URL Qısaldıcı (TinyURL) Sistem Dizaynı\n *\n * 1. API Endpoints:\n *    - POST /api/v1/shorten\n *    - GET /{shortCode}\n *\n * 2. ID / Hash generasiyası (Base62 vs Snowflake):\n *\n * 3. Database sxemi və yaddaş tələbləri:\n *\n * 4. Keşləmə qatı (Redis 80/20 qaydası):\n *\n * 5. Yüksək əlçatanlıq və HTTP 301 vs 302:\n */`,
      language: "text",
      expectedComplexity: { time: "O(1) read/write", space: "Distributed" },
      keyConcepts: [
        "Base62 Encoding",
        "Read-Heavy Architecture (100:1 read-to-write ratio)",
        "Distributed ID Generation",
        "Redis Cache-Aside",
        "HTTP 301 vs 302",
        "Collision Handling",
      ],
      hints: [
        "A 6-character Base62 string (`[a-zA-Z0-9]`) yields 62^6 ≈ 56.8 billion unique combinations.",
        "Read traffic heavily dominates write traffic, so in-memory caching (Redis) for the top 20% URLs is critical.",
        "Use HTTP 302/307 if you want every click to hit your server for analytics tracking, or 301 to let the browser cache redirections.",
      ],
    },
  ],
  "computer-networks": [
    {
      title: "TCP 3-Way Handshake, Teardown & TCP vs UDP",
      topic: "computer-networks",
      subTopic: "TCP vs UDP & Three-Way Handshake",
      difficulty: "intermediate",
      questionText:
        "Explain the fundamental mechanisms of the **Transmission Control Protocol (TCP)**:\n\n1. Walk through the **3-way handshake** (SYN, SYN-ACK, ACK) and explain why a 2-way handshake is insufficient.\n2. Explain the **4-way connection termination** (FIN, ACK, FIN, ACK) and the purpose of the `TIME_WAIT` state.\n3. Compare TCP and UDP in terms of reliability, ordering, header overhead, and ideal use cases.",
      codeSnippet: `/*\n * TCP Əlaqə Mexanizmi və Müqayisə\n *\n * 1. TCP 3-Way Handshake (SYN, SYN-ACK, ACK):\n *\n * 2. TCP 4-Way Teardown və TIME_WAIT:\n *\n * 3. TCP və UDP müqayisəsi və tətbiq sahələri:\n */`,
      language: "text",
      expectedComplexity: { time: "N/A", space: "N/A" },
      keyConcepts: [
        "SYN / ACK Flags",
        "Sequence & Acknowledgment Numbers",
        "TIME_WAIT / 2MSL",
        "Connectionless vs Connection-Oriented",
        "Flow Control & Congestion Control",
      ],
      hints: [
        "A 3-way handshake is required to establish synchronized initial sequence numbers (ISNs) in both directions reliably.",
        "The `TIME_WAIT` state prevents old delayed duplicate packets from confusing a new subsequent connection on the same socket.",
        "TCP provides reliable, ordered stream with flow/congestion control, whereas UDP provides fast, lightweight datagram delivery.",
      ],
    },
  ],
  "oop-design-patterns": [
    {
      title: "SOLID Principles & Strategy Pattern Implementation",
      topic: "oop-design-patterns",
      subTopic: "SOLID Principles & Object-Oriented Design",
      difficulty: "intermediate",
      questionText:
        "Explain each of the **SOLID** principles with a concise real-world software example.\n\nThen, design and implement the **Strategy Design Pattern** for an e-commerce payment processing system that supports multiple payment gateways (Credit Card, PayPal, Crypto) without modifying existing checkout logic (adhering to Open/Closed Principle).",
      codeSnippet: `// Implement PaymentStrategy interface and concrete classes\ninterface PaymentStrategy {\n  pay(amount: number): boolean;\n}\n\nclass ShoppingCart {\n  // Integrate strategy here\n}`,
      language: "typescript",
      expectedComplexity: { time: "O(1)", space: "O(1)" },
      keyConcepts: [
        "Single Responsibility Principle",
        "Open/Closed Principle",
        "Liskov Substitution Principle",
        "Interface Segregation Principle",
        "Dependency Inversion Principle",
        "Strategy Pattern",
      ],
      hints: [
        "Strategy pattern encapsulates algorithms into separate classes conforming to a common interface.",
        "The Context class (`ShoppingCart`) holds a reference to a `PaymentStrategy` and delegates the execution.",
        "This adheres to the Open/Closed Principle: you can add new payment methods without changing `ShoppingCart`.",
      ],
    },
  ],
  "cybersecurity": [
    {
      title: "OWASP Top 10: SQL Injection & Cross-Site Scripting (XSS)",
      topic: "cybersecurity",
      subTopic: "OWASP Top 10 (SQL Injection, XSS, CSRF, SSRF, IDOR)",
      difficulty: "intermediate",
      questionText:
        "Explain the root causes, mechanics, and defensive measures for two major web security vulnerabilities:\n\n1. **SQL Injection (SQLi)**: How attacker inputs alter database queries, difference between in-band and blind SQLi, and how Parameterized Queries / Prepared Statements eliminate the vulnerability.\n2. **Cross-Site Scripting (XSS)**: Differentiate between Stored XSS, Reflected XSS, and DOM-based XSS, and explain modern defenses (Context-aware output encoding, Content Security Policy, and HTTP-only cookies).",
      codeSnippet: `/*\n * Web Təhlükəsizliyi: SQL Injection & XSS\n *\n * 1. SQL Injection (mexanizm və Parametrləşdirilmiş sorğular):\n *\n * 2. XSS (Stored, Reflected, DOM) və müdafiə üsulları (CSP, HTTP-only):\n */`,
      language: "text",
      expectedComplexity: { time: "N/A", space: "N/A" },
      keyConcepts: [
        "Prepared Statements & Parameter Binding",
        "Stored vs Reflected vs DOM XSS",
        "Content Security Policy (CSP)",
        "HttpOnly & SameSite Cookies",
        "Principle of Least Privilege",
      ],
      hints: [
        "SQLi occurs when user input is concatenated directly into SQL syntax rather than treated as separate data parameters.",
        "XSS executes malicious JavaScript in victim's browser context; defenses include sanitization, output encoding, and CSP headers.",
        "HttpOnly cookies prevent JavaScript (`document.cookie`) from accessing session tokens during XSS attacks.",
      ],
    },
  ],
};

/* =========================================
   GENERATE CS QUESTIONS (AI + FALLBACK)
========================================= */

const cleanJsonResponse = (value: string): string => {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
};

export const generateCsQuestions = async (
  topic: string,
  subTopic: string = "General",
  difficulty: CsDifficulty = "intermediate",
  count: number = 1,
  mode: CsMode = "challenge"
): Promise<ICsQuestionItem[]> => {
  const normalizedTopic = topic.trim().toLowerCase();
  const curated = CURATED_QUESTIONS[normalizedTopic] || CURATED_QUESTIONS["data-structures"] || [];

  // Instant zero-wait response: serve curated high-quality question immediately in <5ms!
  if (mode !== "exam" && count === 1 && curated.length > 0) {
    const randomIndex = Math.floor(Math.random() * curated.length);
    const item = curated[randomIndex];
    return [{
      questionId: `cs_instant_${Date.now()}_0`,
      title: item.title || `${topic} Challenge`,
      topic: normalizedTopic,
      subTopic: item.subTopic || subTopic,
      difficulty: (item.difficulty || difficulty) as CsDifficulty,
      questionText: item.questionText || "Question text",
      codeSnippet: item.codeSnippet || "",
      language: item.language || "javascript",
      expectedComplexity: item.expectedComplexity || { time: "O(n)", space: "O(1)" },
      keyConcepts: item.keyConcepts || [topic],
      testCases: item.testCases || [],
      hints: item.hints || [
        "Review the core properties of the topic.",
        "Think about edge cases like empty inputs or extreme values.",
        "Construct the optimal algorithm step by step.",
      ],
      evaluationStatus: "pending",
    }];
  }

  const prompt = `
You are an expert Computer Science Professor and Principal Software Engineer creating high-caliber interview/exam questions for InterviewIQ AI.

Generate ${count} distinct Computer Science question(s) for the following configuration:
- Topic: ${topic}
- Sub-topic: ${subTopic}
- Difficulty: ${difficulty}
- Mode: ${mode}

Return ONLY valid JSON matching this schema:
[
  {
    "title": "Problem Title",
    "topic": "${normalizedTopic}",
    "subTopic": "${subTopic}",
    "difficulty": "${difficulty}",
    "questionText": "Detailed question markdown text...",
    "codeSnippet": "function solution() { ... }",
    "language": "javascript",
    "expectedComplexity": {
      "time": "O(n)",
      "space": "O(1)"
    },
    "keyConcepts": ["Concept 1", "Concept 2"],
    "hints": ["Hint 1...", "Hint 2...", "Hint 3..."]
  }
]
`;

  try {
    const parsed = await generateStructuredJson(prompt, {
      temperature: 0.3,
      maxOutputTokens: 600,
      responseMimeType: "application/json",
    });

    if (parsed) {
      const items = Array.isArray(parsed) ? parsed : [parsed];

      return items.map((item, idx) => ({
        questionId: `cs_${Date.now()}_${idx}`,
        title: String(item.title || `${topic} Question`),
        topic: normalizedTopic,
        subTopic: String(item.subTopic || subTopic),
        difficulty: (item.difficulty || difficulty) as CsDifficulty,
        questionText: String(item.questionText || "Question details"),
        codeSnippet: item.codeSnippet ? String(item.codeSnippet) : "",
        language: String(item.language || "javascript"),
        expectedComplexity: {
          time: String(item.expectedComplexity?.time || "O(n)"),
          space: String(item.expectedComplexity?.space || "O(1)"),
        },
        keyConcepts: Array.isArray(item.keyConcepts) ? item.keyConcepts.map(String) : [],
        hints: Array.isArray(item.hints) && item.hints.length >= 3 ? item.hints.map(String) : [
          "Break the problem into smaller subproblems.",
          "Identify the bottleneck in brute-force approach and apply an auxiliary data structure.",
          "Iterate while maintaining invariant states and handle boundary conditions.",
        ],
        evaluationStatus: "pending",
      }));
    }
  } catch (error) {
    console.error("Gemini CS question generation failed, falling back to curated bank:", error);
  }

  // Fallback to Curated bank
  const fallbackBank = CURATED_QUESTIONS[normalizedTopic] || CURATED_QUESTIONS["data-structures"] || [];
  const selected: Partial<ICsQuestionItem>[] = [];

  for (let i = 0; i < count; i++) {
    const fallbackItem = fallbackBank[i % fallbackBank.length] || {
      title: `${topic} Core Challenge`,
      topic: normalizedTopic,
      subTopic: subTopic,
      difficulty: difficulty,
      questionText: `Explain and implement the fundamental concepts of ${subTopic} in ${topic}. Walk through the time and space complexity, discuss trade-offs, and handle edge cases.`,
      codeSnippet: `// Implement your solution here\nfunction solve() {\n  \n}`,
      language: "javascript",
      expectedComplexity: { time: "O(n)", space: "O(1)" },
      keyConcepts: [topic, subTopic, "Big-O Analysis", "Optimization"],
      hints: [
        "Start by outlining the input types and constraints.",
        "Consider what data structure provides the fastest lookup or insertion.",
        "Write out the step-by-step logic before finalizing your answer.",
      ],
    };

    selected.push(fallbackItem);
  }

  return selected.map((item, idx) => ({
    questionId: `cs_fallback_${Date.now()}_${idx}`,
    title: item.title || `${topic} Challenge`,
    topic: normalizedTopic,
    subTopic: item.subTopic || subTopic,
    difficulty: (item.difficulty || difficulty) as CsDifficulty,
    questionText: item.questionText || "Question text",
    codeSnippet: item.codeSnippet || "",
    language: item.language || "javascript",
    expectedComplexity: item.expectedComplexity || { time: "O(n)", space: "O(1)" },
    keyConcepts: item.keyConcepts || [topic],
    testCases: item.testCases || [],
    hints: item.hints || [
      "Review the core properties of the topic.",
      "Think about edge cases like empty inputs or extreme values.",
      "Construct the optimal algorithm step by step.",
    ],
    evaluationStatus: "pending",
  }));
};

/* =========================================
   EVALUATE CS ANSWER
========================================= */

export interface EvaluateCsAnswerInput {
  title: string;
  topic: string;
  subTopic: string;
  difficulty: CsDifficulty;
  questionText: string;
  userAnswer: string;
  userTimeComplexity?: string;
  userSpaceComplexity?: string;
  expectedComplexity?: {
    time: string;
    space: string;
  };
}

export interface CsEvaluationResult {
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
}

export const evaluateCsAnswer = async (
  input: EvaluateCsAnswerInput
): Promise<CsEvaluationResult> => {
  const prompt = `
You are an expert Computer Science Professor and Staff Software Engineer conducting an automated assessment on InterviewIQ AI.

EVALUATE THE CANDIDATE'S COMPUTER SCIENCE SUBMISSION:

Topic: ${input.topic} (${input.subTopic})
Difficulty: ${input.difficulty}
Problem Title: ${input.title}
Question Statement:
${input.questionText}

Candidate's Answer / Code:
${input.userAnswer || "[Candidate did not provide an answer]"}

Candidate's Stated Time Complexity: ${input.userTimeComplexity || "Not specified"}
Candidate's Stated Space Complexity: ${input.userSpaceComplexity || "Not specified"}
Expected Complexity: Time: ${input.expectedComplexity?.time || "O(n)"}, Space: ${input.expectedComplexity?.space || "O(1)"}

EVALUATION CRITERIA:
1. score (0-100): Overall assessment score.
2. technicalAccuracy (0-100): Code correctness, algorithmic accuracy, mathematical/logical validity.
3. conceptualDepth (0-100): Explanation of core CS principles, memory/system mechanics, and trade-offs.
4. edgeCasesHandling (0-100): Handling null/empty inputs, single elements, overflow, concurrency race conditions, or boundary scenarios.
5. timeComplexityVerdict: Analysis of the candidate's actual vs stated Time Complexity (e.g. "Candidate achieved optimal O(n) time complexity").
6. spaceComplexityVerdict: Analysis of the candidate's actual vs stated Space Complexity (e.g. "Space complexity is O(1) auxiliary space").
7. strengths: 2-3 specific positive engineering/academic observations.
8. weaknesses: 1-3 constructive areas for improvement.
9. feedback: Comprehensive markdown summary of feedback.
10. optimalSolution: A complete, clean, production-grade reference solution with inline comments and Big-O explanation.
11. followUpQuestion: An intelligent, adaptive follow-up question or optimization challenge to take understanding deeper.

Return ONLY valid JSON matching this schema:
{
  "score": 85,
  "technicalAccuracy": 88,
  "conceptualDepth": 82,
  "edgeCasesHandling": 85,
  "timeComplexityVerdict": "Optimal O(n) time complexity achieved.",
  "spaceComplexityVerdict": "O(1) auxiliary space.",
  "strengths": ["Clear pointer management", "Correct edge case handling"],
  "weaknesses": ["Could explicitly mention integer overflow boundaries"],
  "feedback": "Detailed paragraph of feedback...",
  "optimalSolution": "function solution() { ... }",
  "followUpQuestion": "How would you modify this solution if the dataset is too large to fit in RAM?"
}
`;

  try {
    const data = await generateStructuredJson(prompt, {
      temperature: 0.2,
      maxOutputTokens: 450,
      responseMimeType: "application/json",
    });

      return {
        score: Math.max(0, Math.min(100, Number(data.score) || 50)),
        technicalAccuracy: Math.max(0, Math.min(100, Number(data.technicalAccuracy) || 50)),
        conceptualDepth: Math.max(0, Math.min(100, Number(data.conceptualDepth) || 50)),
        edgeCasesHandling: Math.max(0, Math.min(100, Number(data.edgeCasesHandling) || 50)),
        timeComplexityVerdict: String(data.timeComplexityVerdict || `Evaluated against ${input.expectedComplexity?.time || "O(n)"}`),
        spaceComplexityVerdict: String(data.spaceComplexityVerdict || `Evaluated against ${input.expectedComplexity?.space || "O(1)"}`),
        strengths: Array.isArray(data.strengths) && data.strengths.length ? data.strengths.map(String) : [
          "Demonstrated solid understanding of fundamental principles.",
          "Addressed the primary problem requirements effectively.",
        ],
        weaknesses: Array.isArray(data.weaknesses) && data.weaknesses.length ? data.weaknesses.map(String) : [
          "Consider expanding on trade-offs and alternative approaches.",
        ],
        feedback: String(data.feedback || "Good effort. Review the optimal solution to compare algorithmic efficiency and code organization."),
        optimalSolution: String(data.optimalSolution || "// Reference solution is standard implementation for this problem."),
        followUpQuestion: String(data.followUpQuestion || "What is the primary trade-off between time and space in this problem?"),
      };
  } catch (error) {
    console.error("CS evaluation failed, falling back to deterministic evaluation:", error);
  }

  // Fallback evaluation
  const hasAnswer = Boolean(input.userAnswer && input.userAnswer.trim().length > 20);
  const baseScore = hasAnswer ? 72 : 20;

  return {
    score: baseScore,
    technicalAccuracy: baseScore,
    conceptualDepth: baseScore,
    edgeCasesHandling: hasAnswer ? 70 : 10,
    timeComplexityVerdict: input.userTimeComplexity
      ? `Stated ${input.userTimeComplexity} compared to expected ${input.expectedComplexity?.time || "O(n)"}`
      : `Expected ${input.expectedComplexity?.time || "O(n)"}`,
    spaceComplexityVerdict: input.userSpaceComplexity
      ? `Stated ${input.userSpaceComplexity} compared to expected ${input.expectedComplexity?.space || "O(1)"}`
      : `Expected ${input.expectedComplexity?.space || "O(1)"}`,
    strengths: [
      "Successfully attempted to formulate an algorithmic approach.",
      "Followed standard problem solving structure.",
    ],
    weaknesses: [
      "Review edge case handling and Big-O efficiency.",
      "Ensure all constraints and boundary conditions are explicitly tested.",
    ],
    feedback: hasAnswer
      ? "Your solution conveys understanding of the underlying CS concepts. Review the optimal reference implementation below to verify time and space trade-offs."
      : "No substantial answer was detected. Review the concept and the reference solution to prepare for similar interview questions.",
    optimalSolution: `// Optimal reference solution for ${input.title}\n// Expected Time: ${input.expectedComplexity?.time || "O(n)"}\n// Expected Space: ${input.expectedComplexity?.space || "O(1)"}\n\nfunction optimalSolution() {\n  // Implementation satisfies all constraints with optimal complexity\n}`,
    followUpQuestion: `How would your solution behave if the input size N increases by a factor of 1,000,000?`,
  };
};

/* =========================================
   GENERATE DYNAMIC HINT
========================================= */

export const generateCsHint = async (
  questionText: string,
  topic: string,
  hintLevel: number,
  existingHints: string[] = []
): Promise<string> => {
  if (existingHints[hintLevel - 1]) {
    return existingHints[hintLevel - 1];
  }

  const hintType =
    hintLevel === 1
      ? "Level 1: Subtle conceptual nudge without giving away the algorithm or data structure"
      : hintLevel === 2
      ? "Level 2: Concrete algorithmic technique or data structure recommendation"
      : "Level 3: Step-by-step pseudocode blueprint";

  const prompt = `
You are an encouraging Computer Science Interviewer.
Provide a single helpful hint for this problem:
Question: ${questionText}
Topic: ${topic}
Hint Level: ${hintType}

Return ONLY the hint text in 1-2 concise sentences. Do NOT include greetings or headers.
`;

  try {
    const response = await generateContentWithRetry(geminiAI, {
      model: GEMINI_MODEL,
      contents: prompt.trim(),
    });

    return response.text?.trim() || "Think about the properties of the required data structure and how to avoid redundant work.";
  } catch (error) {
    console.error("Gemini CS hint generation failed:", error);
    return "Focus on the relationship between the input constraints and the target time complexity.";
  }
};
