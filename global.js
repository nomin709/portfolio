console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/nomin709', title: 'GitHub' }
];

let nav = document.createElement('nav');

document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    const ARE_WE_HOME = document.documentElement.classList.contains('home');
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;       
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);
    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname
    );
    if (a.host !== location.host) {
        a.setAttribute('target', '_blank');
    }
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
        <label class="color-scheme">
            Theme:
            <select>
                <option value="light dark">Automatic</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </label>`
);

let select = document.querySelector("select");

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value
});

if ("colorScheme" in localStorage) {
    let userPref = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', userPref);
    select.value = userPref;
}

let form = document.querySelector("form");

form?.addEventListener('submit', function(event) {
    event.preventDefault();
    let data = new FormData(form);
    let url = `${form.action}?`;
    for (let [name, value] of data) {
        console.log(name, encodeURIComponent(value));
        url = `${url}${name}=${encodeURIComponent(value)}&`;
    }
    location.href = url;
});

export async function fetchJSON(url) {
    try {
        // Fetch the JSON file from the given URL
        const response = await fetch(url);
        console.log(response)
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(data)
        return data; 
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
} 

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    containerElement.innerHTML = '';
    for (let project of projects) {
        const article = document.createElement('article');
        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image}" alt="${project.title}">
            <div>
                <p>${project.description}</p>
                <p>${project.year}</p>
            </div>`;
        containerElement.appendChild(article);
    }
}

export function countProjects(containerElement, projects) {
    containerElement.textContent = `${projects.length} Projects`;
}

export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}