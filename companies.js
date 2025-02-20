document.documentElement.classList.add('ontouchstart' in window ? 'touch' : 'no-touch');

const sheetId = "1MfGjhr7cJbvxpPZ9H5kYzrvjj73-MujS_FgwKuUHxmU";
const sheetName = encodeURIComponent("BDD_Entreprise");
const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
console.log('Sheet URL:', sheetURL); // Debug log

// Initialize map
const map = L.map('map', {
    center: [46.603354, 1.888334],
    zoom: 6,
    zoomControl: false, // We'll add it manually in a better position for mobile
    tap: true // Enable tap handler for touch devices
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.control.zoom({
    position: 'topright'
}).addTo(map);

let markersLayer = L.layerGroup();
let markers = L.markerClusterGroup({
    disableClusteringAtZoom: 7,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    maxClusterRadius: 30
});
map.addLayer(markersLayer);

function processCompanies(data) {
    const companiesMap = new Map();
    
    data.forEach(member => {
        const positions = [
            { 
                type: 'Stage_IG3', 
                company: member.Entreprise_stage_IG3, 
                ville: member.Ville_Stage_IG3,
                location: member.Loc_Stage_IG3,
                contact: member.Contact_Stage_IG3
            },
            { 
                type: 'Stage_IG4', 
                company: member.Entreprise_Stage_IG4, 
                ville: member.Ville_Stage_IG4,
                location: member.Loc_Stage_IG4,
                contact: member.Contact_IG4
            },
            { 
                type: 'TFE', 
                company: member.Stage_TFE, 
                ville: member.Ville_Stage_TFE,
                location: member.Loc_Stage_TFE,
                contact: member.Contact_TFE
            },
            { 
                type: 'Emploi_1', 
                company: member.Entreprise_1, 
                ville: member.Ville_Entreprise_1,
                location: member.Loc_Entreprise_1,
                contact: member.Contact_Entreprise_1
            },
            { 
                type: 'Emploi_2', 
                company: member.Entreprise_2, 
                ville: member.Ville_Entreprise_2,
                location: member.Loc_Entreprise_2,
                contact: member.Contact_Entreprise_2
            },
            { 
                type: 'Emploi_3', 
                company: member.Entreprise_3, 
                ville: member.Ville_Entreprise_3,
                location: member.Loc_Entreprise_3,
                contact: member.Contact_Entreprise_3
            },
            { 
                type: 'Emploi_Actuel', 
                company: member.Entreprise_Actuelle, 
                ville: member.Ville_Entreprise_Actuelle,
                location: member.Loc_Entreprise_Actuelle,
                contact: null
            }
        ];

        positions.forEach(pos => {
            if (pos.company && pos.location) {
                const key = `${pos.company}-${pos.ville}`;
                const [lat, lon] = pos.location.split(',').map(coord => parseFloat(coord.trim()));
                
                if (!companiesMap.has(key)) {
                    companiesMap.set(key, {
                        name: pos.company,
                        ville: pos.ville,
                        lat: lat,
                        lon: lon,
                        types: new Set([pos.type]),
                        members: new Set([{
                            name: `${member.Nom} ${member.Prénom}`,
                            poste: member.Poste_Actuel,
                            linkedin: member.Lien_LinkedIn
                        }]),
                        contact: pos.contact
                    });
                } else {
                    const company = companiesMap.get(key);
                    company.types.add(pos.type);
                    company.members.add({
                        name: `${member.Nom} ${member.Prénom}`,
                        poste: member.Poste_Actuel,
                        linkedin: member.Lien_LinkedIn
                    });
                }
            }
        });
    });

    return Array.from(companiesMap.values());
}

function addCompanyMarkersAndList(companies, filters = {}) {
    markersLayer.clearLayers();
    markers.clearLayers();
    document.getElementById('companyList').innerHTML = '';

    companies.forEach(company => {
        if (!matchesFilters(company, filters)) return;

        let marker = L.marker([company.lat, company.lon])
            .bindPopup(`
                <div class="company-popup">
                    <div class="name">${company.name}</div>
                    <div class="location">${company.ville}</div>
                    <div class="types">Types de postes: ${Array.from(company.types).join(', ')}</div>
                    <div class="members">
                        <strong>Membres:</strong>
                        <ul>
                            ${Array.from(company.members).map(member => `
                                <li>
                                    ${member.name} - ${member.poste}
                                    ${member.linkedin ? 
                                        `<a href="${member.linkedin}" target="_blank">
                                            <img src="../assets/linkedin.png" alt="LinkedIn" class="linkedin-icon"/>
                                        </a>` 
                                        : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ${company.contact ? 
                        `<div class="contact">
                            <strong>Contact:</strong> ${company.contact}
                        </div>` 
                        : ''}
                </div>
            `);

        markers.addLayer(marker);
        markersLayer.addLayer(marker);

        document.getElementById('companyList').innerHTML += `
            <li class="company-item" data-lat="${company.lat}" data-lon="${company.lon}">
                <h4>${company.name}</h4>
                <div class="company-location">
                    <i class="fas fa-location-dot"></i>
                    <p>${company.ville}</p>
                </div>
                <div class="company-types">
                    ${Array.from(company.types).map(type => 
                        `<span class="company-type-tag">${type}</span>`
                    ).join('')}
                </div>
                <div class="company-members-count">
                    <i class="fas fa-users"></i>
                    <span>${company.members.size} membres</span>
                </div>
            </li>
        `;
    });

    // Add click event to list items to center map on company
    document.querySelectorAll('.company-item').forEach(item => {
        item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lon = parseFloat(item.dataset.lon);
            map.setView([lat, lon], 13);
        });
    });
}

function matchesFilters(company, filters) {
    const matchStage = !filters.stage || company.types.has(filters.stage);
    const matchEntreprise = !filters.entreprise || company.name === filters.entreprise;
    const matchVille = !filters.ville || company.ville === filters.ville;

    return matchStage && matchEntreprise && matchVille;
}

// Add this function to setup filters
function setupFilters(companies) {
    // Get unique values for each filter
    const entreprises = new Set();
    const villes = new Set();
    
    companies.forEach(company => {
        // Add company name to entreprises set
        if (company.name) entreprises.add(company.name);
        // Add ville to villes set
        if (company.ville) villes.add(company.ville);
    });

    // Populate enterprise filter
    const entrepriseFilter = document.getElementById('entrepriseFilter');
    entrepriseFilter.innerHTML = '<option value="">Chercher par Entreprise</option>';
    Array.from(entreprises).sort().forEach(entreprise => {
        entrepriseFilter.innerHTML += `<option value="${entreprise}">${entreprise}</option>`;
    });

    // Populate ville filter
    const villeFilter = document.getElementById('villeFilter');
    villeFilter.innerHTML = '<option value="">Chercher par Ville</option>';
    Array.from(villes).sort().forEach(ville => {
        villeFilter.innerHTML += `<option value="${ville}">${ville}</option>`;
    });

    // Add event listeners for filters
    ['stageFilter', 'entrepriseFilter', 'villeFilter'].forEach(filterId => {
        document.getElementById(filterId).addEventListener('change', function() {
            const filters = {
                stage: document.getElementById('stageFilter').value,
                entreprise: document.getElementById('entrepriseFilter').value,
                ville: document.getElementById('villeFilter').value
            };
            addCompanyMarkersAndList(companies, filters);
        });
    });

    // Add reset button functionality
    document.getElementById('resetFilters').addEventListener('click', function() {
        // Reset all filter selects
        document.getElementById('stageFilter').value = '';
        document.getElementById('entrepriseFilter').value = '';
        document.getElementById('villeFilter').value = '';

        // Add animation class
        this.classList.add('rotating');
        setTimeout(() => this.classList.remove('rotating'), 500);

        // Reset the map view
        addCompanyMarkersAndList(companies);
        map.setView([51.505, -0.09], 2);
    });
}

// Add CSS animation for reset button
const style = document.createElement('style');
style.textContent = `
    @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .rotating i {
        animation: rotate 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);

// Add resize handler
window.addEventListener('resize', function() {
    if (map) {
        map.invalidateSize();
    }
});

// Initialize the map when the page loads
$.ajax({
    type: "GET",
    url: sheetURL,
    dataType: "text",
    success: function(response) {
        let data = $.csv.toObjects(response);
        const companies = processCompanies(data);
        addCompanyMarkersAndList(companies);
        setupFilters(companies);
        updateCompanyStats(data);
    }
});

function processCompanyData(data) {
    const companyStats = new Map();
    
    data.forEach(member => {
        const companyName = formatCompanyName(member.Entreprise);
        const city = formatCity(member['Adresse/Ville']);
        const companyKey = `${companyName}-${city}`;
        
        if (!companyStats.has(companyKey)) {
            companyStats.set(companyKey, {
                name: companyName,
                city: city,
                currentMembers: 0,
                pastMembers: 0,
                totalMembers: 0,
                members: new Set() // Track unique members
            });
        }
        
        const stats = companyStats.get(companyKey);
        stats.members.add(member['Adresse e-mail']); // Use email as unique identifier
        
        if (formatCompanyName(member['Entreprise_Actuelle']) === companyName) {
            stats.currentMembers++;
        } else {
            stats.pastMembers++;
        }
    });
    
    // Update total members based on unique count
    companyStats.forEach(stats => {
        stats.totalMembers = stats.members.size;
        delete stats.members; // Clean up temporary set
    });
    
    return companyStats;
}

// Add this to your filter setup
function setupCompanyFilters(data) {
    const filterSelect = document.getElementById('stageFilter');
    filterSelect.addEventListener('change', function() {
        const selectedType = this.value;
        const filteredData = data.filter(member => {
            if (!selectedType) return true;
            
            const company = formatCompanyName(member.Entreprise);
            const city = formatCity(member['Adresse/Ville']);
            
            switch(selectedType) {
                case 'Stage_IG3':
                    return member.Stage_IG3 && formatCompanyName(member.Stage_IG3) === company;
                case 'Stage_IG4':
                    return member.Stage_IG4 && formatCompanyName(member.Stage_IG4) === company;
                case 'TFE':
                    return member.TFE && formatCompanyName(member.TFE) === company;
                case 'Emploi_1':
                    return member.Entreprise_1 && formatCompanyName(member.Entreprise_1) === company;
                default:
                    return true;
            }
        });
        
        updateCompanyMarkers(processCompanyData(filteredData));
    });
}

function createCompanyPopup(company, stats) {
    return `
        <div class="member-popup">
            <div class="popup-header">
                <div class="member-main">
                    <h3>${company.name}</h3>
                    <div class="member-company-info">
                        <i class="fas fa-location-dot"></i>
                        <span>${company.city}</span>
                    </div>
                </div>
            </div>
            <div class="popup-body">
                <div class="info-grid">
                    <div class="info-item">
                        <i class="fas fa-user-tie"></i>
                        <span>Membres Actuels: ${stats.currentMembers}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-history"></i>
                        <span>Anciens Membres: ${stats.pastMembers}</span>
                    </div>
                    <div class="info-item total">
                        <i class="fas fa-users"></i>
                        <span>Total Membres: ${stats.totalMembers}</span>
                    </div>
                </div>
            </div>
        </div>`;
}

// Sort companies alphabetically
function sortCompanies(companies) {
    return [...companies].sort((a, b) => {
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    });
}

function updateCompanyStats(data) {
    // Count unique companies
    const companies = new Set(data.map(member => 
        formatCompanyName(member.Entreprise)).filter(Boolean));
    
    // Count current employees
    const currentEmployees = data.filter(member => 
        member.Entreprise === member.Entreprise_Actuelle).length;
    
    // Count unique cities
    const cities = new Set(data.map(member => 
        formatCity(member['Adresse/Ville'])).filter(Boolean));

    // Update DOM elements
    const totalCompaniesElement = document.getElementById('totalCompanies');
    const totalEmployeesElement = document.getElementById('totalEmployees');
    const totalCitiesElement = document.getElementById('totalCities');

    if (totalCompaniesElement) totalCompaniesElement.textContent = companies.size;
    if (totalEmployeesElement) totalEmployeesElement.textContent = currentEmployees;
    if (totalCitiesElement) totalCitiesElement.textContent = cities.size;

    // Debug log to verify counts
    console.log('Company Stats Update:', {
        companies: companies.size,
        employees: currentEmployees,
        cities: cities.size
    });
}

// Make sure to call updateCompanyStats in your data loading function
function processData(data) {
    // ...existing code...
    updateCompanyStats(data);
    // ...existing code...
}