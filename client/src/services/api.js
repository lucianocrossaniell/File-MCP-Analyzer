import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 120000, // Increased to 2 minutes for multi-file analysis
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('accessToken', response.data.accessToken);
              localStorage.setItem('refreshToken', response.data.refreshToken);
              
              originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async login() {
    const response = await this.api.get('/auth/login');
    return response.data;
  }

  async handleCallback(code) {
    const response = await this.api.get(`/auth/callback?code=${code}`);
    return response.data;
  }

  async refreshToken(refreshToken) {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  async logout() {
    return this.api.post('/auth/logout');
  }

  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  }

  async getFiles() {
    const response = await this.api.get('/files');
    return response.data;
  }

  async deleteFile(fileName) {
    // fileName format: "userId/actualFileName"
    const response = await this.api.delete(`/files/${fileName}`);
    return response.data;
  }

  async analyzeFile(fileName, query) {
    const response = await this.api.post('/chat/analyze', {
      fileName,
      query,
    });
    return response.data;
  }

  async analyzeMultipleFiles(fileNames, query) {
    const response = await this.api.post('/chat/analyze-multiple', {
      fileNames,
      query,
    });
    return response.data;
  }

  async summarizeFile(fileName) {
    const response = await this.api.post('/chat/summarize', {
      fileName,
    });
    return response.data;
  }

  async downloadFile(fileName) {
    // fileName format: "userId/actualFileName"
    const response = await this.api.get(`/files/download/${fileName}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new ApiService();