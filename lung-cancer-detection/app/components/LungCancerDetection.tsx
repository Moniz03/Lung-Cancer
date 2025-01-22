'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { Loader2, Upload, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DetectionResult {
  label: string
  score: number
  riskScore: string
  heatmapUrl: string
  reportUrl: string
}

export default function LungCancerDetection() {
  const [image, setImage] = useState<string | null>(null)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    setImage(URL.createObjectURL(file))
    setResult(null)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error detecting lung cancer:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div className="flex flex-col items-center">
      <motion.div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />
        {image ? (
          <Image src={image} alt="Uploaded lung scan" width={300} height={300} objectFit="contain" />
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-lg">Drag and drop a lung scan image here, or click to select a file</p>
          </div>
        )}
      </motion.div>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center"
          >
            <Loader2 className="animate-spin mr-2" />
            <p>Analyzing image...</p>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {result && <ResultDisplay result={result} />}
      </AnimatePresence>
    </div>
  )
}

function ResultDisplay({ result }: { result: DetectionResult }) {
  const { label, score, riskScore, heatmapUrl, reportUrl } = result
  const isCancerous = label === 'cancerous'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mt-4 p-6 bg-gray-100 rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-semibold mb-4">Detection Result</h2>
      <div className="flex items-center mb-2">
        {isCancerous ? (
          <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
        ) : (
          <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
        )}
        <p className={`text-lg ${isCancerous ? 'text-red-600' : 'text-green-600'} font-medium`}>
          {isCancerous ? 'Potential lung cancer detected' : 'No lung cancer detected'}
        </p>
      </div>
      <p className="text-gray-600 mb-2">Confidence: {(score * 100).toFixed(2)}%</p>
      <p className="text-gray-600 mb-4">Risk Score: {riskScore}</p>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Heatmap</h3>
        <Image src={heatmapUrl} alt="Detection heatmap" width={300} height={300} objectFit="contain" />
      </div>
      <a
        href={reportUrl}
        download="lung_cancer_detection_report.pdf"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Download className="mr-2" />
        Download Report
      </a>
      {isCancerous && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4"
        >
          <h3 className="text-xl font-semibold mb-2">Possible Next Steps:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Consult with a pulmonologist or oncologist</li>
            <li>Schedule a follow-up CT scan or PET scan</li>
            <li>Discuss biopsy options with your doctor</li>
            <li>Learn about treatment options, including surgery, radiation, and chemotherapy</li>
          </ul>
        </motion.div>
      )}
    </motion.div>
  )
}

