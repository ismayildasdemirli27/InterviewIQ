import React, { useState, useEffect, useRef } from "react";
import {
  FiPlay,
  FiPause,
  FiSkipForward,
  FiSkipBack,
  FiRotateCcw,
  FiSliders,
  FiCpu,
  FiLayers,
  FiTerminal,
} from "react-icons/fi";
import "./memoryVisualizer.scss";

export interface VisualizerStep {
  array: number[];
  pointers: { label: string; index: number; color: string }[];
  highlightIndices: { index: number; status: "inspecting" | "match" | "swap" | "inactive" }[];
  variables: Record<string, string | number>;
  callStack?: string[];
  explanation: string;
}

interface PresetAlgorithm {
  name: string;
  category: string;
  initialArray: number[];
  generateSteps: (arr: number[]) => VisualizerStep[];
}

const PRESET_ALGORITHMS: PresetAlgorithm[] = [
  {
    name: "Two Pointers: Target Sum",
    category: "Arrays & Two Pointers",
    initialArray: [2, 4, 7, 11, 15, 20],
    generateSteps: (arr) => {
      const target = 18;
      const steps: VisualizerStep[] = [];
      let left = 0;
      let right = arr.length - 1;

      steps.push({
        array: [...arr],
        pointers: [
          { label: "L", index: left, color: "#6366f1" },
          { label: "R", index: right, color: "#ec4899" },
        ],
        highlightIndices: [
          { index: left, status: "inspecting" },
          { index: right, status: "inspecting" },
        ],
        variables: { target, left, right, "nums[L] + nums[R]": arr[left] + arr[right] },
        callStack: ["main()", "twoPointersSum(arr, target=18)"],
        explanation: `Initial state: Pointers placed at left index ${left} (${arr[left]}) and right index ${right} (${arr[right]}). Target is ${target}.`,
      });

      while (left < right) {
        const sum = arr[left] + arr[right];
        if (sum === target) {
          steps.push({
            array: [...arr],
            pointers: [
              { label: "L", index: left, color: "#10b981" },
              { label: "R", index: right, color: "#10b981" },
            ],
            highlightIndices: [
              { index: left, status: "match" },
              { index: right, status: "match" },
            ],
            variables: { target, left, right, sum: `${sum} (Target Found!)` },
            callStack: ["main()", "twoPointersSum() -> return [L, R]"],
            explanation: `Found target! arr[${left}] (${arr[left]}) + arr[${right}] (${arr[right]}) == ${target}. Solution found in O(N) time and O(1) space!`,
          });
          break;
        } else if (sum > target) {
          steps.push({
            array: [...arr],
            pointers: [
              { label: "L", index: left, color: "#6366f1" },
              { label: "R", index: right, color: "#ec4899" },
            ],
            highlightIndices: [
              { index: left, status: "inspecting" },
              { index: right, status: "swap" },
            ],
            variables: { target, left, right, sum: `${sum} > ${target}` },
            callStack: ["main()", "twoPointersSum() -> right--"],
            explanation: `Sum ${sum} is greater than ${target}. Since array is sorted, decrement right pointer (R) to decrease sum.`,
          });
          right--;
        } else {
          steps.push({
            array: [...arr],
            pointers: [
              { label: "L", index: left, color: "#6366f1" },
              { label: "R", index: right, color: "#ec4899" },
            ],
            highlightIndices: [
              { index: left, status: "swap" },
              { index: right, status: "inspecting" },
            ],
            variables: { target, left, right, sum: `${sum} < ${target}` },
            callStack: ["main()", "twoPointersSum() -> left++"],
            explanation: `Sum ${sum} is less than ${target}. Increment left pointer (L) to increase sum.`,
          });
          left++;
        }
      }
      return steps;
    },
  },
  {
    name: "Binary Search",
    category: "Divide & Conquer",
    initialArray: [1, 3, 5, 8, 12, 16, 23, 38],
    generateSteps: (arr) => {
      const target = 16;
      const steps: VisualizerStep[] = [];
      let low = 0;
      let high = arr.length - 1;

      steps.push({
        array: [...arr],
        pointers: [
          { label: "Low", index: low, color: "#3b82f6" },
          { label: "High", index: high, color: "#ef4444" },
        ],
        highlightIndices: [
          { index: low, status: "inspecting" },
          { index: high, status: "inspecting" },
        ],
        variables: { target, low, high, mid: "uncalculated" },
        callStack: ["main()", "binarySearch(arr, target=16)"],
        explanation: `Search range [0..${arr.length - 1}]. Target is ${target}. Calculating middle index.`,
      });

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const midVal = arr[mid];

        if (midVal === target) {
          steps.push({
            array: [...arr],
            pointers: [
              { label: "MID", index: mid, color: "#10b981" },
              { label: "Low", index: low, color: "#3b82f6" },
              { label: "High", index: high, color: "#ef4444" },
            ],
            highlightIndices: [{ index: mid, status: "match" }],
            variables: { target, low, high, mid, "arr[mid]": `${midVal} (MATCH)` },
            callStack: ["main()", "binarySearch() -> Match Found"],
            explanation: `Match found! arr[${mid}] == ${target}. Binary search terminated in O(log N) operations.`,
          });
          break;
        } else if (midVal < target) {
          steps.push({
            array: [...arr],
            pointers: [
              { label: "MID", index: mid, color: "#f59e0b" },
              { label: "Low", index: low, color: "#3b82f6" },
              { label: "High", index: high, color: "#ef4444" },
            ],
            highlightIndices: [{ index: mid, status: "inspecting" }],
            variables: { target, low, high, mid, "arr[mid]": `${midVal} < ${target}` },
            callStack: ["main()", "binarySearch() -> low = mid + 1"],
            explanation: `arr[mid] (${midVal}) < ${target}. Eliminate left half [${low}..${mid}]. Move Low to ${mid + 1}.`,
          });
          low = mid + 1;
        } else {
          steps.push({
            array: [...arr],
            pointers: [
              { label: "MID", index: mid, color: "#f59e0b" },
              { label: "Low", index: low, color: "#3b82f6" },
              { label: "High", index: high, color: "#ef4444" },
            ],
            highlightIndices: [{ index: mid, status: "inspecting" }],
            variables: { target, low, high, mid, "arr[mid]": `${midVal} > ${target}` },
            callStack: ["main()", "binarySearch() -> high = mid - 1"],
            explanation: `arr[mid] (${midVal}) > ${target}. Eliminate right half [${mid}..${high}]. Move High to ${mid - 1}.`,
          });
          high = mid - 1;
        }
      }
      return steps;
    },
  },
  {
    name: "Reverse Array In-Place",
    category: "Pointers & Memory Swap",
    initialArray: [10, 20, 30, 40, 50, 60],
    generateSteps: (originalArr) => {
      const arr = [...originalArr];
      const steps: VisualizerStep[] = [];
      let i = 0;
      let j = arr.length - 1;

      steps.push({
        array: [...arr],
        pointers: [
          { label: "i", index: i, color: "#6366f1" },
          { label: "j", index: j, color: "#ec4899" },
        ],
        highlightIndices: [
          { index: i, status: "inspecting" },
          { index: j, status: "inspecting" },
        ],
        variables: { i, j, "arr[i]": arr[i], "arr[j]": arr[j] },
        callStack: ["main()", "reverseArray(arr)"],
        explanation: `Starting in-place array reversal. Pointers placed at both ends.`,
      });

      while (i < j) {
        // Swap
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;

        steps.push({
          array: [...arr],
          pointers: [
            { label: "i", index: i, color: "#10b981" },
            { label: "j", index: j, color: "#10b981" },
          ],
          highlightIndices: [
            { index: i, status: "swap" },
            { index: j, status: "swap" },
          ],
          variables: { i, j, "swapped": `${arr[i]} <-> ${arr[j]}` },
          callStack: ["main()", "reverseArray() -> swap in-place"],
          explanation: `Swapped index ${i} and index ${j}. In-place mutation O(1) auxiliary memory.`,
        });

        i++;
        j--;

        if (i <= j) {
          steps.push({
            array: [...arr],
            pointers: [
              { label: "i", index: i, color: "#6366f1" },
              { label: "j", index: j, color: "#ec4899" },
            ],
            highlightIndices: [
              { index: i, status: "inspecting" },
              { index: j, status: "inspecting" },
            ],
            variables: { i, j, "arr[i]": arr[i], "arr[j]": arr[j] },
            callStack: ["main()", "reverseArray() -> i++, j--"],
            explanation: `Pointers advanced inward: i = ${i}, j = ${j}.`,
          });
        }
      }

      steps.push({
        array: [...arr],
        pointers: [],
        highlightIndices: arr.map((_, idx) => ({ index: idx, status: "match" })),
        variables: { status: "Reversal Complete", time: "O(N/2)", space: "O(1)" },
        callStack: ["main()", "reverseArray() -> DONE"],
        explanation: `Array completely reversed in-place! [${arr.join(", ")}]`,
      });

      return steps;
    },
  },
];

export const MemoryVisualizer: React.FC = () => {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1 = 1.2s, 2 = 0.6s
  const [customArrayInput, setCustomArrayInput] = useState<string>("");
  const playTimerRef = useRef<any>(null);

  const currentPreset = PRESET_ALGORITHMS[selectedPresetIdx];
  const [steps, setSteps] = useState<VisualizerStep[]>(() =>
    currentPreset.generateSteps(currentPreset.initialArray)
  );

  // Recalculate steps on preset change
  useEffect(() => {
    setIsPlaying(false);
    clearInterval(playTimerRef.current);
    const newPreset = PRESET_ALGORITHMS[selectedPresetIdx];
    const newSteps = newPreset.generateSteps(newPreset.initialArray);
    setSteps(newSteps);
    setCurrentStepIdx(0);
  }, [selectedPresetIdx]);

  // Handle Play/Pause
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = playbackSpeed === 2 ? 650 : 1200;
      playTimerRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      clearInterval(playTimerRef.current);
    }

    return () => clearInterval(playTimerRef.current);
  }, [isPlaying, steps.length, playbackSpeed]);

  const currentStep = steps[currentStepIdx] || steps[0];

  const handleStepForward = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  const handleApplyCustomArray = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customArrayInput
      .split(/[, ]+/)
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n));

    if (parsed.length >= 2) {
      setIsPlaying(false);
      const newSteps = currentPreset.generateSteps(parsed);
      setSteps(newSteps);
      setCurrentStepIdx(0);
    }
  };

  return (
    <div className="memory-visualizer-container">
      {/* Top Controls Bar */}
      <div className="visualizer-header-bar">
        <div className="preset-selector-group">
          <label htmlFor="preset-select">
            <FiCpu /> Preset Algorithm:
          </label>
          <select
            id="preset-select"
            value={selectedPresetIdx}
            onChange={(e) => setSelectedPresetIdx(Number(e.target.value))}
            className="preset-dropdown"
          >
            {PRESET_ALGORITHMS.map((p, idx) => (
              <option key={idx} value={idx}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>

        <div className="playback-controls">
          <button
            type="button"
            className="control-btn"
            onClick={handleStepBackward}
            disabled={currentStepIdx === 0}
            title="Previous Step"
          >
            <FiSkipBack />
          </button>

          <button
            type="button"
            className={`control-btn play-btn ${isPlaying ? "playing" : ""}`}
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause" : "Play Stepper"}
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>

          <button
            type="button"
            className="control-btn"
            onClick={handleStepForward}
            disabled={currentStepIdx === steps.length - 1}
            title="Next Step"
          >
            <FiSkipForward />
          </button>

          <button
            type="button"
            className="control-btn"
            onClick={handleReset}
            title="Reset"
          >
            <FiRotateCcw />
          </button>

          <div className="speed-toggle">
            <button
              type="button"
              className={`speed-pill ${playbackSpeed === 1 ? "active" : ""}`}
              onClick={() => setPlaybackSpeed(1)}
            >
              1x
            </button>
            <button
              type="button"
              className={`speed-pill ${playbackSpeed === 2 ? "active" : ""}`}
              onClick={() => setPlaybackSpeed(2)}
            >
              2x
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Memory Grid / Tape */}
      <div className="memory-tape-card">
        <div className="memory-tape-header">
          <span className="memory-label">
            <FiLayers /> Continuous Memory Buffer (Contiguous Heap Array)
          </span>
          <span className="step-counter">
            Step <strong>{currentStepIdx + 1}</strong> of <strong>{steps.length}</strong>
          </span>
        </div>

        <div className="cells-tape-wrapper">
          <div className="memory-cells-row">
            {currentStep.array.map((val, idx) => {
              const highlight = currentStep.highlightIndices.find((h) => h.index === idx);
              const cellStatusClass = highlight ? `cell-${highlight.status}` : "";
              const activePointers = currentStep.pointers.filter((p) => p.index === idx);

              return (
                <div key={idx} className={`memory-cell-column ${cellStatusClass}`}>
                  {/* Floating Pointer Indicators */}
                  <div className="pointer-markers-row">
                    {activePointers.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="pointer-badge"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.label}
                        <span className="arrow-down" style={{ borderTopColor: p.color }} />
                      </div>
                    ))}
                  </div>

                  {/* Cell Box */}
                  <div className="cell-box">
                    <span className="cell-value">{val}</span>
                  </div>

                  {/* Cell Index Label */}
                  <div className="cell-index">[{idx}]</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Explanation Banner */}
        <div className="step-explanation-box">
          <div className="explanation-indicator" />
          <p>{currentStep.explanation}</p>
        </div>
      </div>

      {/* Inspector Dual Panel: Variable States & Call Stack */}
      <div className="inspector-dual-grid">
        <div className="inspector-card">
          <h4>
            <FiTerminal /> Runtime Variables Inspector
          </h4>
          <div className="variables-table">
            {Object.entries(currentStep.variables).map(([key, val]) => (
              <div key={key} className="variable-row">
                <span className="var-name">{key}:</span>
                <span className="var-val">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="inspector-card">
          <h4>
            <FiLayers /> Call Stack Execution Trace
          </h4>
          <div className="call-stack-list">
            {(currentStep.callStack || ["main()"]).map((frame, fIdx) => (
              <div key={fIdx} className="stack-frame">
                <span className="frame-depth">#{fIdx}</span>
                <span className="frame-func">{frame}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Array Input Form */}
      <form className="custom-input-bar" onSubmit={handleApplyCustomArray}>
        <FiSliders />
        <input
          type="text"
          placeholder="Custom array, e.g: 3, 5, 8, 12, 19, 25"
          value={customArrayInput}
          onChange={(e) => setCustomArrayInput(e.target.value)}
        />
        <button type="submit">Simulate Array</button>
      </form>
    </div>
  );
};

export default MemoryVisualizer;
