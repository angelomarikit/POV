import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { toPng } from 'html-to-image'
import { Copy, Download } from 'lucide-react'
import { PUBLIC_SITE_URL, SITE_NAME } from '../config/site'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

const VISIT_URL = `${PUBLIC_SITE_URL}/`

export default function SiteQrPage() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const visitUrl = VISIT_URL
  const displayHost = 'pinoyonlineventures.com'

  useDocumentMeta(`Site QR · ${SITE_NAME}`)

  const savePhoto = async () => {
    if (!cardRef.current) return
    setSaving(true)
    setMessage('')
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = 'pov-site-qr.png'
      link.href = dataUrl
      link.click()
      setMessage('QR saved. Keep it in Photos and scan anytime to open POV.')
    } catch {
      setMessage('Unable to save on this device. Take a screenshot of the QR instead.')
    } finally {
      setSaving(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(visitUrl)
      setMessage('Site link copied.')
    } catch {
      setMessage(visitUrl)
    }
  }

  return (
    <section className="px-5 pb-12 pt-7">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-500">Visit POV anytime</p>
      <h1 className="mt-2 text-[28px] font-black tracking-tight">Site QR</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-600">
        Save this QR so you never have to type the website address. Scan it later to open Pinoy Online Venture.
      </p>

      <div ref={cardRef} className="mx-auto mt-8 w-full max-w-sm rounded-[1.75rem] border border-orange-200 bg-white p-6 text-center shadow-sm">
        <img src="/pov-logo.png" alt="" className="mx-auto size-14 rounded-full" />
        <p className="mt-3 text-sm font-black uppercase tracking-[.16em] text-orange-500">Pinoy Online Venture</p>
        <div className="mx-auto mt-6 grid w-fit place-items-center rounded-2xl bg-white p-3">
          <QRCodeSVG value={visitUrl} size={220} level="M" includeMargin={false} />
        </div>
        <p className="mt-5 text-sm font-bold text-neutral-900">{displayHost}</p>
        <p className="mt-1 text-xs text-neutral-500">Scan to visit the site</p>
      </div>

      <div className="mx-auto mt-5 grid w-full max-w-sm gap-2.5">
        <button
          type="button"
          onClick={() => void savePhoto()}
          disabled={saving}
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white disabled:opacity-60"
        >
          <Download size={18} />{saving ? 'Saving…' : 'Save QR to Photos'}
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white font-bold text-neutral-900"
        >
          <Copy size={17} />Copy site link
        </button>
      </div>

      {message && <p className="mx-auto mt-4 max-w-sm text-center text-sm text-neutral-600">{message}</p>}
    </section>
  )
}
