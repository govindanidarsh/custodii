import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { Shell } from "./components/Shell";
import { getFlags, setFlag } from "./lib/store";
import { ToastProvider } from "./ui/Feedback";
import Home from "./pages/Home";
import Scan from "./pages/Scan";

const Intro = lazy(() => import("./components/Intro"));
import { IntroBoundary } from "./components/Intro";
const Website = lazy(() => import("./pages/Website"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Lab = lazy(() => import("./pages/Lab"));
const Live = lazy(() => import("./pages/Live"));
const Extension = lazy(() => import("./pages/Extension"));
const Help = lazy(() => import("./pages/Help"));
const Settings = lazy(() => import("./pages/Settings"));
const College = lazy(() => import("./pages/College"));
const NotFound = lazy(() => import("./pages/NotFound"));

const TITLES: Record<string, string> = {
  "/": "CUSTODI — Think before you trust",
  "/scan": "Message scan · CUSTODI",
  "/website": "Website check · CUSTODI",
  "/live": "Live Observe · CUSTODI",
  "/dashboard": "Dashboard · CUSTODI",
  "/lab": "Test Lab · CUSTODI",
  "/help": "How it works · CUSTODI",
  "/settings": "Settings · CUSTODI",
  "/extension": "Chrome extension · CUSTODI",
  "/college-demo": "College demo (fictional) · CUSTODI",
};

function Page({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.main
      id="main"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transitionEnd: { transform: "none" } }}
      exit={reduce ? undefined : { opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-[70vh]"
    >
      {children}
    </motion.main>
  );
}

export default function App() {
  const location = useLocation();
  const reduce = !!useReducedMotion();
  // A first visit to the home page plays the intro automatically (reduced motion gets a still card).
  // Deep links and later visits go straight to the page; Replay is in the footer and Settings.
  const [intro, setIntro] = useState(() => location.pathname === "/" && !getFlags().introSeen);

  useEffect(() => {
    document.title = TITLES[location.pathname] ?? "CUSTODI";
    if (location.hash) {
      // Pages are lazy-loaded: wait (up to ~3 s) for the anchor to exist, then scroll to it.
      let tries = 0;
      const id = setInterval(() => {
        const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (el || ++tries > 30) {
          clearInterval(id);
          el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }
      }, 100);
      return () => clearInterval(id);
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname, location.hash, reduce]);

  const endIntro = () => {
    setFlag({ introSeen: true });
    setIntro(false);
  };

  const replay = () => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setIntro(true);
  };

  return (
    <ToastProvider>
      <Shell onReplayIntro={replay}>
        <AnimatePresence mode="wait">
          <Suspense fallback={<div className="min-h-[70vh]" />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Page><Home /></Page>} />
              <Route path="/scan" element={<Page><Scan /></Page>} />
              <Route path="/website" element={<Page><Website /></Page>} />
              <Route path="/live" element={<Page><Live /></Page>} />
              <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
              <Route path="/lab" element={<Page><Lab /></Page>} />
              <Route path="/help" element={<Page><Help /></Page>} />
              <Route path="/extension" element={<Page><Extension /></Page>} />
              <Route path="/settings" element={<Page><Settings onReplayIntro={replay} /></Page>} />
              <Route path="/college-demo" element={<Page><College /></Page>} />
              <Route path="/privacy" element={<Navigate to="/help#privacy" replace />} />
              <Route path="*" element={<Page><NotFound /></Page>} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </Shell>
      {intro && (
        <IntroBoundary onError={endIntro}>
          <Suspense fallback={null}>
            <Intro reduced={reduce} onDone={endIntro} />
          </Suspense>
        </IntroBoundary>
      )}
    </ToastProvider>
  );
}
