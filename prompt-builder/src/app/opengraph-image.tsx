import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';

export const alt = `${SITE.name}: typed, linted prompt templates`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: '#09090b',
        color: '#fafafa',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 40, fontWeight: 600 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
          }}
        >
          {'{}'}
        </div>
        {SITE.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 950 }}>
          Prompt templates that behave like code.
        </div>
        <div style={{ fontSize: 30, color: '#a1a1aa', maxWidth: 950 }}>
          Typed fields · conditional sections · a linter · Claude API export
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 26, color: '#60a5fa', fontFamily: 'monospace' }}>
        {'{{#if context}} … {{/if}}'}
      </div>
    </div>,
    size,
  );
}
