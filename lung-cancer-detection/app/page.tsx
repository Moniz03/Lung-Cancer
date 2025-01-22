import Image from 'next/image'
import LungCancerDetection from './components/LungCancerDetection'
import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({ subsets: ['latin'] })

export default function Home() {
  return (
    <main className={`min-h-screen flex flex-col items-center justify-center relative ${montserrat.className}`}>
      <div className="absolute inset-0 z-0 bg-lung-image animate-breathe">
        <div className="absolute inset-0 bg-blur"></div>
      </div>
      <div className="z-10 bg-white bg-opacity-80 p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Lung Cancer Detection</h1>
        <LungCancerDetection />
      </div>
    </main>
  )
}

