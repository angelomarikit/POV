import { Clock3, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PartnershipPage() {
  return <section className="flex min-h-[calc(100svh-8.5rem)] flex-col items-center justify-center bg-white px-8 py-16 text-center">
    <span className="grid size-20 place-items-center rounded-[1.6rem] bg-neutral-100 text-orange-500">
      <Clock3 size={36} strokeWidth={2.2} />
    </span>
    <h1 className="mt-6 text-[28px] font-black tracking-tight text-orange-500">Coming Soon</h1>
    <p className="mt-3 max-w-[16rem] text-[15px] leading-6 text-neutral-500">We’re putting the finishing touches on this page. Check back very soon.</p>
    <Link to="/" className="focus-ring mt-8 inline-flex min-h-13 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-orange-500 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition active:scale-[.98]">
      <Home size={18} />Back to Home
    </Link>
  </section>
}
