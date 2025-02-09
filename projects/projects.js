import { fetchJSON, renderProjects, countProjects} from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');
const projectsTitleContainer = document.querySelector('.projects-title');
countProjects(projectsTitleContainer, projects);

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    // re-calculate rolled data
    let newRolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year,
    );
    // re-calculate data
    let newData = newRolledData.map(([year, count]) => {
      return { value: count, label: year };
    });
    // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));

    // clear up paths and legends
    let newSVG = d3.select('svg'); 
    newSVG.selectAll('path').remove();
    let legend = d3.select('.legend');
    legend.selectAll('li').remove();

    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    
    // update paths and legends, refer to steps 1.4 and 2.2
    newArcs.forEach((arc, idx) => {
        newSVG
          .append('path')
          .attr('d', arc)
          .attr('fill', colors(idx)) // Fill in the attribute for fill color via indexing the colors variable
    })

    newData.forEach((d, idx) => {
        legend.append('li')
              .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
              .attr('class', 'labels')
              .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    })  
}

  // Call this function on page load
renderPieChart(projects);

function setQuery(query) {
    return projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase())
    });
}

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    let filteredProjects = setQuery(event.target.value);
    // re-render legends and pie chart when event triggers
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});

let selectedIndex = -1;
let svg = d3.select('svg');
svg.selectAll('path').remove();
arcs.forEach((arc, i) => {
    svg
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(i))
        .on('click', () => {
            selectedIndex = selectedIndex === i ? -1 : i;
            svg
                .selectAll('path')
                .attr('class', (_, idx) => {
                    // filter idx to find correct pie slice and apply CSS from above
                    return idx === selectedIndex ? 'selected' : '';
                });

            legend
                .selectAll('li')
                .attr('class', (_, idx) => {
                    // filter idx to find correct legend and apply CSS from above
                    return idx === selectedIndex ? 'selected' : '';
                });
                
            if (selectedIndex === -1) {
                renderProjects(projects, projectsContainer, 'h2');
                } else {
                // TODO: filter projects and project them onto webpage
                // Hint: `.label` might be useful
            }
        });
});