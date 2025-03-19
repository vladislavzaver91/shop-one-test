import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const files = formData.getAll('file') as File[]

		if (!files || files.length === 0) {
			return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
		}

		const uploadedUrls: string[] = []

		for (const file of files) {
			const fileName = `${Date.now()}-${file.name}`
			const fileBuffer = Buffer.from(await file.arrayBuffer())

			const { error: uploadError } = await supabase.storage
				.from('product-images')
				.upload(fileName, fileBuffer, {
					contentType: file.type,
					cacheControl: '3600',
					upsert: false,
				})

			if (uploadError) {
				throw new Error(`Upload failed: ${uploadError.message}`)
			}

			// Получение публичного URL
			const { data } = supabase.storage
				.from('product-images')
				.getPublicUrl(fileName)
			uploadedUrls.push(data.publicUrl) // Возвращаем чистый URL
		}

		return NextResponse.json({ urls: uploadedUrls }, { status: 200 })
	} catch (error) {
		console.error('Error uploading file:', error)
		return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
	}
}
