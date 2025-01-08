import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface FileUploadZoneProps {
  onFileSelect: (files: File[]) => void
  maxSize?: number // in bytes
}

export function FileUploadZone({ onFileSelect, maxSize = 10 * 1024 * 1024 }: FileUploadZoneProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles])
    onFileSelect(acceptedFiles)
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    multiple: true
  })

  const removeFile = (file: File) => {
    setFiles((prevFiles) => prevFiles.filter((f) => f !== file))
  }

  const simulateUpload = (file: File) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress((prev) => ({ ...prev, [file.name]: progress }))
      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 500)
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag 'n' drop some files here, or click to select files
        </p>
        <p className="text-xs text-gray-500">
          (Max file size: {maxSize / 1024 / 1024}MB)
        </p>
      </div>
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file) => (
            <li key={file.name} className="flex items-center justify-between bg-gray-100 p-2 rounded">
              <span className="text-sm truncate">{file.name}</span>
              <div className="flex items-center space-x-2">
                <Progress value={uploadProgress[file.name] || 0} className="w-24" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <Button
          className="mt-4"
          onClick={() => files.forEach(simulateUpload)}
        >
          Upload Files
        </Button>
      )}
    </div>
  )
}

