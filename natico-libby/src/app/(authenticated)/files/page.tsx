'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { Files, Upload, Trash2, X } from 'lucide-react'
import type { FileRecord } from '@/types'

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFiles()
  }, [])

  async function loadFiles() {
    const supabase = createClient()
    const { data } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false })
    setFiles(data ?? [])
    setLoading(false)
  }

  async function uploadFile(file: File) {
    setUploading(true)
    setUploadError(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/files', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error ?? 'Upload failed')
        return
      }

      setFiles((prev) => [data.file, ...prev])
    } catch {
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function deleteFile(id: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return

    const res = await fetch(`/api/files?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== id))
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-900">Files</h1>
        <p className="text-sm text-stone-500 mt-0.5">Upload and manage your documents</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors cursor-pointer ${
          dragOver
            ? 'border-violet-400 bg-violet-50'
            : uploading
              ? 'border-stone-200 bg-stone-50'
              : 'border-stone-200 hover:border-violet-300 hover:bg-stone-50'
        }`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
          disabled={uploading}
        />
        <Upload
          className={`w-8 h-8 mx-auto mb-2 ${uploading ? 'text-stone-300 animate-pulse' : 'text-violet-400'}`}
          strokeWidth={1.5}
        />
        {uploading ? (
          <p className="text-sm text-stone-500">Uploading…</p>
        ) : (
          <>
            <p className="text-sm font-medium text-stone-700">
              Drop a file here, or click to browse
            </p>
            <p className="text-xs text-stone-400 mt-1">Max 50 MB</p>
          </>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-stone-400 text-center py-8">Loading…</div>
      ) : files.length === 0 ? (
        <EmptyState
          icon={Files}
          title="No files uploaded yet"
          description="Drop a file above or click to upload your first document."
        />
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 text-sm font-semibold text-stone-800">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </div>
          <ul className="divide-y divide-stone-100">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50"
              >
                <Files className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-stone-800 truncate">{f.name}</div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {f.size ? formatBytes(f.size) : 'unknown size'} ·{' '}
                    {new Date(f.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => deleteFile(f.id)}
                  className="p-1.5 rounded text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
