import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function POST(request: NextRequest) {
  try {
    const { reportContent } = await request.json();

    if (!reportContent || !reportContent.trim()) {
      return NextResponse.json(
        { error: 'Report content is required' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert radiologist. Based on the following medical report content, generate a concise and professional radiology impression. Focus on key findings, clinical significance, and recommendations. Keep the impression clear and medically appropriate.

Report content:
${reportContent}`;

    const response = await ai.generate(prompt);
    const impressionText = response.text;

    if (!impressionText || !impressionText.trim()) {
      return NextResponse.json(
        { error: 'AI generated an empty response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ impression: impressionText });
  } catch (error: any) {
    console.error('AI Impression API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI impression' },
      { status: 500 }
    );
  }
}