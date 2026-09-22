import { useState } from 'react'
import { Copy, Upload } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ImageUploader } from '../../components/common/UI'
import { listMedia } from '../../services/storage'
import { MEDIA_BUCKET, sitePath } from '../../config/site'
import { supabase } from '../../lib/supabase'

export default function AdminMediaPage() {
  const client = useQueryClient()
  const [url, setUrl] = useState('')
  const { data = [] } = useQuery({ queryKey: ['media-library'], queryFn: listMedia })
  const copy = async (value: string) => navigator.clipboard.writeText(value)
  return <div><div className="mb-6"><p className="text-sm font-bold text-orange-600">Asset management</p><h1 className="mt-1 text-2xl font-black">Media library</h1><p className="mt-1.5 text-sm text-neutral-500">Upload reusable images, preview files, and copy public URLs.</p></div><div className="grid gap-5"><section className="rounded-2xl border border-neutral-200 bg-white p-5"><ImageUploader value={url} folder="media" label="Upload image" onChange={value => { setUrl(value); void client.invalidateQueries({ queryKey: ['media-library'] }) }} />{url && <Button className="mt-3 w-full" variant="ghost" onClick={() => void copy(url)}><Copy size={16} />Copy URL</Button>}</section><section>{data.length ? <div className="grid grid-cols-2 gap-3">{data.filter(item => item.name !== '.emptyFolderPlaceholder').map(item => { const publicUrl = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(`${sitePath('media')}/${item.name}`).data.publicUrl; return <article key={item.id || item.name} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"><img src={publicUrl} alt={item.name} className="aspect-square w-full object-cover" /><div className="p-3"><p className="truncate text-xs font-semibold">{item.name}</p><p className="mt-1 text-[11px] text-neutral-500">{item.metadata?.size ? `${Math.round(Number(item.metadata.size) / 1024)} KB` : 'Image'}</p><button onClick={() => void copy(publicUrl)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange-700"><Copy size={13} />Copy URL</button></div></article> })}</div> : <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-neutral-300 bg-white text-center"><div><Upload className="mx-auto text-orange-600" /><p className="mt-3 font-bold">No reusable media yet</p><p className="mt-1 text-sm text-neutral-500">Upload your first image using the panel.</p></div></div>}</section></div></div>
}
