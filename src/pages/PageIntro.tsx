import type { ReactNode } from 'react'

export function PageIntro({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: string; icon?: ReactNode }) {
  return <section className="relative overflow-hidden bg-[#101012] px-5 pb-8 pt-7 text-white">
    <div className="absolute -right-16 -top-20 size-56 rounded-full bg-orange-500/20 blur-3xl" />
    <div className="relative">
      <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-orange-500 text-white">{icon}</div>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-[28px] font-black leading-[1.08] tracking-[-.035em]">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-neutral-400">{description}</p>
    </div>
  </section>
}
