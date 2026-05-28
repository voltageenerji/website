"use client";

import Reveal from "./Reveal";

export default function ChapterHeading({
  index,
  label,
  title,
  intro,
  align = "left",
}: {
  index: string;
  label: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-4xl"}>
      <Reveal>
        <div
          className={`flex items-center gap-3 ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          <span className="font-mono text-[11px] tracking-[0.3em] text-cyan">
            {index}
          </span>
          <span className="h-px w-8 bg-hair" />
          <span className="eyebrow">{label}</span>
        </div>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-6 text-[clamp(34px,5.2vw,68px)] font-semibold leading-[1.02] tracking-[-0.03em] text-mist">
          {title}
        </h2>
      </Reveal>
      {intro && (
        <Reveal delay={0.12}>
          <p
            className={`mt-6 text-[17px] leading-relaxed text-mist-2 ${
              align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"
            }`}
          >
            {intro}
          </p>
        </Reveal>
      )}
    </div>
  );
}
