import api from './api'

export async function uploadFile(
  file: File,
  endpoint: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return data.url
}

export async function uploadMultiple(
  files: File[],
  endpoint: string,
  onProgress?: (pct: number) => void,
): Promise<string[]> {
  const urls: string[] = []
  for (let i = 0; i < files.length; i++) {
    const url = await uploadFile(files[i], endpoint, (pct) => {
      if (onProgress) {
        const overall = Math.round(((i * 100 + pct) / files.length))
        onProgress(overall)
      }
    })
    urls.push(url)
  }
  return urls
}
