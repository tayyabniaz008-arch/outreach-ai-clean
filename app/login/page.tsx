"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    no_code: "Google authentication failed. Please try again.",
    no_email: "Could not get your email from Google.",
    config: "Google OAuth not configured.",
    callback_failed: "Something went wrong. Please try again.",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7fbfd",
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 420,
          width: "100%",
          padding: 40,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            marginBottom: 8,
            color: "#102a43",
          }}
        >
          OutreachAI
        </h1>
        <p
          className="muted"
          style={{
            marginBottom: 32,
            fontSize: 15,
          }}
        >
          Sign in to continue
        </p>

        {error && (
          <div
            style={{
              background: "#fbe9e9",
              color: "#a52a2a",
              padding: 12,
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            {errorMessages[error] || "An error occurred"}
          </div>
        )}

        <a
          href="/api/auth/google"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            width: "100%",
            padding: "14px 24px",
            background: "#fff",
            border: "1px solid #dbe8f0",
            borderRadius: 8,
            textDecoration: "none",
            color: "#102a43",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.6 20.1H42V20H24v8h11.3c-1.7 4.7-6.2 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.1 0-9.5-3.2-11.2-7.7l-6.5 5C9.6 39.6 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.4 35.7 44 30.2 44 24c0-1.3-.1-2.6-.4-3.9z"
            />
          </svg>
          Sign in with Google
        </a>

        <p
          className="muted small"
          style={{
            marginTop: 24,
            fontSize: 13,
          }}
        >
          Sign in securely with your Google account
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}