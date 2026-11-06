import { ButtonLink } from "../ui/Button";
import { Container } from "../ui/Layout";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center pt-32 text-center">
      <p className="t-display text-accent">404</p>
      <p className="mt-4 text-muted">This page doesn't exist.</p>
      <div className="mt-6 flex gap-2">
        <ButtonLink to="/">Home</ButtonLink>
        <ButtonLink to="/scan" variant="secondary">
          Scan a message
        </ButtonLink>
      </div>
    </Container>
  );
}
