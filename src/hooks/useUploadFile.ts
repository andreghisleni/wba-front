import { useCallback, useState } from 'react'

type UseUploadFile = {
  handleUploadFunction: (f: File) => Promise<{
    file_name: string
  }>
}

export function useUploadFile({ handleUploadFunction }: UseUploadFile) {
  const [isFileUploading, setIsFileUploading] = useState(false)
  const [fileUploadedName, setFileUploadedName] = useState<string>()

  const [localFile, setLocalFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  const handleUpload = useCallback((f: File[]) => {
    setLocalFile(f[0])
    setFileUrl(URL.createObjectURL(f[0]))
  }, [])

  const handleRemoveFile = useCallback(() => {
    setLocalFile(null)
    setFileUrl(null)
  }, [])

  const handleUploadFile = useCallback(async () => {
    // biome-ignore lint/style/useBlockStatements: <explanation>
    if (!localFile) return

    setIsFileUploading(true)

    const response = await handleUploadFunction(localFile)

    setFileUploadedName(response.file_name)

    setIsFileUploading(false)
  }, [localFile, handleUploadFunction])

  return {
    isFileUploading,
    fileUploadedName,
    localFile,
    fileUrl,
    handleUpload,
    handleRemoveFile,
    handleUploadFile,
  }
}

export type UploadFile = ReturnType<typeof useUploadFile>
