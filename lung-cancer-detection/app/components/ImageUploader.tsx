'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type ClassificationResult = {
  fileName: string
  result: string
}

export default function ImageUploader() {
  const [images, setImages] = useState<File[]>([])
  const [results, setResults] = useState<ClassificationResult[]>([])
  const [isClassifying, setIsClassifying] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImages(prevImages => [...prevImages, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': []} })

  const classifyImages = async () => {
    setIsClassifying(true)
    const classificationResults = await Promise.all(
      images.map(async (image) => {
        const formData = new FormData()
        formData.append('image', image)

        const response = await fetch('/api/classify', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Classification failed')
        }

        const data = await response.json()
        return { fileName: image.name, result: data.result }
      })
    )

    setResults(classificationResults)
    setIsClassifying(false)
  }

  return (
    <div className="space-y-8 bg-white bg-opacity-90 p-6 rounded-lg shadow-lg">
      <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500">Drop the images here ...</p>
        ) : (
          <p className="text-gray-600">Drag 'n' drop some images here, or click to select images</p>
        )}
      </div>

      {images.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Uploaded Images:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-2">
                  <Image 
                    src={URL.createObjectURL(image)} 
                    alt={`Uploaded image ${index + 1}`} 
                    width={200} 
                    height={200} 
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <p className="mt-2 text-sm text-gray-500 truncate">{image.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button 
            onClick={classifyImages} 
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isClassifying}
          >
            {isClassifying ? 'Classifying...' : 'Classify Images'}
          </Button>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Classification Results:</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-700">{result.fileName}</h3>
                  <p className={`mt-2 ${result.result.includes('Potential Cancer') ? 'text-red-500' : 'text-green-500'}`}>
                    {result.result}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

