'use server'

import { revalidatePath } from 'next/cache'

export async function uploadLegalDocument(formData: FormData) {
  const docType = formData.get('docType')
  const version = formData.get('version')
  const file = formData.get('file') as File

  if (!docType || !version || !file) {
    return { error: 'Missing required fields.' }
  }

  console.log('Uploading document:', {
    docType,
    version,
    fileName: file.name,
    fileSize: file.size,
  })

  // In a real application, you would upload the file to Supabase Storage here.
  // For example:
  // const { data, error } = await supabase.storage
  //   .from('legal-documents')
  //   .upload(`${docType}/${version}/${file.name}`, file)
  // if (error) return { error: error.message }

  // Revalidate the admin path to show the new document
  revalidatePath('/admin')

  return { success: true }
}
