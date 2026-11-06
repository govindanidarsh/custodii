import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import GettingStarted from "../components/GettingStarted";
import MessageScanner from "../components/MessageScanner";
import { ButtonLink } from "../ui/Button";
import { Notice } from "../ui/Feedback";
import { Container, PageHeader } from "../ui/Layout";

export default function Scan() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [shared, setShared] = useState<string | null>(null);

  // 1) Web Share Target (installed PWA): read shared text once, then remove it from the address bar.
  // 2) Quick-scan box on the home page passes text through router state (never the URL).
  useEffect(() => {
    const text = [params.get("title"), params.get("text")].filter(Boolean).join("\n").trim();
    const url = (params.get("url") ?? "").trim();
    if (!text && url) {
      navigate("/website", { replace: true, state: { url } });
      return;
    }
    if (text) {
      setShared(text);
      window.history.replaceState(null, "", "/scan");
      return;
    }
    const st = location.state as { text?: string } | null;
    if (st?.text) setShared(st.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container wide className="pt-10 md:pt-14">
      <PageHeader
        eyebrow="Message scan"
        title="Is this message safe to act on?"
        description="Paste a placement, internship or recruiter message. CUSTODI shows the risk, quotes the exact words that worry it, and tells you what to do next."
        actions={
          <ButtonLink to="/website" variant="secondary">
            Check a link instead
          </ButtonLink>
        }
      />
      <div className="mt-8 space-y-8">
        {shared && <Notice tone="info">Message received from another app. Review it, then tap Analyse.</Notice>}
        <GettingStarted />
        <MessageScanner initialText={shared ?? ""} origin={params.get("source") === "share" || shared ? "pwa-share" : "web"} />
      </div>
    </Container>
  );
}
