import { useLocation } from "react-router";
import WebsiteChecker from "../components/WebsiteChecker";
import { ButtonLink } from "../ui/Button";
import { Container, PageHeader } from "../ui/Layout";

export default function Website() {
  const location = useLocation();
  const st = location.state as { url?: string } | null;
  return (
    <Container wide className="pt-10 md:pt-14">
      <PageHeader
        eyebrow="Website check"
        title="Who really owns this link?"
        description="Paste a link from a message. CUSTODI reads the address — without opening it — and explains any tricks it finds."
        actions={
          <ButtonLink to="/extension" variant="secondary">
            Check the page you're on →
          </ButtonLink>
        }
      />
      <div className="mt-8">
        <WebsiteChecker initialUrl={st?.url ?? ""} />
      </div>
    </Container>
  );
}
