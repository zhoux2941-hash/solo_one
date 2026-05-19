const API_BASE = 'http://localhost:3000/api';

class API {
    static async request(url, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    static async login(username, password) {
        return this.request('/user/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    static async logout(userId) {
        return this.request('/user/logout', {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    }

    static async getUsers() {
        return this.request('/user/list');
    }

    static async createUser(userData) {
        return this.request('/user/create', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    static async deleteUser(id) {
        return this.request(`/user/${id}`, {
            method: 'DELETE'
        });
    }

    static async scanPorts() {
        return this.request('/serial/scan');
    }

    static async connectPort(port, baudRate) {
        return this.request('/serial/connect', {
            method: 'POST',
            body: JSON.stringify({ port, baudRate })
        });
    }

    static async disconnectPort(port) {
        return this.request('/serial/disconnect', {
            method: 'POST',
            body: JSON.stringify({ port })
        });
    }

    static async sendData(port, data) {
        return this.request('/serial/send', {
            method: 'POST',
            body: JSON.stringify({ port, data })
        });
    }

    static async getConnections() {
        return this.request('/serial/connections');
    }

    static async scanPortsWithDevices() {
        return this.request('/serial/scan-with-devices');
    }

    static async identifyDevice(port, timeout = 5000) {
        return this.request('/serial/identify', {
            method: 'POST',
            body: JSON.stringify({ port, timeout })
        });
    }

    static async registerDevice(deviceData) {
        return this.request('/serial/register-device', {
            method: 'POST',
            body: JSON.stringify(deviceData)
        });
    }

    static async getDevicePortMap() {
        return this.request('/serial/device-map');
    }

    static async uploadFirmware(formData) {
        try {
            const response = await fetch(`${API_BASE}/firmware/upload`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async getFirmwareList(page = 1, pageSize = 20) {
        return this.request(`/firmware/list?page=${page}&pageSize=${pageSize}`);
    }

    static async deleteFirmware(id) {
    return this.request(`/firmware/${id}`, {
      method: 'DELETE'
    });
  }

  static async getFirmwareDetail(id) {
    return this.request(`/firmware/detail/${id}`);
  }

  static async startFlash(firmwareId, ports, operatorId) {
        return this.request('/flash/start', {
            method: 'POST',
            body: JSON.stringify({ firmwareId, ports, operatorId })
        });
    }

    static async cancelFlash(taskId, operatorId) {
        return this.request('/flash/cancel', {
            method: 'POST',
            body: JSON.stringify({ taskId, operatorId })
        });
    }

    static async getFlashStatus(taskId) {
        return this.request(`/flash/status/${taskId}`);
    }

    static async retryFailedFlash(taskId, operatorId) {
        return this.request('/flash/retry', {
            method: 'POST',
            body: JSON.stringify({ taskId, operatorId })
        });
    }

    static async getFlashConfig() {
        return this.request('/flash/config');
    }

    static async updateFlashConfig(config) {
        return this.request('/flash/config', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    static async getFlashHistory(page = 1, pageSize = 20) {
        return this.request(`/flash/history?page=${page}&pageSize=${pageSize}`);
    }

    static async getFlashRecords(taskId) {
        return this.request(`/flash/records/${taskId}`);
    }

    static async getOperationLogs(page = 1, pageSize = 50) {
        return this.request(`/log/operation?page=${page}&pageSize=${pageSize}`);
    }

    static async getDebugLogs(page = 1, pageSize = 100) {
        return this.request(`/log/debug?page=${page}&pageSize=${pageSize}`);
    }

    static async clearDebugLogs() {
        return this.request('/log/debug/clear', {
            method: 'DELETE'
        });
    }

    static async getDevices() {
        return this.request('/device/list');
    }
}
