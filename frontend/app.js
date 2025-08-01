// frontend/app.js
let currentUser = null;
let allRoutes = [];
let selectedRoute = null;
let currentTab = 'stops';

// Check if we're on the login page or dashboard
const isLoginPage = window.location.pathname === '/' || window.location.pathname === '/index.html';
const isDashboardPage = window.location.pathname === '/dashboard.html';

function showMessage(message, type = 'success') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  
  if (isLoginPage) {
    messageDiv.textContent = message;
    document.querySelector('.login-container').insertBefore(messageDiv, document.querySelector('.login-card'));
  } else {
    messageDiv.textContent = message;
    document.querySelector('.container').insertBefore(messageDiv, document.querySelector('main'));
  }
  
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

function setLoading(isLoading) {
  if (isLoginPage) return;
  
  const sections = document.querySelectorAll('.dashboard-section');
  sections.forEach(section => {
    if (isLoading) {
      section.classList.add('loading');
    } else {
      section.classList.remove('loading');
    }
  });
}

function resetUI() {
  if (isLoginPage) {
    // On login page, we don't need to reset any user info display
    return;
  }
  
  // Hide sections when no user is logged in
  document.getElementById("routes-section").classList.remove("active");
  document.getElementById("favorites-section").classList.remove("active");
  document.getElementById("route-details-section").classList.remove("active");
  document.getElementById("current-user-display").innerText = "Welcome!";
  
  // Clear lists
  document.getElementById("subway-routes").innerHTML = "";
  document.getElementById("light-rail-routes").innerHTML = "";
  document.getElementById("rail-routes").innerHTML = "";
  document.getElementById("bus-routes").innerHTML = "";
  document.getElementById("favorites-list").innerHTML = "";
  document.getElementById("route-tab-content").innerHTML = "";
  document.getElementById("selected-route-info").innerHTML = "";
  
  // Reset state
  allRoutes = [];
  selectedRoute = null;
  currentTab = 'stops';
}

function displayUser(user) {
  if (!user) {
    resetUI();
    return;
  }
  
  if (isLoginPage) {
    // On login page, we don't need to display user info since we removed the element
    // The success message will be shown via showMessage instead
  } else {
    document.getElementById("current-user-display").innerText = `Welcome, ${user.username}!`;
  }
}

function redirectToDashboard() {
  // Store user info in sessionStorage so it's available on dashboard
  if (currentUser) {
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
  }
  window.location.href = '/dashboard.html';
}

function goHome() {
  // Show only the routes section, hide others
  document.getElementById("routes-section").classList.add("active");
  document.getElementById("favorites-section").classList.remove("active");
  document.getElementById("route-details-section").classList.remove("active");
  
  // Update nav buttons
  document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.nav-button[onclick="showSection(\'routes\')"]').classList.add('active');
  
  // Close all route category dropdowns
  document.querySelectorAll('.route-list').forEach(list => {
    list.classList.add('collapsed');
  });
  
  // Update toggle icons to show '+'
  document.querySelectorAll('.toggle-icon').forEach(icon => {
    icon.textContent = '+';
  });
  
  // Hide "Back to Home" button since we're on routes (home)
  const homeButtons = document.querySelectorAll('.btn-home');
  homeButtons.forEach(button => {
    button.style.display = 'none';
  });
}

function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.dashboard-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show selected section
  document.getElementById(`${sectionName}-section`).classList.add('active');
  
  // Update nav buttons
  document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Show/hide "Back to Home" button based on current section
  const homeButtons = document.querySelectorAll('.btn-home');
  homeButtons.forEach(button => {
    if (sectionName === 'routes') {
      button.style.display = 'none';
    } else {
      button.style.display = 'block';
    }
  });
  
  // If switching to routes section, reset the routes UI
  if (sectionName === 'routes') {
    // Hide route details section
    document.getElementById('route-details-section').classList.remove('active');
    
    // Collapse all route category dropdowns
    document.querySelectorAll('.route-list').forEach(list => {
      list.classList.add('collapsed');
    });
    
    // Reset toggle icons to '+'
    document.querySelectorAll('.toggle-icon').forEach(icon => {
      icon.textContent = '+';
    });
    
    // Clear any selected route
    selectedRoute = null;
    
    // Clear route details content
    const routeDetailsInfo = document.getElementById('selected-route-info');
    if (routeDetailsInfo) {
      routeDetailsInfo.innerHTML = '';
    }
    
    const routeTabContent = document.getElementById('route-tab-content');
    if (routeTabContent) {
      routeTabContent.innerHTML = '';
    }
  }
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  window.location.href = '/';
}

async function createUser() {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    showMessage('Please enter a username', 'error');
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: Failed to create user`);
    }
    
    const user = await res.json();
    currentUser = user;
    displayUser(user);
    
    showMessage('User created successfully! Redirecting to dashboard...');
    
    // Redirect to dashboard after successful login
    setTimeout(() => {
      redirectToDashboard();
    }, 1500);
  } catch (error) {
    showMessage('Error creating user: ' + error.message, 'error');
    currentUser = null;
    resetUI();
  } finally {
    setLoading(false);
  }
}

async function loadUser() {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    showMessage('Please enter a username', 'error');
    return;
  }

  setLoading(true);
  try {
    // Search for user by username
    const res = await fetch(`/users/username/${encodeURIComponent(username)}`);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: Failed to load user`);
    }
    
    const user = await res.json();
    currentUser = user;
    displayUser(user);
    
    showMessage(`User ${user.username} loaded successfully! Redirecting to dashboard...`);
    
    // Redirect to dashboard after successful login
    setTimeout(() => {
      redirectToDashboard();
    }, 1500);
  } catch (error) {
    showMessage('Error loading user: ' + error.message, 'error');
    currentUser = null;
    resetUI();
  } finally {
    setLoading(false);
  }
}

async function loadRoutes() {
  if (!currentUser) {
    console.warn('Attempted to load routes without a logged-in user');
    return;
  }
  
  try {
    const res = await fetch("/routes");
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: Failed to load routes`);
    }
    
    allRoutes = await res.json();
    displayRoutes(allRoutes);
  } catch (error) {
    showMessage('Error loading routes: ' + error.message, 'error');
    const categories = ['subway-routes', 'light-rail-routes', 'rail-routes', 'bus-routes'];
    categories.forEach(category => {
      document.getElementById(category).innerHTML = '<li style="grid-column: 1 / -1; text-align: center; color: #f56565;">Failed to load routes</li>';
    });
  }
}

function displayRoutes(routes) {
  // Clear all route lists
  document.getElementById("subway-routes").innerHTML = "";
  document.getElementById("light-rail-routes").innerHTML = "";
  document.getElementById("rail-routes").innerHTML = "";
  document.getElementById("bus-routes").innerHTML = "";
  
  if (!Array.isArray(routes) || routes.length === 0) {
    const categories = ['subway-routes', 'light-rail-routes', 'rail-routes', 'bus-routes'];
    categories.forEach(category => {
      document.getElementById(category).innerHTML = '<li style="grid-column: 1 / -1; text-align: center; color: #666;">No routes available</li>';
    });
    return;
  }
  
  // Group routes by type
  const routeGroups = {
    subway: routes.filter(route => route.route_type === 1),
    lightRail: routes.filter(route => route.route_type === 0),
    rail: routes.filter(route => route.route_type === 2),
    bus: routes.filter(route => route.route_type === 3)
  };
  
  // Display routes in each category
  displayRouteGroup('subway-routes', routeGroups.subway);
  displayRouteGroup('light-rail-routes', routeGroups.lightRail);
  displayRouteGroup('rail-routes', routeGroups.rail);
  displayRouteGroup('bus-routes', routeGroups.bus);
}

function displayRouteGroup(containerId, routes) {
  const container = document.getElementById(containerId);
  
  if (!routes || routes.length === 0) {
    container.innerHTML = '<li style="grid-column: 1 / -1; text-align: center; color: #666;">No routes available</li>';
    return;
  }
  
  routes.forEach(route => {
    const li = document.createElement("li");
    li.onclick = () => selectRoute(route);
    li.innerHTML = `
      <div>
        <strong>${route.long_name || route.short_name || 'Unnamed Route'}</strong>
      </div>
      <button onclick="event.stopPropagation(); addFavorite('${route.route_id}', 'route')">Add to Favorites</button>
    `;
    container.appendChild(li);
  });
}

function getRouteTypeName(type) {
  const types = {
    0: 'Light Rail',
    1: 'Subway',
    2: 'Rail',
    3: 'Bus'
  };
  return types[type] || 'Unknown';
}

function filterRoutes() {
  const searchTerm = document.getElementById("route-search").value.toLowerCase();
  
  if (!searchTerm) {
    displayRoutes(allRoutes);
    return;
  }
  
  const filteredRoutes = allRoutes.filter(route => {
    return (route.long_name && route.long_name.toLowerCase().includes(searchTerm)) ||
           (route.short_name && route.short_name.toLowerCase().includes(searchTerm));
  });
  
  displayRoutes(filteredRoutes);
}

function toggleCategory(category) {
  const routeList = document.getElementById(`${category}-routes`);
  const toggleIcon = routeList.previousElementSibling.querySelector('.toggle-icon');
  
  if (routeList.classList.contains('collapsed')) {
    routeList.classList.remove('collapsed');
    toggleIcon.textContent = '-';
  } else {
    routeList.classList.add('collapsed');
    toggleIcon.textContent = '+';
  }
}

function selectRoute(route) {
  selectedRoute = route;
  
  // Display route info
  const infoDiv = document.getElementById("selected-route-info");
  infoDiv.innerHTML = `
    <h3>${route.long_name || route.short_name}</h3>
    <p><strong>Route ID:</strong> ${route.route_id}</p>
    <p><strong>Type:</strong> ${getRouteTypeName(route.route_type)}</p>
  `;
  
  // Hide other sections and show route details
  document.querySelectorAll('.dashboard-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById("route-details-section").classList.add("active");
  
  // Show "Back to Home" button since we're viewing route details
  const homeButtons = document.querySelectorAll('.btn-home');
  homeButtons.forEach(button => {
    button.style.display = 'block';
  });
  
  // Load initial tab content
  showRouteTab('stops');
  
  // Scroll to route details
  document.getElementById("route-details-section").scrollIntoView({ behavior: 'smooth' });
}

function showRouteTab(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Find the clicked button and make it active
  const clickedButton = event.target;
  if (clickedButton && clickedButton.classList.contains('tab-button')) {
    clickedButton.classList.add('active');
  }
  
  // Load tab content
  loadTabContent(tabName);
}

async function loadTabContent(tabName) {
  if (!selectedRoute) return;
  
  const contentDiv = document.getElementById("route-tab-content");
  contentDiv.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';
  
  try {
    switch (tabName) {
      case 'stops':
        await loadRouteStops();
        break;
      case 'live':
        await loadLiveVehicles();
        break;
      case 'alerts':
        await loadRouteAlerts();
        break;
    }
  } catch (error) {
    contentDiv.innerHTML = `<div style="text-align: center; color: #f56565; padding: 2rem;">Error loading ${tabName}: ${error.message}</div>`;
  }
}

async function loadRouteStops() {
  console.log('Loading stops for route:', selectedRoute.route_id);
  const res = await fetch(`/routes/${selectedRoute.route_id}/stops`);
  if (!res.ok) throw new Error('Failed to load stops');
  
  const stops = await res.json();
  console.log('Received stops:', stops);
  console.log('Number of stops:', stops.length);
  
  const contentDiv = document.getElementById("route-tab-content");
  
  if (!Array.isArray(stops) || stops.length === 0) {
    contentDiv.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No stops available for this route</div>';
    return;
  }
  
  let html = '<div class="stops-list">';
  stops.forEach((stop, index) => {
    console.log(`Stop ${index}:`, stop);
    html += `
      <div class="stop-item">
        <h4>${stop.stop_name || 'Unnamed Stop'}</h4>
        <p><strong>ID:</strong> ${stop.stop_id}</p>
        ${stop.lat && stop.lon ? `<p><strong>Location:</strong> ${stop.lat}, ${stop.lon}</p>` : ''}
      </div>
    `;
  });
  html += '</div>';
  contentDiv.innerHTML = html;
}

async function loadLiveVehicles() {
  const res = await fetch(`/live/${selectedRoute.route_id}`);
  if (!res.ok) throw new Error('Failed to load live vehicles');
  
  const vehicles = await res.json();
  const contentDiv = document.getElementById("route-tab-content");
  
  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    contentDiv.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No live vehicles available for this route</div>';
    return;
  }
  
  // Fetch stop information for each vehicle
  const vehiclesWithStops = await Promise.all(
    vehicles.map(async (vehicle) => {
      if (vehicle.stop_id) {
        try {
          const stopRes = await fetch(`/stops/${vehicle.stop_id}`);
          if (stopRes.ok) {
            const stop = await stopRes.json();
            return { ...vehicle, stop_name: stop.stop_name };
          }
        } catch (error) {
          console.warn(`Failed to fetch stop info for ${vehicle.stop_id}:`, error);
        }
      }
      return vehicle;
    })
  );
  
  let html = '<div class="vehicles-list">';
  vehiclesWithStops.forEach(vehicle => {
    const location = vehicle.stop_name || `Stop ID: ${vehicle.stop_id}`;
    
    // Format occupancy information
    let occupancyText = 'No occupancy data available';
    if (vehicle.occupancy_status && vehicle.occupancy_status !== '') {
      // Convert occupancy status to readable format
      let statusText = vehicle.occupancy_status.toLowerCase().replace(/_/g, ' ');
      statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);
      occupancyText = `${statusText} (${vehicle.occupancy_percentage || 0}%)`;
    }
    
    // Convert status to human-readable format
    let statusText = '';
    switch (vehicle.status) {
      case 'INCOMING_AT':
        statusText = `Arriving at ${location}`;
        break;
      case 'STOPPED_AT':
        statusText = `Stopped at ${location}`;
        break;
      case 'IN_TRANSIT_TO':
        statusText = `In transit to ${location}`;
        break;
      default:
        statusText = `${vehicle.status} ${location}`;
    }
    
    html += `
      <div class="vehicle-item">
        <h4>Vehicle ${vehicle.vehicle_id}</h4>
        <p><strong>Status:</strong> ${statusText}</p>
        <p><strong>Direction:</strong> ${vehicle.direction_id === 0 ? 'Outbound' : 'Inbound'}</p>
        <p><strong>Occupancy:</strong> ${occupancyText}</p>
      </div>
    `;
  });
  html += '</div>';
  contentDiv.innerHTML = html;
}

async function loadRouteAlerts() {
  try {
    const res = await fetch("/alerts");
    if (!res.ok) throw new Error('Failed to load alerts');
    
    const alerts = await res.json();
    const contentDiv = document.getElementById("route-tab-content");
    
    if (!Array.isArray(alerts) || alerts.length === 0) {
      contentDiv.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No alerts available for this route</div>';
      return;
    }
    
    // Filter alerts that are relevant to this route (route_id in any informed_entity)
    const relevantAlerts = alerts.filter(alert => {
      if (!alert.alert || !alert.alert.informed_entity) return false;
      return alert.alert.informed_entity.some(entity => entity.route_id === selectedRoute.route_id);
    });
    
    if (relevantAlerts.length === 0) {
      contentDiv.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No alerts for this route</div>';
      return;
    }
    
    let html = '<div class="alerts-list">';
    relevantAlerts.forEach(alert => {
      const headerText = alert.alert.header_text?.translation?.[0]?.text || 'No header';
      const descriptionText = alert.alert.description_text?.translation?.[0]?.text || '';
      const effect = alert.alert.effect || 'Unknown';
      html += `
        <div class="alert-item">
          <h4>${headerText}</h4>
          ${descriptionText ? `<p><strong>Description:</strong> ${descriptionText}</p>` : ''}
          <p><strong>Effect:</strong> ${effect}</p>
        </div>
      `;
    });
    html += '</div>';
    contentDiv.innerHTML = html;
  } catch (error) {
    const contentDiv = document.getElementById("route-tab-content");
    contentDiv.innerHTML = `<div style="text-align: center; color: #f56565; padding: 2rem;">Error loading alerts: ${error.message}</div>`;
  }
}

async function loadFavorites() {
  if (!currentUser) {
    console.warn('Attempted to load favorites without a logged-in user');
    return;
  }
  
  try {
    const res = await fetch(`/users/${currentUser.id}/favorites`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: Failed to load favorites`);
    }
    
    const favorites = await res.json();
    const ul = document.getElementById("favorites-list");
    ul.innerHTML = "";
    
    if (!Array.isArray(favorites) || favorites.length === 0) {
      ul.innerHTML = '<li style="grid-column: 1 / -1; text-align: center; color: #666;">No favorites yet. Add some routes to get started!</li>';
      return;
    }
    
    favorites.forEach(fav => {
      const li = document.createElement("li");
      // Display the route name if available, otherwise fall back to ID
      const displayName = fav.item_name || `${fav.type.toUpperCase()} - ${fav.item_id}`;
      
      // Make the favorite clickable if it's a route
      if (fav.type === 'route') {
        li.innerHTML = `
          <div class="favorite-route-header">
            <span style="color: #48bb78;">${displayName}</span>
            <button onclick="deleteFavorite('${fav.item_id}', '${fav.type}')">Remove</button>
          </div>
          <div id="favorite-route-${fav.item_id}" class="favorite-route-details" style="display: none;">
            <div class="favorite-route-tabs">
              <button class="favorite-tab-button active" onclick="showFavoriteRouteTab('${fav.item_id}', 'stops')">Stops</button>
              <button class="favorite-tab-button" onclick="showFavoriteRouteTab('${fav.item_id}', 'live')">Live Vehicles</button>
              <button class="favorite-tab-button" onclick="showFavoriteRouteTab('${fav.item_id}', 'alerts')">Alerts</button>
            </div>
            <div id="favorite-route-content-${fav.item_id}" class="favorite-route-content"></div>
          </div>
        `;
        
        // Add click handler to the entire list item
        li.onclick = function(e) {
          // Don't trigger if clicking on the remove button
          if (e.target.tagName === 'BUTTON') {
            return;
          }
          toggleFavoriteRouteDetails(fav.item_id);
        };
      } else {
        li.innerHTML = `
          <span>${displayName}</span>
          <button onclick="deleteFavorite('${fav.item_id}', '${fav.type}')">Remove</button>
        `;
      }
      ul.appendChild(li);
    });
  } catch (error) {
    showMessage('Error loading favorites: ' + error.message, 'error');
    const ul = document.getElementById("favorites-list");
    ul.innerHTML = '<li style="grid-column: 1 / -1; text-align: center; color: #f56565;">Failed to load favorites</li>';
  }
}

async function addFavorite(itemID, itemType) {
  if (!currentUser) {
    showMessage('Please log in first', 'error');
    return;
  }
  
  try {
    const res = await fetch(`/users/${currentUser.id}/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: itemID,
        type: itemType
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: Failed to add favorite`);
    }
    
    await loadFavorites();
    showMessage('Added to favorites!');
  } catch (error) {
    showMessage('Error adding favorite: ' + error.message, 'error');
  }
}

async function deleteFavorite(itemID, itemType) {
  if (!currentUser) {
    showMessage('Please log in first', 'error');
    return;
  }
  
  try {
    const res = await fetch(`/users/${currentUser.id}/favorites/${itemType}/${itemID}`, {
      method: "DELETE"
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: Failed to delete favorite`);
    }
    
    await loadFavorites();
    showMessage('Removed from favorites!');
  } catch (error) {
    showMessage('Error removing favorite: ' + error.message, 'error');
  }
}

function toggleFavoriteRouteDetails(routeId) {
  const detailsDiv = document.getElementById(`favorite-route-${routeId}`);
  if (detailsDiv.style.display === 'none') {
    detailsDiv.style.display = 'block';
    // Load initial content (stops)
    showFavoriteRouteTab(routeId, 'stops');
  } else {
    detailsDiv.style.display = 'none';
  }
}

function showFavoriteRouteTab(routeId, tabName) {
  // Update tab buttons
  const tabButtons = document.querySelectorAll(`#favorite-route-${routeId} .favorite-tab-button`);
  tabButtons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Load tab content
  loadFavoriteRouteTabContent(routeId, tabName);
}

async function loadFavoriteRouteTabContent(routeId, tabName) {
  const contentDiv = document.getElementById(`favorite-route-content-${routeId}`);
  contentDiv.innerHTML = '<div style="text-align: center; padding: 1rem;">Loading...</div>';
  
  try {
    switch (tabName) {
      case 'stops':
        await loadFavoriteRouteStops(routeId);
        break;
      case 'live':
        await loadFavoriteRouteLiveVehicles(routeId);
        break;
      case 'alerts':
        await loadFavoriteRouteAlerts(routeId);
        break;
    }
  } catch (error) {
    contentDiv.innerHTML = `<div style="text-align: center; color: #f56565; padding: 1rem;">Error loading ${tabName}: ${error.message}</div>`;
  }
}

async function loadFavoriteRouteStops(routeId) {
  const res = await fetch(`/routes/${routeId}/stops`);
  if (!res.ok) throw new Error('Failed to load stops');
  
  const stops = await res.json();
  const contentDiv = document.getElementById(`favorite-route-content-${routeId}`);
  
  if (!Array.isArray(stops) || stops.length === 0) {
    contentDiv.innerHTML = '<div style="text-align: center; color: #666; padding: 1rem;">No stops available for this route</div>';
    return;
  }
  
  let html = '<div class="favorite-stops-list">';
  stops.forEach(stop => {
    html += `
      <div class="favorite-stop-item">
        <strong>${stop.stop_name || 'Unnamed Stop'}</strong>
        <small>ID: ${stop.stop_id}</small>
      </div>
    `;
  });
  html += '</div>';
  contentDiv.innerHTML = html;
}

async function loadFavoriteRouteLiveVehicles(routeId) {
  const res = await fetch(`/live/${routeId}`);
  if (!res.ok) throw new Error('Failed to load live vehicles');
  
  const vehicles = await res.json();
  const contentDiv = document.getElementById(`favorite-route-content-${routeId}`);
  
  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    contentDiv.innerHTML = '<div style="text-align: center; color: #666; padding: 1rem;">No live vehicles available for this route</div>';
    return;
  }
  
  // Fetch stop information for each vehicle
  const vehiclesWithStops = await Promise.all(
    vehicles.map(async (vehicle) => {
      if (vehicle.stop_id) {
        try {
          const stopRes = await fetch(`/stops/${vehicle.stop_id}`);
          if (stopRes.ok) {
            const stop = await stopRes.json();
            return { ...vehicle, stop_name: stop.stop_name };
          }
        } catch (error) {
          console.warn(`Failed to fetch stop info for ${vehicle.stop_id}:`, error);
        }
      }
      return vehicle;
    })
  );
  
  let html = '<div class="favorite-vehicles-list">';
  vehiclesWithStops.forEach(vehicle => {
    const location = vehicle.stop_name || `Stop ID: ${vehicle.stop_id}`;
    
    // Format occupancy information
    let occupancyText = 'No occupancy data available';
    if (vehicle.occupancy_status && vehicle.occupancy_status !== '') {
      let statusText = vehicle.occupancy_status.toLowerCase().replace(/_/g, ' ');
      statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);
      occupancyText = `${statusText} (${vehicle.occupancy_percentage || 0}%)`;
    }
    
    // Convert status to human-readable format
    let statusText = '';
    switch (vehicle.status) {
      case 'INCOMING_AT':
        statusText = `Arriving at ${location}`;
        break;
      case 'STOPPED_AT':
        statusText = `Stopped at ${location}`;
        break;
      case 'IN_TRANSIT_TO':
        statusText = `In transit to ${location}`;
        break;
      default:
        statusText = `${vehicle.status} ${location}`;
    }
    
    html += `
      <div class="favorite-vehicle-item">
        <strong>Vehicle ${vehicle.vehicle_id}</strong>
        <div>${statusText}</div>
        <small>Occupancy: ${occupancyText}</small>
      </div>
    `;
  });
  html += '</div>';
  contentDiv.innerHTML = html;
}

async function loadFavoriteRouteAlerts(routeId) {
  const res = await fetch('/alerts');
  if (!res.ok) throw new Error('Failed to load alerts');
  
  const alerts = await res.json();
  const contentDiv = document.getElementById(`favorite-route-content-${routeId}`);
  
  // Filter alerts for this specific route
  const routeAlerts = alerts.filter(alert => 
    alert.alert && 
    alert.alert.informed_entity && 
    alert.alert.informed_entity.some(entity => 
      entity.route_id === routeId
    )
  );
  
  if (routeAlerts.length === 0) {
    contentDiv.innerHTML = '<div style="text-align: center; color: #666; padding: 1rem;">No alerts for this route</div>';
    return;
  }
  
  let html = '<div class="favorite-alerts-list">';
  routeAlerts.forEach(alert => {
    const headerText = alert.alert.header_text?.translation?.[0]?.text || 'No header';
    const descriptionText = alert.alert.description_text?.translation?.[0]?.text || '';
    const effect = alert.alert.effect || 'Unknown';
    
    html += `
      <div class="favorite-alert-item">
        <strong>${headerText}</strong>
        ${descriptionText ? `<div>${descriptionText}</div>` : ''}
        <small>Effect: ${effect}</small>
      </div>
    `;
  });
  html += '</div>';
  contentDiv.innerHTML = html;
}

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', function() {
  resetUI();
});

// Initialize dashboard if on dashboard page
if (isDashboardPage) {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      // Restore user from sessionStorage
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
        displayUser(currentUser);
      } else {
        // No user found, redirect to login
        window.location.href = '/';
        return;
      }
      
      await loadRoutes();
      await loadFavorites();
      
      // Show routes section by default
      document.getElementById("routes-section").classList.add("active");
      document.getElementById("favorites-section").classList.remove("active");
      document.getElementById("route-details-section").classList.remove("active");
      
      // Set routes nav button as active
      document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
      document.querySelector('.nav-button[onclick="showSection(\'routes\')"]').classList.add('active');
      
      // Hide "Back to Home" button since we're on routes (home)
      const homeButtons = document.querySelectorAll('.btn-home');
      homeButtons.forEach(button => {
        button.style.display = 'none';
      });
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    }
  });
}
