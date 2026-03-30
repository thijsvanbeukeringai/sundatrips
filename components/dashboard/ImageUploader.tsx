'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, ImageIcon, GripVertical } from 'lucide-react'

interface Props {
  userId: string
  initialUrls?: string[]
  onChange: (urls: string[]) => void
}

interface UploadingFile {
  id:       string
  name:     string
  progress: number
  error?:   string
}

/** Resize image client-side to maxWidth, returns a JPEG Blob.
 *  Falls back to the original file if canvas fails (e.g. EXIF issues, HEIC). */
async function resizeImage(file: File, maxWidth = 1400): Promise<{ blob: Blob; ext: string }> {
  // Try createImageBitmap first — it handles EXIF rotation and more formats
  try {
    const bitmap = await createImageBitmap(file)
    const scale  = Math.min(1, maxWidth / bitmap.width)
    const canvas = document.createElement('canvas')
    canvas.width  = Math.round(bitmap.width  * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>(res =>
      canvas.toBlob(res, 'image/jpeg', 0.85)
    )
    if (blob) return { blob, ext: 'jpg' }
  } catch {
    // fall through
  }

  // Fallback: upload original without resizing
  return { blob: file, ext: file.name.split('.').pop()?.toLowerCase() ?? 'jpg' }
}

export default function ImageUploader({ userId, initialUrls = [], onChange }: Props) {
  const [urls, setUrls]           = useState<string[]>(initialUrls)
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [dragging, setDragging]   = useState(false)
  const inputRef                  = useRef<HTMLInputElement>(null)
  const supabase                  = createClient()

  const updateUrls = useCallback((next: string[]) => {
    setUrls(next)
    onChange(next)
  }, [onChange])

  async function uploadFiles(files: FileList | File[]) {
    const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif']
    const fileArray = Array.from(files).filter(f =>
      f.type.startsWith('image/') || imageExts.some(ext => f.name.toLowerCase().endsWith(`.${ext}`))
    )
    if (fileArray.length === 0) return

    const newUploading: UploadingFile[] = fileArray.map(f => ({
      id:       crypto.randomUUID(),
      name:     f.name,
      progress: 0,
    }))
    setUploading(prev => [...prev, ...newUploading])

    const results: string[] = []

    await Promise.all(fileArray.map(async (file, i) => {
      const uid = newUploading[i].id
      try {
        const { blob, ext } = await resizeImage(file)
        const filename = `${userId}/${crypto.randomUUID()}.${ext}`

        setUploading(prev => prev.map(u => u.id === uid ? { ...u, progress: 40 } : u))

        const contentType = ext === 'jpg' ? 'image/jpeg' : (file.type || 'image/jpeg')
        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(filename, blob, { contentType, upsert: false })

        if (error) throw error

        setUploading(prev => prev.map(u => u.id === uid ? { ...u, progress: 90 } : u))

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(data.path)

        results.push(publicUrl)
        setUploading(prev => prev.map(u => u.id === uid ? { ...u, progress: 100 } : u))
      } catch (err: any) {
        setUploading(prev => prev.map(u => u.id === uid ? { ...u, error: err.message ?? 'Upload failed' } : u))
      }
    }))

    // Add uploaded URLs and clear completed uploads after a moment
    if (results.length > 0) {
      updateUrls([...urls, ...results])
    }
    setTimeout(() => {
      setUploading(prev => prev.filter(u => !!u.error))
    }, 1200)
  }

  function removeUrl(index: number) {
    updateUrls(urls.filter((_, i) => i !== index))
  }

  function moveUrl(from: number, to: number) {
    const next = [...urls]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    updateUrls(next)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    uploadFiles(e.dataTransfer.files)
  }, [urls])

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-jungle-500 bg-jungle-50'
            : 'border-gray-200 hover:border-jungle-400 hover:bg-gray-50'
        }`}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 ${dragging ? 'text-jungle-600' : 'text-gray-300'}`} />
        <p className="text-sm font-medium text-gray-600">
          {dragging ? 'Drop images here' : 'Click or drag images to upload'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — automatically resized to 1400px wide</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {/* Upload progress */}
      {uploading.map(u => (
        <div key={u.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
          <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{u.name}</p>
            {u.error ? (
              <p className="text-xs text-red-500">{u.error}</p>
            ) : (
              <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-jungle-600 rounded-full transition-all duration-300"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            )}
          </div>
          {u.progress === 100 && <span className="text-xs text-jungle-600 font-semibold">✓</span>}
        </div>
      ))}

      {/* Preview grid */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {urls.map((url, i) => (
            <div key={url} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />

              {/* Order badge */}
              <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/60 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {i + 1}
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeUrl(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Move left/right */}
              <div className="absolute bottom-0 inset-x-0 flex justify-between px-1 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveUrl(i, i - 1)}
                    className="bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md hover:bg-black/80"
                  >
                    ←
                  </button>
                )}
                {i < urls.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveUrl(i, i + 1)}
                    className="bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md hover:bg-black/80 ml-auto"
                  >
                    →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {urls.length > 0 && (
        <p className="text-[11px] text-gray-400">Image 1 is shown as the card thumbnail. Use ← → to reorder.</p>
      )}
    </div>
  )
}
