import { COMPANY } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-hair px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 36 36" className="h-8 w-8" fill="none">
                <circle cx="18" cy="18" r="16.5" stroke="var(--color-cyan)" strokeOpacity="0.4" />
                <path d="M11 10 L18 26 L25 10" stroke="var(--color-mist)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[20px] font-semibold tracking-tight">
                Voltage <span className="font-mono text-[10px] tracking-[0.3em] text-cyan">ENERGY</span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-mist-2">
              A live national energy-intelligence platform. Operating under{" "}
              {COMPANY.legal} — an active participant in Türkiye&apos;s
              liberalized electricity market since {COMPANY.founded}.
            </p>
          </div>

          <div>
            <div className="eyebrow mb-4">Platform</div>
            <ul className="flex flex-col gap-2.5 text-[14px] text-mist-2">
              <li><a href="#market" className="hover:text-cyan">Live Market</a></li>
              <li><a href="#model" className="hover:text-cyan">The Voltage Model</a></li>
              <li><a href="#network" className="hover:text-cyan">National Network</a></li>
              <li><a href="#investment" className="hover:text-cyan">Investment &amp; Scale</a></li>
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-4">Contact</div>
            <ul className="flex flex-col gap-2.5 text-[14px] text-mist-2">
              <li><a href={COMPANY.phoneHref} className="hover:text-cyan">{COMPANY.phone}</a></li>
              <li><a href={`mailto:${COMPANY.email}`} className="hover:text-cyan">{COMPANY.email}</a></li>
              <li className="text-[12px] leading-relaxed text-mist-3">{COMPANY.address}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-hair pt-6 text-[12px] text-mist-3 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {COMPANY.legal}</span>
          <span className="font-mono tracking-[0.16em]">
            EPDK LICENSED · EPİAŞ MEMBER · YEK-G CERTIFIED
          </span>
        </div>
      </div>
    </footer>
  );
}
