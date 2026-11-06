import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";
import { LIMITATION_STATEMENT } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <Container className="py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              A second opinion for students on placement, internship and recruiter messages. Built for the Arthakram Rapid Prototyping
              Hackathon.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p className="font-semibold text-ink">Product</p>
              <ul className="mt-2 space-y-1 text-muted">
                <li>
                  <a className="inline-block py-1 hover:text-ink" href="#analyze">
                    Check a message
                  </a>
                </li>
                <li>
                  <a className="inline-block py-1 hover:text-ink" href="#how-it-works">
                    How it works
                  </a>
                </li>
                <li>
                  <a className="inline-block py-1 hover:text-ink" href="#features">
                    Features
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-ink">Trust</p>
              <ul className="mt-2 space-y-1 text-muted">
                <li>
                  <a className="inline-block py-1 hover:text-ink" href="#privacy">
                    Privacy &amp; security
                  </a>
                </li>
                <li>
                  <a className="inline-block py-1 hover:text-ink" href="#limitations">
                    Limitations
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="font-semibold text-ink">If you’re unsure</p>
              <p className="mt-3 text-muted">Contact your college placement cell through a channel you already know.</p>
            </div>
          </div>
        </div>
        <p id="limitations" className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          {LIMITATION_STATEMENT}
        </p>
        <p className="mt-3 text-xs text-muted">
          © {new Date().getFullYear()} TrustLayer AI team. All sample messages on this site are fictional.
        </p>
      </Container>
    </footer>
  );
}
