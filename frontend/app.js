// frontend/app.js
let currentUser = null;
let allRoutes = [];
let selectedRoute = null;
let currentTab = 'trips';

function showMessage(message, type = 'success') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;
  document.querySelector('.container').insertBefore(messageDiv, document.querySelector('section'));
  
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

function setLoading(isLoading) {
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    if (isLoading) {
      section.classList.add('loading');
    } else {
      section.classList.remove('loading');
    }
  });
}

function resetUI() {
  // Hide sections when no user is logged in
  document.getElementById("routes-section").style.display = "none";
  document.getElementById("favorites-section").style.display = "none";
  document.getElementById("route-details-section").style.display = "none";
  document.getElementById("user-info").innerText = "";
  
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
  
  document.getElementById("user-info").innerText = `Logged in as ${user.username}`;
  document.getElementById("routes-section").style.display = "block";
  document.getElementById("favorites-section").style.display = "block";
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
    
    // Only load routes and favorites if user was successfully created
    await loadRoutes();
    await loadFavorites();
    showMessage('User created successfully!');
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
    
    // Only load routes and favorites if user was successfully loaded
    await loadRoutes();
    await loadFavorites();
    showMessage(`User ${user.username} loaded successfully!`);
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
  
  // Show route details section
  document.getElementById("route-details-section").style.display = "block";
  
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
      li.innerHTML = `
        <span>${displayName}</span>
        <button onclick="deleteFavorite('${fav.item_id}', '${fav.type}')">Remove</button>
      `;
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

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', function() {
  resetUI();
});
