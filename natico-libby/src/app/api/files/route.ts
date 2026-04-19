import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const matterId = formData.get('matter_id') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const maxSize = 50 * 1024 * 1024 // 50 MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'File exceeds 50 MB limit' },
      { status: 413 },
    )
  }

  const storagePath = `${user.id}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('user-files')
    .upload(storagePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: record, error: dbError } = await supabase
    .from('files')
    .insert({
      user_id: user.id,
      matter_id: matterId || null,
      name: file.name,
      size: file.size,
      mime_type: file.type || null,
      storage_path: storagePath,
    })
    .select()
    .single()

  if (dbError) {
    // Clean up storage if DB insert fails
    await supabase.storage.from('user-files').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ file: record })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('id')

  if (!fileId) {
    return NextResponse.json({ error: 'Missing file id' }, { status: 400 })
  }

  const { data: fileRecord, error: fetchError } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !fileRecord) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  await supabase.storage
    .from('user-files')
    .remove([fileRecord.storage_path])

  await supabase.from('files').delete().eq('id', fileId)

  return NextResponse.json({ success: true })
}
