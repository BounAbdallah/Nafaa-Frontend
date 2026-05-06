import api from './api'

/**
 * Qiwam assistant — bridge to /api/v1/ai/*
 *
 * The backend orchestrates the LLM + tool calling. The frontend simply
 * sends text or audio and renders the structured response.
 *
 * Response shape:
 *   { transcript, action, tool_result, reply }
 */

export const sendText = async (message) => {
  const { data } = await api.post('/ai/text', { message })
  return data
}

export const sendVoice = async (audioBlob) => {
  // Force the right extension based on the actual blob MIME so Laravel
  // doesn't mis-detect a webm container as video/webm.
  const mime = audioBlob.type || 'audio/webm'
  const ext  = mime.includes('mp4') ? 'm4a'
            : mime.includes('ogg') ? 'ogg'
            : mime.includes('wav') ? 'wav'
            : 'webm'

  const form = new FormData()
  form.append('audio', audioBlob, `recording.${ext}`)

  const { data } = await api.post('/ai/voice', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 90_000,
  })
  return data
}

export const listTools = async () => {
  const { data } = await api.get('/ai/tools')
  return data.tools
}

export const importCsv = async (file, defaultType = 'material') => {
  const form = new FormData()
  form.append('file', file)
  form.append('default_type', defaultType)

  const { data } = await api.post('/ai/import-csv', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  })
  return data
}
