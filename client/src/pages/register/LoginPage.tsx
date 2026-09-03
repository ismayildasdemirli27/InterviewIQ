import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
} from "react-icons/fi";

import axios from "axios";

import apiClient from "../../api/apiClient";
import { saveAuthSession } from "../../utils/authStorage";

import "./LoginPage.scss";

interface AuthUser {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  authProvider?: "local" | "google";
  isEmailVerified?: boolean;
}

interface AuthResponse {
  data?: {
    token?: string;
    user?: AuthUser;
  };
}

type AuthView =
  | "login"
  | "forgot"
  | "reset"
  | "reset-success";

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    rememberMe,
    setRememberMe,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    authView,
    setAuthView,
  ] = useState<AuthView>("login");

  const [
    resetEmail,
    setResetEmail,
  ] = useState("");

  const [
    resetCode,
    setResetCode,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState("");

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    forgotLoading,
    setForgotLoading,
  ] = useState(false);

  const [
    resetLoading,
    setResetLoading,
  ] = useState(false);

  useEffect(() => {
    const savedEmail =
      localStorage.getItem(
        "interviewiq_remember_email"
      );

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const completeAuthentication = (
    responseData: AuthResponse
  ) => {
    const token =
      responseData.data?.token;

    const user =
      responseData.data?.user;

    if (!token || !user) {
      throw new Error(
        "Authentication response is incomplete."
      );
    }

    saveAuthSession(
      token,
      user
    );

    localStorage.removeItem(
      "interviewiq_pending_verification_email"
    );

    navigate(
      "/dashboard",
      {
        replace: true,
      }
    );
  };

  const handleDemoLogin = async () => {
    clearMessages();
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/demo-login");
      completeAuthentication(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Demo giriş xətası baş verdi. Zəhmət olmasa yenidən cəhd edin."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("guest") === "true" || params.get("demo") === "true" || params.get("auto") === "true") {
      void handleDemoLogin();
    }
  }, []);

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      clearMessages();
      setLoading(true);

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      try {
        const response =
          await apiClient.post(
            "/auth/login",
            {
              email:
                normalizedEmail,
              password,
            }
          );

        if (rememberMe) {
          localStorage.setItem(
            "interviewiq_remember_email",
            normalizedEmail
          );
        } else {
          localStorage.removeItem(
            "interviewiq_remember_email"
          );
        }

        completeAuthentication(
          response.data
        );
      } catch (err) {
        if (
          axios.isAxiosError(err)
        ) {
          const requiresVerification =
            err.response?.data
              ?.data
              ?.requiresVerification ===
            true;

          if (
            requiresVerification
          ) {
            const verificationEmail =
              err.response?.data
                ?.data?.email ||
              normalizedEmail;

            localStorage.setItem(
              "interviewiq_pending_verification_email",
              verificationEmail
            );

            navigate(
              "/verify-email",
              {
                state: {
                  email:
                    verificationEmail,
                },
              }
            );

            return;
          }

          setError(
            err.response?.data
              ?.message ||
              "Unable to log in. Please try again."
          );
        } else if (
          err instanceof Error
        ) {
          setError(
            err.message
          );
        } else {
          setError(
            "Unable to log in. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    };

  const openForgotPassword = () => {
    clearMessages();

    setResetEmail(
      email
        .trim()
        .toLowerCase()
    );

    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");

    setAuthView("forgot");
  };

  const backToLogin = () => {
    clearMessages();

    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");

    setAuthView("login");
  };

  const handleForgotPassword =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      clearMessages();

      const normalizedEmail =
        resetEmail
          .trim()
          .toLowerCase();

      if (!normalizedEmail) {
        setError(
          "Please enter your email address."
        );

        return;
      }

      setForgotLoading(true);

      try {
        const response =
          await apiClient.post(
            "/auth/forgot-password",
            {
              email:
                normalizedEmail,
            }
          );

        setResetEmail(
          normalizedEmail
        );

        setSuccess(
          response.data?.message ||
            "Password reset code sent."
        );

        setAuthView("reset");
      } catch (err) {
        if (
          axios.isAxiosError(err)
        ) {
          setError(
            err.response?.data
              ?.message ||
              "Unable to send reset code."
          );
        } else {
          setError(
            "Unable to send reset code."
          );
        }
      } finally {
        setForgotLoading(false);
      }
    };

  const handleResetPassword =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      clearMessages();

      if (
        !/^\d{6}$/.test(
          resetCode
        )
      ) {
        setError(
          "Reset code must be 6 digits."
        );

        return;
      }

      if (
        newPassword.length < 6
      ) {
        setError(
          "New password must be at least 6 characters long."
        );

        return;
      }

      if (
        newPassword !==
        confirmNewPassword
      ) {
        setError(
          "Passwords do not match."
        );

        return;
      }

      setResetLoading(true);

      try {
        await apiClient.post(
          "/auth/reset-password",
          {
            email:
              resetEmail,
            code:
              resetCode,
            newPassword,
            confirmPassword:
              confirmNewPassword,
          }
        );

        setPassword("");
        setEmail(
          resetEmail
        );

        setAuthView(
          "reset-success"
        );
      } catch (err) {
        if (
          axios.isAxiosError(err)
        ) {
          setError(
            err.response?.data
              ?.message ||
              "Unable to reset password."
          );
        } else {
          setError(
            "Unable to reset password."
          );
        }
      } finally {
        setResetLoading(false);
      }
    };

  const showLoginAgain = () => {
    clearMessages();

    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");

    setAuthView("login");
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-visual">
          <Link
            to="/"
            className="auth-brand"
          >
            InterviewIQ
            <span>AI</span>
          </Link>

          <div className="auth-visual-content">
            <h1>
              {authView === "login"
                ? "Welcome back."
                : "Secure your account."}
            </h1>

            <p>
              {authView === "login"
                ? "Log in to continue your interview preparation journey and track your progress."
                : "Reset your password securely and get back to your interview preparation."}
            </p>
          </div>

          <p className="auth-copyright">
            © 2026 InterviewIQ AI.
            All rights reserved.
          </p>
        </section>

        <section className="auth-form-side">
          <div className="auth-form-wrapper">
            <Link
              to="/"
              className="mobile-auth-brand"
            >
              InterviewIQ
              <span>AI</span>
            </Link>

            {authView ===
              "login" && (
              <>
                <div className="auth-heading">
                  <span className="auth-eyebrow">
                    Welcome back
                  </span>

                  <h2>
                    Log in
                  </h2>

                  <p>
                    Enter your credentials
                    to access your account.
                  </p>
                </div>

                {error && (
                  <div className="auth-error">
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: "1.25rem" }}>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "0.85rem 1.25rem",
                      background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    ⚡ Demo Hesabla Daxil Ol (1-Kliklə Test)
                  </button>
                </div>

                <div className="auth-divider">
                  <span>
                    və ya email ilə daxil olun
                  </span>
                </div>

                <form
                  className="auth-form"
                  onSubmit={
                    handleSubmit
                  }
                >
                  <label className="auth-field">
                    <span>
                      Email
                    </span>

                    <div className="input-wrapper">
                      <FiMail />

                      <input
                        type="email"
                        value={
                          email
                        }
                        onChange={(
                          event
                        ) =>
                          setEmail(
                            event.target
                              .value
                          )
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>
                      Password
                    </span>

                    <div className="input-wrapper">
                      <FiLock />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={
                          password
                        }
                        onChange={(
                          event
                        ) =>
                          setPassword(
                            event.target
                              .value
                          )
                        }
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowPassword(
                            (previous) =>
                              !previous
                          )
                        }
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <FiEyeOff />
                        ) : (
                          <FiEye />
                        )}
                      </button>
                    </div>
                  </label>

                  <div className="auth-options">
                    <label className="remember">
                      <input
                        type="checkbox"
                        checked={
                          rememberMe
                        }
                        onChange={(
                          event
                        ) =>
                          setRememberMe(
                            event.target
                              .checked
                          )
                        }
                      />

                      <span>
                        Remember me
                      </span>
                    </label>

                    <button
                      type="button"
                      className="forgot-password-button"
                      onClick={
                        openForgotPassword
                      }
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                  >
                    {loading
                      ? "Logging in..."
                      : "Log in"}

                    {!loading && (
                      <FiArrowRight />
                    )}
                  </button>
                </form>

                <p className="auth-switch">
                  Don&apos;t have an
                  account?{" "}
                  <Link to="/register">
                    Create one
                  </Link>
                </p>
              </>
            )}

            {authView ===
              "forgot" && (
              <>
                <button
                  type="button"
                  className="auth-back-button"
                  onClick={
                    backToLogin
                  }
                >
                  <FiArrowLeft />
                  Back to login
                </button>

                <div className="forgot-icon">
                  <FiMail />
                </div>

                <div className="auth-heading forgot-heading">
                  <span className="auth-eyebrow">
                    Password recovery
                  </span>

                  <h2>
                    Forgot password?
                  </h2>

                  <p>
                    Enter the email
                    connected to your
                    InterviewIQ account.
                    We&apos;ll send you
                    a 6-digit reset code.
                  </p>
                </div>

                {error && (
                  <div className="auth-error">
                    {error}
                  </div>
                )}

                <form
                  className="auth-form"
                  onSubmit={
                    handleForgotPassword
                  }
                >
                  <label className="auth-field">
                    <span>
                      Email
                    </span>

                    <div className="input-wrapper">
                      <FiMail />

                      <input
                        type="email"
                        value={
                          resetEmail
                        }
                        onChange={(
                          event
                        ) =>
                          setResetEmail(
                            event.target
                              .value
                          )
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={
                      forgotLoading
                    }
                  >
                    {forgotLoading
                      ? "Sending code..."
                      : "Send reset code"}

                    {!forgotLoading && (
                      <FiArrowRight />
                    )}
                  </button>
                </form>
              </>
            )}

            {authView ===
              "reset" && (
              <>
                <button
                  type="button"
                  className="auth-back-button"
                  onClick={() => {
                    clearMessages();
                    setAuthView(
                      "forgot"
                    );
                  }}
                >
                  <FiArrowLeft />
                  Change email
                </button>

                <div className="forgot-icon">
                  <FiLock />
                </div>

                <div className="auth-heading forgot-heading">
                  <span className="auth-eyebrow">
                    Reset password
                  </span>

                  <h2>
                    Create new password
                  </h2>

                  <p>
                    Enter the 6-digit
                    code sent to{" "}
                    <strong>
                      {resetEmail}
                    </strong>{" "}
                    and choose a new
                    password.
                  </p>
                </div>

                {error && (
                  <div className="auth-error">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="auth-success">
                    <FiCheckCircle />
                    {success}
                  </div>
                )}

                <form
                  className="auth-form"
                  onSubmit={
                    handleResetPassword
                  }
                >
                  <label className="auth-field">
                    <span>
                      Reset code
                    </span>

                    <div className="input-wrapper">
                      <FiLock />

                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          resetCode
                        }
                        onChange={(
                          event
                        ) =>
                          setResetCode(
                            event.target
                              .value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                6
                              )
                          )
                        }
                        placeholder="6-digit code"
                        maxLength={6}
                        autoComplete="one-time-code"
                        required
                      />
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>
                      New password
                    </span>

                    <div className="input-wrapper">
                      <FiLock />

                      <input
                        type={
                          showNewPassword
                            ? "text"
                            : "password"
                        }
                        value={
                          newPassword
                        }
                        onChange={(
                          event
                        ) =>
                          setNewPassword(
                            event.target
                              .value
                          )
                        }
                        placeholder="Minimum 6 characters"
                        minLength={6}
                        autoComplete="new-password"
                        required
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowNewPassword(
                            (previous) =>
                              !previous
                          )
                        }
                      >
                        {showNewPassword ? (
                          <FiEyeOff />
                        ) : (
                          <FiEye />
                        )}
                      </button>
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>
                      Confirm new password
                    </span>

                    <div className="input-wrapper">
                      <FiLock />

                      <input
                        type={
                          showNewPassword
                            ? "text"
                            : "password"
                        }
                        value={
                          confirmNewPassword
                        }
                        onChange={(
                          event
                        ) =>
                          setConfirmNewPassword(
                            event.target
                              .value
                          )
                        }
                        placeholder="Repeat new password"
                        minLength={6}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={
                      resetLoading
                    }
                  >
                    {resetLoading
                      ? "Updating password..."
                      : "Reset password"}

                    {!resetLoading && (
                      <FiArrowRight />
                    )}
                  </button>
                </form>
              </>
            )}

            {authView ===
              "reset-success" && (
              <div className="password-reset-success">
                <div className="password-reset-success__icon">
                  <FiCheckCircle />
                </div>

                <span className="auth-eyebrow">
                  Password updated
                </span>

                <h2>
                  Password reset successfully
                </h2>

                <p>
                  Your password has
                  been changed. You can
                  now sign in using
                  your new password.
                </p>

                <button
                  type="button"
                  className="auth-submit"
                  onClick={
                    showLoginAgain
                  }
                >
                  Back to login
                  <FiArrowRight />
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;