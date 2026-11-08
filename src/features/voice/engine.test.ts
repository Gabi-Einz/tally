import { describe, expect, it } from 'vitest'
import { isHallucination, isSilence } from './audio'
import { resolveEngine, type VoiceCapabilities } from './engine'

const caps = (
  webSpeech: boolean,
  recording: boolean,
  online: boolean,
): VoiceCapabilities => ({ webSpeech, recording, online })

describe('resolveEngine', () => {
  it.each([
    ['auto', caps(true, true, true), 'chrome'],
    ['auto', caps(true, true, false), 'whisper'],
    ['auto', caps(false, true, true), 'whisper'],
    ['auto', caps(true, false, false), 'chrome'],
    ['auto', caps(false, false, true), null],
    ['chrome', caps(true, true, false), 'chrome'],
    ['chrome', caps(false, true, true), null],
    ['whisper', caps(true, true, true), 'whisper'],
    ['whisper', caps(true, false, true), null],
  ] as const)('%s con %o → %s', (preference, capabilities, expected) => {
    expect(resolveEngine(preference, capabilities)).toBe(expected)
  })
})

describe('audio', () => {
  it('detecta silencio por volumen', () => {
    expect(isSilence(new Float32Array(16000))).toBe(true)
    const noisy = new Float32Array(16000)
    noisy.fill(0.2, 8000, 9000)
    expect(isSilence(noisy)).toBe(false)
  })

  it('descarta las frases que Whisper inventa con el silencio', () => {
    expect(
      isHallucination('Subtítulos realizados por la comunidad de Amara.org'),
    ).toBe(true)
    expect(isHallucination('¡Gracias por ver el video!')).toBe(true)
    expect(isHallucination('   ')).toBe(true)
    expect(isHallucination('y')).toBe(true)
    expect(isHallucination('gasté 5000 en la SUBE')).toBe(false)
  })
})
