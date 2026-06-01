export interface Project {
  id: number;
  name: string;
  description: string;
  ladderData: string;
  createdAt: string;
  updatedAt: string;
}

const BASE_URL = 'http://localhost:8080/api';

export const api = {
  async getAllProjects(): Promise<Project[]> {
    const response = await fetch(`${BASE_URL}/projects`);
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    return response.json();
  },

  async getProject(id: number): Promise<Project> {
    const response = await fetch(`${BASE_URL}/projects/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }
    return response.json();
  },

  async createProject(project: {
    name: string;
    description: string;
    ladderData: string;
  }): Promise<Project> {
    const response = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    if (!response.ok) {
      throw new Error('Failed to create project');
    }
    return response.json();
  },

  async updateProject(
    id: number,
    project: {
      name: string;
      description: string;
      ladderData: string;
    }
  ): Promise<Project> {
    const response = await fetch(`${BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    if (!response.ok) {
      throw new Error('Failed to update project');
    }
    return response.json();
  },

  async deleteProject(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  },
};
