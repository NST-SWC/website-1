import type { ReactNode } from "react";

type PageIntroProps = {
  badge: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export const PageIntro = ({
  badge,
  title,
  description,
  actions,
}: PageIntroProps) => (
  <div className="glass-panel flex flex-col gap-4 border border-white/10 px-6 py-8 text-left sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-orange-300">
        {badge}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      <p className="text-sm text-white/70">{description}</p>
    </div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>
);
