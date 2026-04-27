import axios from 'axios';

// Add a response interceptor
axios.interceptors.response.use(
  response => response,  // pass successful responses straight through
  error => {
    // Network error — backend not running
    if (!error.response) {
      error.userMessage = 'Cannot reach the server. Is the backend running?';
      return Promise.reject(error);
    }

    // Map HTTP status codes to human-readable messages
    const status = error.response.status;
    if (status === 404) {
      error.userMessage = 'Resource not found.';
    } else if (status === 400) {
      error.userMessage =
        error.response.data?.message ?? 'Invalid request. Check your inputs.';
    } else if (status === 500) {
      error.userMessage = 'Server error. Please try again.';
    } else {
      error.userMessage = 'Something went wrong.';
    }

    return Promise.reject(error);
  }
);

export default axios;