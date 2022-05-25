async function main() {
  const result = document.getElementById("result");
  const fetchStatus = document.getElementById("fetch-status");

  const form = document.querySelector("form");
  const searchBox = document.getElementById("username");

  const searchParams = new URLSearchParams(window.location.search);
  const username = searchParams.get("username");

  searchBox.value = username || "";
  searchBox.focus();

  if (!username) return;

  fetchStatus.classList.remove("hidden");
  fetchStatus.innerHTML = "Fetching data... &#129488;";

  const data = await fetchGithubData(username);

  if (!data) {
    fetchStatus.innerHTML = "Cannot reach or not found! &#128533;";
    return;
  }
  fetchStatus.classList.add("hidden");

  result.classList.remove("hidden");
  result.innerHTML = formatFetchedData(data);
}

async function fetchOrganizations(url) {
  const baseGithubUrl = "https://github.com/";
  const response = await fetch(url);

  const data = response.ok && await response.json()
    .then(array => array.reduce((acc, cur) => {
        const orgData = {};
        orgData.avatar_url = cur.avatar_url;
        orgData.org_url = baseGithubUrl + cur.login;
        return [...acc, orgData];
      }, []))
    .catch(err => console.warn(err.response));

  return data;
}

async function fetchStars(url) {
  const response = await fetch(url);
  const data = response.ok && await response.json()
    .then(json => json.length)
    .catch(err => console.warn(err.response));

  return data;
}

async function fetchGithubData(username) {
  const baseGithubApiUrl = "https://api.github.com/users/";
  const cookie = JSON.parse(sessionStorage.getItem(username));
  if (cookie) return cookie;

  const data = {};

  const response = await fetch(baseGithubApiUrl + username)
    .catch(err => ({ ok: false }));

  if (!response.ok) return;

  const json = await response.json();

  data.avatar_url = json.avatar_url;
  data.user_url = json.html_url;
  data.website_url = data.blog;
  data.name = json.name;
  data.username = json.login;
  data.bio = json.bio;
  data.followers = json.followers;
  data.following = json.following;
  data.repos = json.public_repos;
  data.gists = json.public_gists;
  data.location = json.location;
  data.company = json.company;
  data.email = json.email;

  data.created_at = (new Date(json.created_at)).toUTCString().replace(/.*,\s|\s\d{2}:.*/g, "");
  data.stars = await fetchStars(json.starred_url.replace(/{.*}/g, ""));
  data.orgs = await fetchOrganizations(json.organizations_url);

  sessionStorage.setItem(username, JSON.stringify(data));

  return data;
}

function formatFetchedData(data) {
  const uiElements = [];

  uiElements.push("<section>");
  uiElements.push(`<img id="avatar" src=${data.avatar_url}>`);

  uiElements.push(`
    <div>
      <p id="name"><a href="${data.user_url}">${data.name}</a></p>
      <p id="login">${data.username}</p>
    </div>
  `);

  if (data.bio)
    uiElements.push(`<p id="bio">${data.bio}</p>`);

  if (data.website_url)
    uiElements.push(`
      <p class="content">
        <span>&#128279; </span>
        <a class="value" href="${data.website_url}">${data.website_url}</span>
      </p>
    `);
  uiElements.push("</section>");

  uiElements.push("<section>");
  uiElements.push(`
    <p class="content">
      <span>&#128198; </span>
      Since <span class="value">${data.created_at}</span>
    </p>
  `);

  uiElements.push("</br>");

  uiElements.push(`
    <p class="content">
      <span>&#128101; </span>
      <span class="value">${data.followers}</span> followers
      <span> • </span>
      <span class="value">${data.following}</span> following
    </p>
  `);
  uiElements.push(`
    <p class="content">
      <span>&#128193; </span>
      <span class="value">${data.repos}</span> repos
      <span> • </span>
      <span class="value">${data.gists}</span> gists
    </p>
  `);
  uiElements.push(`
    <p class="content">
      <span>&#11088; </span>
      <span class="value">${data.stars}</span> stars
    </p>
  `);

  uiElements.push("</br>");

  if (data.company)
    uiElements.push(`
      <p class="content">
        <span>&#127970; </span>
        <span class="value">${data.company}</span>
      </p>
    `);
  if (data.location)
    uiElements.push(`
      <p class="content">
        <span>&#128205; </span>
        <span class="value">${data.location}</span>
      </p>
    `);
  if (data.email)
    uiElements.push(`
      <p class="content">
        <span>&#9993;&#65039; </span>
        <span class="value">${data.email}</span>
      </p>
    `);

  if (data.orgs.length) {
    uiElements.push("</br>");
    uiElements.push('<p class="value">Organizations</p>');
    uiElements.push('<div id="organizations">');
    data.orgs.forEach(org =>
      uiElements.push(`
        <a href=${org.org_url}>
          <img src=${org.avatar_url}>
        </a>
      `)
    );
    uiElements.push("</div>");
  }

  uiElements.push("</section>");

  return uiElements.join('');
}

main();

