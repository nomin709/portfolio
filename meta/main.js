let data = [];

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));

    displayStats();
    console.log(commits);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  updateScatterplot(commits);

  // let filteredCommits = [];
  function displayCommitFiles(filteredCommits) {
    const lines = filteredCommits.flatMap((d) => d.lines);
    let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
    let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => {
      return { name, lines };
    });
    files = d3.sort(files, (d) => -d.lines.length);
    d3.select('.files').selectAll('div').remove();
    let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');
    filesContainer.append('dt')
        .append('code')
        .text(d => d.name)
        .append('small') // Add a <small> element to display the total number of lines
        .style('display', 'block') // Ensure it's on a new line
        .style('opacity', 0.6) // Make it slightly less opaque
        .text(d => `${d.lines.length} lines`);
    filesContainer.append('dd')
                  .selectAll('div')
                  .data(d => d.lines)
                  .enter()
                  .append('div')
                  .attr('class', 'line')
                  .style('background', d => fileTypeColors(d.type));
  }

  let NUM_ITEMS = commits.length + 1; // Ideally, let this value be the length of your commit history
  let ITEM_HEIGHT = 70; // Feel free to change
  let VISIBLE_COUNT = 5; // Feel free to change as well
  let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
  const scrollContainer = d3.select('#scroll-container');
  const spacer = d3.select('#spacer');
  spacer.style('height', `${totalHeight}px`);
  const itemsContainer = d3.select('#items-container');
  scrollContainer.on('scroll', () => {
    const scrollTop = scrollContainer.property('scrollTop');
    let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
    renderItems(startIndex);
  });

  const scrollContainer2 = d3.select('#scroll-container2');
  const spacer2 = d3.select('#spacer2');
  spacer2.style('height', `${totalHeight}px`);
  const itemsContainer2 = d3.select('#items-container2');
  scrollContainer2.on('scroll', () => {
    const scrollTop = scrollContainer2.property('scrollTop');
    let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
    renderItems2(startIndex);
  });

  function renderItems(startIndex) {
    // Clear things off
    itemsContainer.selectAll('div').remove();
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
    let newCommitSlice = commits.slice(0, endIndex);

    // TODO: how should we update the scatterplot (hint: it's just one function call)
    updateScatterplot(newCommitSlice);
    // Re-bind the commit data to the container and represent each using a div
    itemsContainer
      .selectAll('div')
      .data(newCommitSlice)
      .enter()
      .append('div')
      .style('position', 'absolute')
      .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`)
      .html((commit, idx) => {
        // Create a narrative for each commit (this is where the dummy narrative comes in)
        return `
            <p>
                On ${commit.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"})}, I made
                <a href="${commit.url}" target="_blank" id="project-url">
                    ${idx > 0 ? 'another glorious commit.' : 'my first commit, and it was glorious.'}
                </a>I edited ${commit.totalLines} lines across ${d3.rollups(commit.lines, D => D.length, d => d.file).length} files.
            </p>
        `;
      });
  }

  function renderItems2(startIndex) {
    // Clear things off
    itemsContainer2.selectAll('div').remove();
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
    let newCommitSlice = commits.slice(0, endIndex);

    // TODO: how should we update the scatterplot (hint: it's just one function call)
    displayCommitFiles(newCommitSlice);
    // Re-bind the commit data to the container and represent each using a div
    itemsContainer2
      .selectAll('div')
      .data(newCommitSlice)
      .enter()
      .append('div')
      .style('position', 'absolute')
      .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`)
      .html((commit, idx) => {
        // Create a narrative for each commit (this is where the dummy narrative comes in)
        return `
            <p>
                On ${commit.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"})}, I made
                <a href="${commit.url}" target="_blank" id="project-url">
                    ${idx > 0 ? 'another glorious commit.' : 'my first commit, and it was glorious.'}
                </a>I edited ${commit.totalLines} lines across ${d3.rollups(commit.lines, D => D.length, d => d.file).length} files.
            </p>
        `;
      });
  }
  renderItems(0);
  renderItems2(0);
});

let commits = [];

function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          // What other options do we need to set?
          // Hint: look up configurable, writable, and enumerable
          writable: false,       // Prevent modification of the 'lines' property
          enumerable: false,     // Do not include 'lines' in property enumeration
          configurable: false    // Prevent reconfiguration or deletion of this property
        });
  
        return ret;
      });

      commits.sort((a, b) => a.datetime - b.datetime);
}

function displayStats() {
    // Process commits first
    processCommits();

    d3.select('#stats').selectAll('dl').remove();

    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
    
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total Commits');
    dl.append('dd').text(commits.length);
  
    // Add more stats as needed...
    dl.append('dt').text('Average Depth');
    dl.append('dd').text(d3.mean(data, d => d.depth));

    dl.append('dt').text('Maximum Depth');
    dl.append('dd').text(d3.max(data, d => d.depth));

    dl.append('dt').text('Number of Files');
    dl.append('dd').text(d3.group(data, d => d.file).size);

    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file
    );
    const averageFileLength = Math.round(d3.mean(fileLengths, (d) => d[1]));
    dl.append('dt').text('Average File Length (in lines)');
    dl.append('dd').text(averageFileLength);

    const workByPeriod = d3.rollups(
        data,
        (v) => v.length,
        (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
    );
    const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
    dl.append('dt').text('Peak Work Time');
    dl.append('dd').text(maxPeriod);

    const lines = d3.rollups(
      data,
      (v) => d3.max(v, (v) => v.line),
      (d) => d.file
    );
    const longestLine = d3.max(lines, (d) => d[1]);
    dl.append('dt').text('Longest Line');
    dl.append('dd').text(longestLine);
}

let xScale;
let yScale;

function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const linesEdited = document.getElementById('commit-lines-edited');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });

  time.textContent = commit.datetime?.toLocaleTimeString('en', {
    timeStyle: 'short',
  });

  // Author
  author.textContent = commit.author; // Fallback if no author is provided

  linesEdited.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function brushSelector() {
  const svg = document.querySelector('svg');
  // Update brush initialization to listen for events
  d3.select(svg).call(d3.brush().on('start brush end', brushed));

  // Raise dots and everything after overlay
  d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}

let selectedCommits = [];

function brushed(evt) {
  let brushSelection = evt.selection;
  selectedCommits = !brushSelection
    ? []
    : commits.filter((commit) => {
        let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
        let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
        let x = xScale(commit.date);
        let y = yScale(commit.hourFrac);

        return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
      });

    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
}

function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
}

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function updateLanguageBreakdown() {
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }

  return breakdown;
}

function updateScatterplot(filteredCommits)  {
  const width = 1000;
  const height = 600;

  d3.select('svg').remove(); // first clear the svg
  const svg = d3
  .select('#chart')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .style('overflow', 'visible');

  xScale = d3
  .scaleTime()
  .domain(d3.extent(filteredCommits, (d) => d.datetime))
  .range([0, width])
  .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  svg.selectAll('g').remove(); // clear the scatters in order to re-draw the filtered ones
  const dots = svg.append('g').attr('class', 'dots');

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  
  const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
  };
    
  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Add gridlines BEFORE the axes
  const gridlines = svg
  .append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Create the axes
  const xAxis = d3.axisBottom(xScale);

  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
  .append('g')
  .attr('transform', `translate(0, ${usableArea.bottom})`)
  .call(xAxis);

  // Add Y axis
  svg
  .append('g')
  .attr('transform', `translate(${usableArea.left}, 0)`)
  .call(yAxis);

  const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
  // adjust these values based on your experimentation
  const rScale = d3
  .scaleSqrt() // Change only this line
  .domain([minLines, maxLines])
  .range([2, 30]);

   // Sort commits by total lines in descending order
  const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);

  dots.selectAll('circle').remove(); 
  // Use sortedCommits in your selection instead of commits
  dots.selectAll('circle').data(sortedCommits).join('circle');

  updateTooltipVisibility(false);

  dots
  .selectAll('circle')
  .data(filteredCommits)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', (d) => rScale(d.totalLines))
  .style('fill-opacity', 0.7) // Add transparency for overlapping dots
  .attr('fill', 'steelblue')
  .on('mouseenter', (event, commit) => {
    d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
    d3.select(event.currentTarget).classed('selected', selectedCommits.includes(commit));
    updateTooltipContent(commit);
    updateTooltipVisibility(true);
    updateTooltipPosition(event);
  })
  .on('mouseleave', () => {
    d3.select(event.currentTarget).style('fill-opacity', 0.7);
    d3.select(event.currentTarget).classed('selected', false);
    updateTooltipContent({});
    updateTooltipVisibility(false);
  });

  brushSelector();
}

  // function filterCommitsByTime() {
  //   let timeScale = d3.scaleTime(
  //     [d3.min(data, d => d.datetime), d3.max(data, d => d.datetime)], [0, 100]
  //   );
    
  //   let commitMaxTime = timeScale.invert(commitProgress);
    
  //   // Filter the commits based on the commitMaxTime
  //   filteredCommits = commits.filter((commit) => commit.datetime <= commitMaxTime);

  //   let lines = filteredCommits.flatMap((d) => d.lines);
  //   let files = [];
  //   files = d3
  //     .groups(lines, (d) => d.file)
  //     .map(([name, lines]) => {
  //       return { name, lines };
  //     });

  //   files = d3.sort(files, (d) => -d.lines.length);
  //   // Ensure the container is cleared before rendering new data
  //   d3.select('.files').selectAll('div').remove(); 

  //   let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

  //   // Create divs for each file and append dt and dd elements
  //   let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');

  //   // Append <dt> (file name) and <dd> (number of lines) for each file
  //   filesContainer.append('dt')
  //     .append('code')
  //     .text(d => d.name)
  //     .append('small') // Add a <small> element to display the total number of lines
  //     .style('display', 'block') // Ensure it's on a new line
  //     .style('opacity', 0.6) // Make it slightly less opaque
  //     .text(d => `${d.lines.length} lines`);

  //   filesContainer
  //     .append('dd')
  //     .selectAll('div')
  //     .data(d => d.lines)
  //     .enter().append('div')
  //     .attr('class', 'line') // Add class 'line' to each <div>;
  //     .style('background', d => fileTypeColors(d.type)) // Set the background color based on the file type; 
  // }
