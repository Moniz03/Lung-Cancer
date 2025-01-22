import { NextRequest, NextResponse } from 'next/server';
import * as tf from '@tensorflow/tfjs-node';
import { createCanvas, loadImage } from 'canvas';
import * as gradCAM from '@tensorflow/tfjs-vis';
import PDFDocument from 'pdfkit';

let model: tf.GraphModel;

async function loadModel() {
  model = await tf.loadGraphModel('file://./public/model/model.json');
}

loadModel();

export async function POST(req: NextRequest) {
  if (!model) {
    return NextResponse.json({ error: 'Model not loaded' }, { status: 500 });
  }

  const formData = await req.formData();
  const image = formData.get('image') as File;

  if (!image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  try {
    const buffer = await image.arrayBuffer();
    const img = await loadImage(buffer);
    
    // Preprocess the image
    const tensor = tf.browser.fromPixels(img).toFloat();
    const resized = tf.image.resizeBilinear(tensor, [224, 224]);
    const expanded = resized.expandDims(0);
    const normalized = expanded.div(255.0);

    // Run inference
    const prediction = model.predict(normalized) as tf.Tensor;
    const probabilities = await prediction.data();

    // Generate heatmap using Grad-CAM
    const lastConvLayer = model.getLayer('last_conv_layer');
    const heatmap = await gradCAM.gradClassActivationMap(model, normalized, 0, lastConvLayer);

    // Convert heatmap to image
    const heatmapImage = await visualizeHeatmap(heatmap, img);

    // Calculate risk score
    const riskScore = calculateRiskScore(probabilities[0]);

    // Generate report
    const reportBuffer = await generateReport(img, heatmapImage, riskScore, probabilities[0]);

    const result = {
      label: probabilities[0] > 0.5 ? 'cancerous' : 'non-cancerous',
      score: probabilities[0],
      riskScore: riskScore,
      heatmapUrl: `data:image/png;base64,${heatmapImage.toString('base64')}`,
      reportUrl: `data:application/pdf;base64,${reportBuffer.toString('base64')}`
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 });
  }
}

async function visualizeHeatmap(heatmap: tf.Tensor3D, originalImage: any) {
  const canvas = createCanvas(224, 224);
  const ctx = canvas.getContext('2d');
  
  // Draw original image
  ctx.drawImage(originalImage, 0, 0, 224, 224);
  
  // Overlay heatmap
  const heatmapData = await heatmap.data();
  const imageData = ctx.getImageData(0, 0, 224, 224);
  for (let i = 0; i < heatmapData.length; i++) {
    const value = heatmapData[i];
    imageData.data[i * 4 + 0] += value * 255; // Red channel
    imageData.data[i * 4 + 3] = 128; // Alpha channel
  }
  ctx.putImageData(imageData, 0, 0);
  
  return canvas.toBuffer();
}

function calculateRiskScore(probability: number): string {
  if (probability < 0.3) return 'Low';
  if (probability < 0.7) return 'Moderate';
  return 'High';
}

async function generateReport(originalImage: any, heatmapImage: Buffer, riskScore: string, probability: number) {
  const doc = new PDFDocument();
  const buffers: Buffer[] = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  doc.fontSize(18).text('Lung Cancer Detection Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Risk Score: ${riskScore}`);
  doc.text(`Probability: ${(probability * 100).toFixed(2)}%`);
  doc.moveDown();
  doc.image(originalImage, { width: 300 });
  doc.moveDown();
  doc.image(heatmapImage, { width: 300 });
  doc.end();

  return Buffer.concat(buffers);
}

