// src/app/api/og/route.tsx
import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "TutorByAI";
    const description = searchParams.get("description") || "AI-Powered Learning Platform";

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f9ff',
            backgroundImage: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            fontFamily: 'sans-serif',
            padding: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '20px',
              }}
            >
              <div style={{ fontSize: '40px', color: 'white' }}>📚</div>
            </div>
            <div
              style={{
                fontSize: '60px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              TutorByAI
            </div>
          </div>
          <div
            style={{
              fontSize: '36px',
              color: '#1e293b',
              textAlign: 'center',
              maxWidth: '80%',
              fontWeight: '600',
              marginBottom: '20px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#64748b',
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            {description}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              fontSize: '20px',
              color: '#94a3b8',
            }}
          >
            tutorbyai.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    
    // Fallback to a simple text-based image
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 40,
            background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          TutorByAI - AI Learning Platform
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }
}

export const runtime = 'edge';