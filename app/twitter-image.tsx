import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          color: '#ffffff',
          padding: '56px',
          gap: '42px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 122,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#f5f5f5' }}>ZINC</span>
          <span style={{ color: '#4b5563', margin: '0 10px' }}>×</span>
          <span
            style={{
              backgroundImage: 'linear-gradient(90deg, #e5e7eb 0%, #9ca3af 100%)',
              color: 'transparent',
              backgroundClip: 'text',
            }}
          >
            NH
          </span>
        </div>

        <div
          style={{
            fontSize: 40,
            color: '#9ca3af',
            maxWidth: 1080,
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
          }}
        >
          INSTANT CODE ANALYSIS. BUG DETECTION. PERFORMANCE OPTIMIZATION.
          SHIP FASTER WITH AI-DRIVEN INSIGHTS.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
