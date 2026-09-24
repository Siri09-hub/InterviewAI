import type { ReactNode } from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Decorative background gradients */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/4 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-indigo-200 via-violet-200 to-transparent opacity-60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-blue-200 via-indigo-100 to-transparent opacity-50 blur-3xl"
      />

      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <ForDevelopers />
      <Resources />
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Navbar                                                                */
/* -------------------------------------------------------------------- */

function Navbar() {
  return (
    <header className="relative z-10 border-b border-slate-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            InterviewAI
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a
            href="#features"
            className="transition-colors hover:text-slate-900"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="transition-colors hover:text-slate-900"
          >
            How It Works
          </a>

          <a
            href="#developers"
            className="transition-colors hover:text-slate-900"
          >
            For Developers
          </a>

          <a
            href="#resources"
            className="transition-colors hover:text-slate-900"
          >
            Resources
          </a>
        </div>

        <div className="flex items-center gap-3">
          {/* Sign In */}
          <Link
            href="/login"
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:inline-flex"
          >
            Sign in
          </Link>

          {/* Get Started */}
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* -------------------------------------------------------------------- */
/* Hero                                                                  */
/* -------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-8 lg:pt-24">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        {/* Left column */}
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <SparkleIcon className="h-3.5 w-3.5" />
            AI-Powered Interviews
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Ace Your Next Interview with{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              AI
            </span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-slate-500">
            Real-time adaptive interviews, intelligent feedback, and live
            coding evaluation — all powered by AI.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {/* Start Interview → LOGIN */}
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-transform hover:scale-[1.02]"
            >
              Start Interview
              <ArrowRightIcon className="h-4 w-4" />
            </Link>

            {/* See How It Works */}
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <PlayIcon className="h-4 w-4" />
              See How It Works
            </a>
          </div>
        </div>

        {/* Right column */}
        <DashboardMockup />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */
/* Dashboard / code-editor visual (decorative, static HTML/CSS only)    */
/* -------------------------------------------------------------------- */

function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-lg pb-28 pl-6 pr-2 pt-6 lg:mx-0">
      {/* Main app card */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-indigo-100">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden w-36 flex-col gap-1 border-r border-slate-100 bg-slate-50/60 p-4 sm:flex">
            <div className="mb-4 flex items-center gap-2 px-1">
              <LogoMark size="sm" />
              <span className="text-xs font-semibold text-slate-900">
                InterviewAI
              </span>
            </div>

            <SidebarItem
              icon={<GridIcon className="h-3.5 w-3.5" />}
              label="Dashboard"
              active
            />
            <SidebarItem
              icon={<ChatIcon className="h-3.5 w-3.5" />}
              label="Interviews"
            />
            <SidebarItem
              icon={<CodeIcon className="h-3.5 w-3.5" />}
              label="Practice"
            />
            <SidebarItem
              icon={<ChartIcon className="h-3.5 w-3.5" />}
              label="Reports"
            />
            <SidebarItem
              icon={<UserIcon className="h-3.5 w-3.5" />}
              label="Profile"
            />
            <SidebarItem
              icon={<GearIcon className="h-3.5 w-3.5" />}
              label="Settings"
            />
          </aside>

          {/* Main panel */}
          <div className="flex-1 p-5">
            <p className="text-sm font-semibold text-slate-900">
              Welcome back
            </p>
            <p className="text-xs text-slate-500">
              Ready for your next interview?
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniFeatureCard
                icon={<ChatIcon className="h-4 w-4 text-indigo-600" />}
                tint="bg-indigo-50"
                title="AI Interview"
                subtitle="Adaptive Q&A"
              />

              <MiniFeatureCard
                icon={<CodeIcon className="h-4 w-4 text-amber-600" />}
                tint="bg-amber-50"
                title="Live Coding"
                subtitle="Real-time IDE"
              />

              <MiniFeatureCard
                icon={<ChartIcon className="h-4 w-4 text-emerald-600" />}
                tint="bg-emerald-50"
                title="Feedback"
                subtitle="Detailed Analysis"
              />
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 p-3">
              <p className="text-[11px] font-semibold text-slate-700">
                Your Progress
              </p>
              <ProgressChart />
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute right-0 top-0 z-10 hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-xl sm:block">
        <FeedbackBadge />
      </div>

      {/* Floating code editor panel */}
      <div className="absolute bottom-0 left-0 z-10 w-60 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl sm:w-72">
        <CodeEditor />
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium ${
        active ? "bg-indigo-50 text-indigo-700" : "text-slate-500"
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

function MiniFeatureCard({
  icon,
  tint,
  title,
  subtitle,
}: {
  icon: ReactNode;
  tint: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 p-2">
      <div
        className={`mb-1.5 flex h-6 w-6 items-center justify-center rounded-md ${tint}`}
      >
        {icon}
      </div>

      <p className="text-[10px] font-semibold leading-tight text-slate-800">
        {title}
      </p>

      <p className="text-[9px] text-slate-400">{subtitle}</p>
    </div>
  );
}

function ProgressChart() {
  return (
    <div className="mt-2">
      <svg
        viewBox="0 0 120 40"
        className="h-14 w-full"
        preserveAspectRatio="none"
      >
        <polyline
          points="0,32 20,26 40,30 60,16 80,20 100,8 120,14"
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <defs>
          <linearGradient
            id="progressGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>

      <div className="mt-1 flex justify-between text-[8px] text-slate-400">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
    </div>
  );
}

function FeedbackBadge() {
  return (
    <div className="flex flex-col items-center gap-1 px-1">
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background:
            "conic-gradient(#4f46e5 0deg 300deg, #e2e8f0 300deg 360deg)",
        }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
          <CheckIcon className="h-4 w-4 text-indigo-600" />
        </div>
      </div>

      <p className="text-center text-[9px] font-medium leading-tight text-slate-500">
        Feedback
        <br />
        Ready
      </p>
    </div>
  );
}

function CodeEditor() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>

        <span className="text-[9px] text-slate-400">Python</span>
      </div>

      <pre className="overflow-x-auto px-3 py-3 text-[9px] leading-relaxed">
        <code>
          <span className="text-violet-400">def</span>{" "}
          <span className="text-blue-400">two_sum</span>
          <span className="text-slate-300">(nums, target):</span>
          {"\n"}
          <span className="text-slate-300">    seen = {"{}"}</span>
          {"\n"}
          <span className="text-violet-400">    for</span>{" "}
          <span className="text-slate-300">
            i, n in enumerate(nums):
          </span>
          {"\n"}
          <span className="text-violet-400">        if</span>{" "}
          <span className="text-slate-300">
            target - n in seen:
          </span>
          {"\n"}
          <span className="text-violet-400">            return</span>{" "}
          <span className="text-slate-300">
            [seen[target - n], i]
          </span>
          {"\n"}
          <span className="text-slate-300">        seen[n] = i</span>
          {"\n"}
          <span className="text-violet-400">    return</span>{" "}
          <span className="text-slate-300">[]</span>
        </code>
      </pre>

      <div className="flex gap-2 border-t border-slate-800 px-3 py-2">
        <button
          type="button"
          className="rounded-md bg-slate-800 px-2.5 py-1 text-[9px] font-medium text-slate-200"
        >
          Run Code
        </button>

        <button
          type="button"
          className="rounded-md bg-emerald-500 px-2.5 py-1 text-[9px] font-medium text-white"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Features                                                              */
/* -------------------------------------------------------------------- */

function Features() {
  const features: Array<{
    icon: ReactNode;
    tint: string;
    title: string;
    description: string;
  }> = [
    {
      icon: <ChatIcon className="h-5 w-5 text-indigo-600" />,
      tint: "bg-indigo-50",
      title: "AI-Powered Interviews",
      description:
        "Adaptive questions that respond to your answers in real time.",
    },
    {
      icon: <CodeIcon className="h-5 w-5 text-amber-600" />,
      tint: "bg-amber-50",
      title: "Live Coding Evaluation",
      description:
        "Solve problems in a real-time editor built for live assessment.",
    },
    {
      icon: <ChartIcon className="h-5 w-5 text-blue-600" />,
      tint: "bg-blue-50",
      title: "Smart Analytics",
      description:
        "Clear, structured feedback on strengths and areas to improve.",
    },
    {
      icon: <MicIcon className="h-5 w-5 text-emerald-600" />,
      tint: "bg-emerald-50",
      title: "Voice Interviews",
      description:
        "Natural, real-time voice conversation with your AI interviewer.",
    },
  ];

  return (
    <section
      id="features"
      className="relative z-10 scroll-mt-20 border-t border-slate-100 bg-slate-50/60"
    >
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.tint}`}
              >
                {feature.icon}
              </div>

              <h3 className="text-base font-semibold text-slate-900">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */
/* How It Works                                                          */
/* -------------------------------------------------------------------- */

function HowItWorks() {
  const steps: Array<{ title: string; description: string }> = [
    {
      title: "Choose your track",
      description:
        "Pick a role and interview type so every question matches what you're preparing for.",
    },
    {
      title: "Talk with your AI interviewer",
      description:
        "Answer questions that adapt in real time based on how you respond.",
    },
    {
      title: "Solve live coding problems",
      description:
        "Work through problems in a real-time editor built for live assessment.",
    },
    {
      title: "Review your feedback",
      description:
        "Get a clear, structured breakdown of your strengths and areas to improve.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative z-10 scroll-mt-20 border-t border-slate-100 bg-white"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            How It Works
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            From setup to feedback in four steps
          </h2>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-semibold text-white">
                {String(index + 1).padStart(2, "0")}
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {step.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */
/* For Developers                                                        */
/* -------------------------------------------------------------------- */

function ForDevelopers() {
  const points: string[] = [
    "A clean REST API for creating and managing interview sessions",
    "Real-time streaming for live coding and conversational turns",
    "SDKs and documentation designed to get you integrated quickly",
  ];

  return (
    <section
      id="developers"
      className="relative z-10 scroll-mt-20 border-t border-slate-100 bg-slate-50/60"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              For Developers
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Built with a clean API surface
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Integrate adaptive interviews and live coding evaluation into
              your own product with an API designed for developers.
            </p>

            <ul className="mt-6 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <CheckIcon className="h-3 w-3" />
                  </span>

                  <span className="text-sm leading-relaxed text-slate-600">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>

              <span className="text-[10px] text-slate-400">
                POST /v1/interviews
              </span>
            </div>

            <pre className="overflow-x-auto px-4 py-4 text-[11px] leading-relaxed">
              <code>
                <span className="text-slate-300">{"{"}</span>
                {"\n"}
                <span className="text-blue-400">  &quot;track&quot;</span>
                <span className="text-slate-300">: </span>
                <span className="text-emerald-400">
                  &quot;backend-engineer&quot;
                </span>
                <span className="text-slate-300">,</span>
                {"\n"}
                <span className="text-blue-400">  &quot;mode&quot;</span>
                <span className="text-slate-300">: </span>
                <span className="text-emerald-400">
                  &quot;live-coding&quot;
                </span>
                <span className="text-slate-300">,</span>
                {"\n"}
                <span className="text-blue-400">  &quot;language&quot;</span>
                <span className="text-slate-300">: </span>
                <span className="text-emerald-400">&quot;python&quot;</span>
                {"\n"}
                <span className="text-slate-300">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */
/* Resources                                                             */
/* -------------------------------------------------------------------- */

function Resources() {
  const resources: Array<{
    icon: ReactNode;
    tint: string;
    title: string;
    description: string;
  }> = [
    {
      icon: <DocIcon className="h-5 w-5 text-indigo-600" />,
      tint: "bg-indigo-50",
      title: "Documentation",
      description: "Guides for getting the most out of every feature.",
    },
    {
      icon: <BookIcon className="h-5 w-5 text-amber-600" />,
      tint: "bg-amber-50",
      title: "Guides & Tutorials",
      description: "Step-by-step walkthroughs for common interview tracks.",
    },
    {
      icon: <ChatIcon className="h-5 w-5 text-blue-600" />,
      tint: "bg-blue-50",
      title: "Community",
      description:
        "Connect with other candidates preparing alongside you.",
    },
    {
      icon: <FeedIcon className="h-5 w-5 text-emerald-600" />,
      tint: "bg-emerald-50",
      title: "Blog",
      description: "Tips and updates on interview preparation and hiring.",
    },
  ];

  return (
    <section
      id="resources"
      className="relative z-10 scroll-mt-20 border-t border-slate-100 bg-white"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            Resources
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to get started
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource) => (
            <div
              key={resource.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${resource.tint}`}
              >
                {resource.icon}
              </div>

              <h3 className="text-base font-semibold text-slate-900">
                {resource.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {resource.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */
/* Icons                                                                 */
/* -------------------------------------------------------------------- */

function LogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const icon = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span
      className={`flex ${box} items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600`}
    >
      <svg viewBox="0 0 24 24" className={`${icon} fill-white`}>
        <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
      </svg>
    </span>
  );
}

function SparkleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  );
}

function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function PlayIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ChatIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function CodeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}

function ChartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />
    </svg>
  );
}

function MicIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

function GridIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function UserIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function GearIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9c.14-.32.22-.66.22-1s-.08-.68-.22-1a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 4.6a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 9 9c.32.14.66.22 1 .22s.68-.08 1-.22a1.65 1.65 0 0 0 1-1.51V7.4a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51c.32.14.66.22 1 .22s.68-.08 1-.22a1.65 1.65 0 0 0 1.51-1H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15z" />
    </svg>
  );
}

function DocIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}

function BookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function FeedIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}