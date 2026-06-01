import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Project } from '../services/api';
import { usePlcStore } from '../store/plcStore';
import type { LadderProgram } from '../types/plc';

const ProjectManager = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    program,
    currentProjectId,
    setProgram,
    setCurrentProject,
    setProjectsList,
  } = usePlcStore();

  const loadProjects = async () => {
    try {
      const data = await api.getAllProjects();
      setProjects(data);
      setProjectsList(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleNew = () => {
    setProgram({ rungs: [] });
    setCurrentProject(null, '');
    setProjectName('');
    setProjectDescription('');
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }
    setLoading(true);
    try {
      const ladderData = JSON.stringify(program);
      if (currentProjectId) {
        await api.updateProject(currentProjectId, {
          name: projectName,
          description: projectDescription,
          ladderData,
        });
      } else {
        const newProject = await api.createProject({
          name: projectName,
          description: projectDescription,
          ladderData,
        });
        setCurrentProject(newProject.id, newProject.name);
      }
      await loadProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (id: number) => {
    setLoading(true);
    try {
      const project = await api.getProject(id);
      const parsedProgram: LadderProgram = JSON.parse(project.ladderData);
      setProgram(parsedProgram);
      setCurrentProject(project.id, project.name);
      setProjectName(project.name);
      setProjectDescription(project.description);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    setLoading(true);
    try {
      await api.deleteProject(id);
      if (currentProjectId === id) {
        setCurrentProject(null, '');
      }
      await loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-manager">
      <button
        className="project-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Close Projects' : 'Projects'}
      </button>

      {isOpen && (
        <div className="project-sidebar">
          <h3>Project Management</h3>

          <div className="project-form">
            <input
              type="text"
              placeholder="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <textarea
              placeholder="Description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="project-buttons">
            <button onClick={handleNew} className="btn btn-secondary">
              New Project
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="project-list">
            <h4>Saved Projects</h4>
            {projects.length === 0 ? (
              <p className="no-projects">No projects saved</p>
            ) : (
              <ul>
                {projects.map((project) => (
                  <li
                    key={project.id}
                    className={`project-item ${
                      currentProjectId === project.id ? 'active' : ''
                    }`}
                  >
                    <div className="project-info">
                      <span className="project-name">{project.name}</span>
                      <span className="project-date">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="project-actions">
                      <button
                        onClick={() => handleLoad(project.id)}
                        className="btn btn-small"
                        disabled={loading}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="btn btn-small btn-danger"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
