import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
} from "react-icons/fi";

import axios from "axios";

import apiClient from "../../api/apiClient";
import { saveAuthSession } from "../../utils/authStorage";

import "./LoginPage.scss";

interface RegisterResponse {
  success: boolean;
  message: string;

  data?: {
    email?: string;
    requiresVerification?: boolean;
  };
}

const RegisterPage = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/demo-login");
      const token = response.data?.data?.token;
      const user = response.data?.data?.user;
      if (token && user) {
        saveAuthSession(token, user);
        navigate("/dashboard/cs-automation", { replace: true });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Demo giriş zamanı xəta baş verdi."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const normalizedName =
      fullName.trim();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      normalizedName.length < 2
    ) {
      setError(
        "Full name must be at least 2 characters long."
      );

      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await apiClient.post<RegisterResponse>(
          "/auth/register",
          {
            fullName:
              normalizedName,

            email:
              normalizedEmail,

            password,
          }
        );

      const verificationEmail =
        response.data.data?.email ||
        normalizedEmail;

      localStorage.setItem(
        "interviewiq_pending_verification_email",
        verificationEmail
      );

      navigate(
        "/verify-email",
        {
          replace: true,

          state: {
            email:
              verificationEmail,
          },
        }
      );
    } catch (err) {
      if (
        axios.isAxiosError(err)
      ) {
        setError(
          err.response?.data
            ?.message ||
            "Unable to create account."
        );
      } else if (
        err instanceof Error
      ) {
        setError(
          err.message
        );
      } else {
        setError(
          "Unable to create account."
        );
      }
    } finally {
      setLoading(false);
    }
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
              Start preparing smarter.
            </h1>

            <p>
              Create your account and
              practice real interviews
              with instant AI feedback,
              resume analysis, and
              progress tracking.
            </p>
          </div>

          <p className="auth-copyright">
            © 2026 InterviewIQ AI.
            All rights reserved.
          </p>
        </section>

        <section className="auth-form-side">
          <div className="auth-form-wrapper register-form-wrapper">
            <div className="auth-top">
              <Link
                to="/"
                className="mobile-auth-brand"
              >
                InterviewIQ
                <span>AI</span>
              </Link>
            </div>

            <div className="auth-heading">
              <span className="auth-eyebrow">
                Get started
              </span>

              <h2>
                Create account
              </h2>

              <p>
                Create your free
                InterviewIQ account.
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
                və ya email ilə qeydiyyatdan keçin
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
                  Full name
                </span>

                <div className="input-wrapper">
                  <FiUser />

                  <input
                    type="text"
                    value={fullName}
                    onChange={(
                      event
                    ) =>
                      setFullName(
                        event.target.value
                      )
                    }
                    placeholder="John Doe"
                    autoComplete="name"
                    required
                  />
                </div>
              </label>

              <label className="auth-field">
                <span>
                  Email
                </span>

                <div className="input-wrapper">
                  <FiMail />

                  <input
                    type="email"
                    value={email}
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event.target.value
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
                    value={password}
                    onChange={(
                      event
                    ) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    minLength={6}
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

              <label className="auth-field">
                <span>
                  Confirm password
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
                      confirmPassword
                    }
                    onChange={(
                      event
                    ) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
              </label>

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading
                  ? "Sending verification code..."
                  : "Create account"}

                {!loading && (
                  <FiArrowRight />
                )}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{" "}
              <Link to="/login">
                Log in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;