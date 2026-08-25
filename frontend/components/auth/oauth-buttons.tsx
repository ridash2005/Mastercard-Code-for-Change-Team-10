// Shared "Continue with Google/GitHub" buttons for the login and register
// pages - both are literally the same backend flow (see backend/api's
// controllers/oauthController.js's docstring: OAuth doesn't distinguish
// sign-in from sign-up, the first use of a provider IS the sign-up), so one
// component covers both pages instead of duplicating the markup.

import { useI18n } from "@/lib/i18n/provider";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.3 0 10.1-2 13.7-5.4l-6.3-5.3C29.4 35 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.3 5.3C41.4 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.35.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.21.66.8.55C20.21 21.4 23.5 17.09 23.5 12c0-6.27-5.23-11.5-11.5-11.5z" />
    </svg>
  );
}

export function OAuthButtons({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="space-y-2">
        <a
          href="/api/auth/google"
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
        >
          <GoogleIcon />
          {t.continueWithGoogle}
        </a>
        <a
          href="/api/auth/github"
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-stone-300 bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          <GithubIcon />
          {t.continueWithGithub}
        </a>
      </div>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-stone-400">
        <span className="h-px flex-1 bg-stone-200" />
        {label ?? t.orContinueWithEmail}
        <span className="h-px flex-1 bg-stone-200" />
      </div>
    </div>
  );
}
