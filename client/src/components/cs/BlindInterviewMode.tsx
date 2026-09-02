import React from "react";
import {
  FiPhoneCall,
  FiVolume2,
  FiVolumeX,
  FiMic,
  FiMicOff,
  FiEdit3,
  FiCode,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import "./blindInterviewMode.scss";

interface BlindInterviewModeProps {
  interviewerName: string;
  interviewerCompany: string;
  interviewerAvatar: string;
  isSpeaking: boolean;
  isListening: boolean;
  interimSpeech: string;
  userAnswer: string;
  onToggleSpeakQuestion: () => void;
  onToggleVoiceDictation: () => void;
  onSwitchToCodeEditor: () => void;
  onOpenWhiteboard: () => void;
  onSubmitAnswer: () => void;
  isSubmitting: boolean;
}

export const BlindInterviewMode: React.FC<BlindInterviewModeProps> = ({
  interviewerName,
  interviewerCompany,
  interviewerAvatar,
  isSpeaking,
  isListening,
  interimSpeech,
  userAnswer,
  onToggleSpeakQuestion,
  onToggleVoiceDictation,
  onSwitchToCodeEditor,
  onOpenWhiteboard,
  onSubmitAnswer,
  isSubmitting,
}) => {
  return (
    <div className="blind-interview-container">
      {/* Active Call Header Banner */}
      <div className="call-status-bar">
        <div className="status-indicator">
          <span className="live-call-dot" />
          <FiPhoneCall />
          <span>Active Tele-Screening Session</span>
        </div>
        <div className="call-mode-pill">Blind Audio-Only Protocol</div>
      </div>

      {/* Main Calling Radar Circle & Waveform */}
      <div className="tele-call-center">
        <div className="radar-circle-outer">
          <div className="radar-circle-middle">
            <div className={`radar-circle-inner ${isSpeaking || isListening ? "pulsing" : ""}`}>
              <div className="interviewer-avatar-box">
                <span className="avatar-icon">{interviewerAvatar}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="interviewer-details">
          <h2>{interviewerName}</h2>
          <span className="company-tag">{interviewerCompany} Interview Committee</span>
          <p className="call-hint">
            {isSpeaking
              ? "Interviewer is speaking. Listen attentively to question requirements..."
              : isListening
              ? "Microphone listening. Explain your algorithmic strategy, data structure choice, and complexity..."
              : "Question ready. Click 'Listen to Problem' or activate the microphone to answer verbally."}
          </p>
        </div>

        {/* Dynamic Voice Waves Animation */}
        <div className="voice-equalizer-bars">
          {[...Array(9)].map((_, i) => (
            <span
              key={i}
              className={`bar ${isSpeaking ? "speaking" : isListening ? "listening" : ""}`}
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      </div>

      {/* Primary Voice Controls */}
      <div className="blind-controls-action-bar">
        <button
          type="button"
          className={`blind-action-btn listen-btn ${isSpeaking ? "active" : ""}`}
          onClick={onToggleSpeakQuestion}
        >
          {isSpeaking ? (
            <>
              <FiVolumeX /> Stop Voice
            </>
          ) : (
            <>
              <FiVolume2 /> Listen to Problem
            </>
          )}
        </button>

        <button
          type="button"
          className={`blind-action-btn mic-btn ${isListening ? "active" : ""}`}
          onClick={onToggleVoiceDictation}
        >
          {isListening ? (
            <>
              <FiMicOff /> Stop Dictating
            </>
          ) : (
            <>
              <FiMic /> Dictate Verbal Solution
            </>
          )}
        </button>

        <button
          type="button"
          className="blind-action-btn secondary-btn"
          onClick={onOpenWhiteboard}
        >
          <FiEdit3 /> Scratchpad Whiteboard
        </button>

        <button
          type="button"
          className="blind-action-btn secondary-btn"
          onClick={onSwitchToCodeEditor}
        >
          <FiCode /> Switch to Code Editor
        </button>
      </div>

      {/* Verbal Solution Transcript Note Pad */}
      <div className="verbal-transcript-card">
        <div className="transcript-header">
          <h4>
            <FiCheckCircle /> Candidate Verbal Explanation & Notes
          </h4>
          <span className="word-count">
            {userAnswer ? userAnswer.trim().split(/\s+/).length : 0} words recorded
          </span>
        </div>

        {isListening && interimSpeech && (
          <div className="interim-hearing-live">
            <span className="pulse-dot" />
            <em>"{interimSpeech}"</em>
          </div>
        )}

        <div className="transcript-body">
          {userAnswer ? (
            <p>{userAnswer}</p>
          ) : (
            <div className="empty-transcript-state">
              <FiAlertCircle />
              <span>
                No verbal notes recorded yet. Press <strong>"Dictate Verbal Solution"</strong> and
                explain your algorithmic approach into the microphone.
              </span>
            </div>
          )}
        </div>

        {/* Submit Verbal Explanation for Evaluation */}
        <div className="transcript-footer">
          <button
            type="button"
            className="submit-verbal-btn"
            onClick={onSubmitAnswer}
            disabled={isSubmitting || !userAnswer.trim()}
          >
            {isSubmitting ? "Evaluating Voice Answer..." : "Submit Verbal Solution for AI Evaluation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlindInterviewMode;
