/**
 * leakService.js
 * Real OCR / Leak Upload API integration
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://traceset.onrender.com'
).replace(/\/$/, '');

// 90 second timeout to handle Render free-tier cold starts (50s wake-up)
async function apiRequest(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        typeof body === 'object'
          ? body.detail || body.message
          : body;
      throw new Error(message || `API error: ${response.status}`);
    }

    return body;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Backend may be waking up — please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const leakService = {
  async getLeakUploads() {
    const data = await apiRequest('/api/leaks');

    if (!Array.isArray(data)) {
      throw new Error('Invalid upload history response.');
    }

    return data;
  },

  async getLeakUpload(id) {
    const [upload, questions] = await Promise.all([
      apiRequest(`/api/leaks/${encodeURIComponent(id)}`),
      apiRequest(`/api/leaks/${encodeURIComponent(id)}/questions`),
    ]);

    return {
      ...upload,
      extracted_questions: Array.isArray(questions) ? questions : [],
    };
  },

  async uploadLeak(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiRequest('/api/leaks/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.upload?.id) {
      throw new Error('Backend did not return a valid upload ID.');
    }

    const result = response.result || {};

    return {
      ...response.upload,
      filename: response.upload.filename || file.name,
      file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      file_size_bytes: file.size,
      status: 'EXTRACTED',
      total_pages: result.pages?.length || 1,
      processing_warnings: result.warnings || [],
      extracted_questions: result.questions || [],
      created_at: new Date().toISOString(),
    };
  },

  async deleteLeakUpload(uploadId) {
    return apiRequest(`/api/leaks/${uploadId}`, {
      method: 'DELETE',
    });
  },
};
