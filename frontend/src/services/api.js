import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const api = {
  generateTestCases: async (payload) => {
    const response = await axios.post(`${API_BASE}/api/generate`, payload, {
      timeout: 120000,
    });
    return response.data;
  },
  health: async () => {
    const response = await axios.get(`${API_BASE}/api/health`);
    return response.data;
  }
};

export default api;
