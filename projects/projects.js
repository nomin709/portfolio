import { fetchJSON, renderProjects, countProjects} from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');
const projectsTitleContainer = document.querySelector('.projects-title');
countProjects(projectsTitleContainer, projects);
// projectsTitleContainer.textContent = `${projects.length} Projects`;
// countProjects(containerElement, projects)