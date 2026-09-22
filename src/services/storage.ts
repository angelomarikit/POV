import imageCompression from 'browser-image-compression'
import { MEDIA_BUCKET, sitePath } from '../config/site'
import { supabase } from '../lib/supabase'

export type MediaFolder = 'branding' | 'members' | 'events' | 'gallery' | 'media'

function extensionFor(file: File) {
  return file.type === 'image/png' ? 'png' : 'webp'
}

export async function uploadImage(file: File, folder: MediaFolder, onProgress?: (value: number) => void) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WEBP image.')
  if (file.size > 12 * 1024 * 1024) throw new Error('Image must be smaller than 12 MB.')
  onProgress?.(10)
  const optimized = await imageCompression(file, {
    maxSizeMB: 1.6,
    maxWidthOrHeight: 2200,
    useWebWorker: true,
    fileType: file.type === 'image/png' ? 'image/png' : 'image/webp',
  })
  onProgress?.(45)
  const filename = `${crypto.randomUUID()}-${Date.now()}.${extensionFor(optimized)}`
  const path = `${sitePath(folder)}/${filename}`
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, optimized, {
    cacheControl: '31536000',
    upsert: false,
    contentType: optimized.type,
  })
  if (error) throw new Error(error.message)
  onProgress?.(100)
  return { path, url: supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl }
}

export async function deleteImage(path: string) {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

export async function listMedia() {
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list(sitePath('media'), {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error) throw new Error(error.message)
  return data
}
