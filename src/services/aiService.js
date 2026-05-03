import api from './api'

/**
 * Qiwam Intelligent — bridge to /api/v1/ai/*
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
  const form = new FormData()
  // Whisper accepts webm/opus straight from MediaRecorder
  form.append('audio', audioBlob, 'recording.webm')

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
