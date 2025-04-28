/**
 * KPI Translator & Alignment Tool
 * 
 * This JavaScript module provides functionality for:
 * - Business Glossary management
 * - KPI translation between teams
 * - Report validation for misalignments
 * - Unified definition generation
 */

// The main KPI data store
let kpiData = {
    metrics: {},
    unifiedDefinitions: {},
    translationMatrix: {},
    misalignmentRules: []
};

// Sample data to load if no CSV is provided
const sampleData = [
    { Team: 'Marketing', Metric_Name: 'Engagement Rate', Definition: 'Clicks + opens ? total emails sent over past 30 days.' },
    { Team: 'Sales', Metric_Name: 'Qualified Lead', Definition: 'Any lead with a score >80 OR passed SDR call.' },
    { Team: 'Product', Metric_Name: 'Activation', Definition: 'User finishes onboarding OR uses 2+ features in week 1.' },
    { Team: 'Customer Success', Metric_Name: 'Churn Risk', Definition: 'Accounts with >2 support tickets OR NPS < 7.' },
    { Team: 'Data', Metric_Name: 'Retention', Definition: 'Returning users after 30 days, excluding email-only logins.' },
    { Team: 'Marketing', Metric_Name: 'Conversion', Definition: 'Leads from paid campaigns that sign up, trial, or click a CTA.' },
    { Team: 'Marketing', Metric_Name: 'Bounce Rate', Definition: 'Emails not opened OR flagged by filters.' },
    { Team: 'Sales', Metric_Name: 'Close Rate', Definition: 'Closed deals ? total leads from CRM (includes disqualified ones).' },
    { Team: 'Sales', Metric_Name: 'Lead Quality', Definition: 'Demographic match, website activity score, and AE judgment.' },
    { Team: 'Product', Metric_Name: 'Feature Adoption', Definition: 'Usage of any newly shipped feature within 14 days.' },
    { Team: 'Product', Metric_Name: 'Time to Value', Definition: 'Average days between signup and first retained session.' },
    { Team: 'Customer Success', Metric_Name: 'NPS', Definition: 'Average score from latest customer survey. Filtered by region.' },
    { Team: 'Customer Success', Metric_Name: 'Engagement Score', Definition: 'Blend of logins, support usage, webinar attendance.' },
    { Team: 'Finance', Metric_Name: 'Customer Lifetime Value', Definition: 'Revenue per user times estimated tenure (model varies by segment).' },
    { Team: 'Finance', Metric_Name: 'CAC', Definition: 'Sales + marketing cost ? new *qualified* customers (definition varies).' }
];

// Define semantic keywords for grouping metrics
const semanticKeywords = {
    'user_engagement': ['engagement', 'activation', 'adoption', 'power user', 'session', 'login', 'reach'],
    'financial': ['revenue', 'roi', 'cac', 'lifetime value', 'mrr', 'pipeline', 'deal'],
    'customer_sentiment': ['nps', 'satisfaction', 'churn', 'retention'],
    'lead_management': ['lead', 'conversion', 'close rate', 'attribution'],
    'quality': ['integrity', 'compliance', 'anomaly', 'accuracy']
};

// Friendly names for semantic groups
const semanticGroupNames = {
    'user_engagement': 'User Engagement & Activation',
    'financial': 'Financial Performance Metrics',
    'customer_sentiment': 'Customer Satisfaction & Retention',
    'lead_management': 'Lead Generation & Conversion',
    'quality': 'Data Quality & Compliance'
};

// Team colors for UI
const teamColors = {
    'Marketing': '#4285F4',  // Blue
    'Sales': '#34A853',      // Green
    'Product': '#FBBC05',    // Yellow
    'Customer Success': '#EA4335',  // Red
    'Data': '#8956FF',       // Purple
    'Finance': '#FF6D01',    // Orange
    'Legal': '#2A9D8F',      // Teal
    'Success': '#E76F51'     // Coral
};

/**
 * Initialize the KPI Translator tool
 */
function initKPITranslator() {
    // Load sample data by default
    loadSampleData();
    
    // Set up event listeners
    document.getElementById('sourceTeam').addEventListener('change', updateSourceMetrics);
    document.getElementById('sourceMetric').addEventListener('change', updateSourceDefinition);
    document.getElementById('translateBtn').addEventListener('click', translateMetric);
    document.getElementById('validateReportBtn').addEventListener('click', validateReport);
    document.getElementById('loadSampleDataBtn').addEventListener('click', loadSampleData);
    document.getElementById('saveNewMetricBtn').addEventListener('click', saveNewMetric);
    document.getElementById('glossarySearch').addEventListener('input', filterGlossary);
    document.getElementById('exportGlossary').addEventListener('click', exportGlossary);
    document.getElementById('newMetricTeam').addEventListener('change', handleOtherTeam);

    
    // Set up file upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('bg-light');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('bg-light');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('bg-light');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

/**
 * Handle the "Other" option in the team dropdown
 */
function handleOtherTeam() {
    const teamSelect = document.getElementById('newMetricTeam');
    const otherTeamDiv = document.getElementById('otherTeamDiv');
    
    if (teamSelect.value === 'other') {
        otherTeamDiv.style.display = 'block';
    } else {
        otherTeamDiv.style.display = 'none';
    }
}

/**
 * Load sample KPI data
 */
function loadSampleData() {
    processKpiData(sampleData);
    updateUI();
    showToast('Sample data loaded successfully');
}

/**
 * Handle CSV file upload
 */
function handleFileUpload(file) {
    if (file.type !== 'text/csv') {
        alert('Please upload a CSV file');
        return;
    }
    
    Papa.parse(file, {
        header: true,
        complete: (results) => {
            if (results.data && results.data.length > 0) {
                // Validate CSV format
                const requiredColumns = ['Team', 'Metric_Name', 'Definition'];
                const headers = Object.keys(results.data[0]);
                
                const missingColumns = requiredColumns.filter(col => !headers.includes(col));
                if (missingColumns.length > 0) {
                    alert(`CSV is missing required columns: ${missingColumns.join(', ')}`);
                    return;
                }
                
                processKpiData(results.data);
                updateUI();
                showToast('KPI data loaded successfully');
            } else {
                alert('The CSV file appears to be empty or invalid');
            }
        },
        error: (error) => {
            alert(`Error parsing CSV: ${error}`);
        }
    });
}

/**
 * Process KPI data from CSV or sample
 */
function processKpiData(data) {
    try {
        // Reset data
        kpiData.metrics = {};
        kpiData.unifiedDefinitions = {};
        kpiData.translationMatrix = {};
        
        // Process each metric
        data.forEach(row => {
            const team = row.Team;
            const metricName = row.Metric_Name;
            const definition = row.Definition;
            
            // Skip empty rows
            if (!team || !metricName || !definition) {
                return;
            }
            
            // Initialize team if needed
            if (!kpiData.metrics[team]) {
                kpiData.metrics[team] = {};
            }
            
            // Add metric with initial semantic groups (will be populated later)
            kpiData.metrics[team][metricName] = {
                definition: definition,
                semanticGroups: []
            };
        });
        
        // Build semantic groups
        buildSemanticGroups();
        
        // Generate unified definitions
        generateUnifiedDefinitions();
        
        // Create translation matrix
        createTranslationMatrix();
        
        // Define misalignment rules
        defineMisalignmentRules();
    } catch (error) {
        console.error("Error processing KPI data:", error);
        showToast(`Error processing data: ${error.message}`);
    }
}


/**
 * Categorize metrics into semantic groups based on keywords
 */
function buildSemanticGroups() {
    // For each metric, check which semantic groups it belongs to
    for (const team in kpiData.metrics) {
        for (const metricName in kpiData.metrics[team]) {
            const metricData = kpiData.metrics[team][metricName];
            const metricNameLower = metricName.toLowerCase();
            const definitionLower = metricData.definition.toLowerCase();
            
            // Check each semantic group
            for (const group in semanticKeywords) {
                const keywords = semanticKeywords[group];
                
                // Check if any keyword matches
                for (const keyword of keywords) {
                    if (metricNameLower.includes(keyword) || definitionLower.includes(keyword)) {
                        metricData.semanticGroups.push(group);
                        break;
                    }
                }
            }
        }
    }
}

/**
 * Generate unified definitions for metrics that span multiple teams
 */
function generateUnifiedDefinitions() {
    // Group metrics by semantic category
    const semanticGroups = {};
    
    for (const team in kpiData.metrics) {
        for (const metricName in kpiData.metrics[team]) {
            const metricData = kpiData.metrics[team][metricName];
            
            for (const group of metricData.semanticGroups) {
                if (!semanticGroups[group]) {
                    semanticGroups[group] = [];
                }
                
                semanticGroups[group].push({
                    team: team,
                    metricName: metricName,
                    definition: metricData.definition
                });
            }
        }
    }
    
    // Create unified definitions for groups with metrics from multiple teams
    for (const group in semanticGroups) {
        const metrics = semanticGroups[group];
        
        // Get unique teams
        const teams = new Set(metrics.map(m => m.team));
        
        if (teams.size > 1) {
            // This semantic group spans multiple teams
            kpiData.unifiedDefinitions[group] = {
                name: semanticGroupNames[group] || group.replace('_', ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
                definition: createUnifiedDefinition(metrics, group),
                relatedMetrics: metrics.map(m => `${m.team}: ${m.metricName}`),
                teamsAffected: Array.from(teams)
            };
        }
    }
}

/**
 * Create a unified definition from multiple team-specific metric definitions
 */
function createUnifiedDefinition(metrics, group) {
    // Simplified approach - in a real implementation, you would use more sophisticated NLP
    
    // For specific known unified definitions
    const userAcquisitionKeywords = ['lead', 'activation', 'engage', 'conversion', 'onboarding'];
    const retentionKeywords = ['retention', 'churn', 'recurring'];
    
    // Check if this is a user acquisition/activation group
    if (metrics.some(m => 
        userAcquisitionKeywords.some(kw => 
            m.metricName.toLowerCase().includes(kw) || m.definition.toLowerCase().includes(kw)
        )
    )) {
        return "The process of converting prospects to engaged users, spanning from initial interest to active product usage.";
    }
    
    // Check if this is a retention group
    else if (metrics.some(m => 
        retentionKeywords.some(kw => 
            m.metricName.toLowerCase().includes(kw) || m.definition.toLowerCase().includes(kw)
        )
    )) {
        return "The ability to retain existing customers and maintain recurring revenue over time.";
    }
    
    // For other semantic groups
    else {
        const teams = Array.from(new Set(metrics.map(m => m.team)));
        teams.sort();
        
        if (teams.length > 2) {
            return `A cross-functional metric that spans ${teams.slice(0, -1).join(', ')} and ${teams[teams.length-1]} departments, representing related but team-specific success indicators.`;
        } else if (teams.length === 2) {
            return `A shared metric between ${teams[0]} and ${teams[1]} teams with related but distinct measurement criteria.`;
        } else {
            return `A key performance indicator for the ${teams[0]} team.`;
        }
    }
}

/**
 * Create a translation matrix between team-specific metrics
 */
function createTranslationMatrix() {
    // Focus on the key metrics from the problem statement
    const targetMetrics = {
        'Sales': ['qualified lead', 'lead quality'],
        'Marketing': ['engagement rate', 'conversion'],
        'Product': ['activation', 'feature adoption']
    };
    
    kpiData.translationMatrix = {};
    
    // Create translations between these target metrics
    for (const sourceTeam in targetMetrics) {
        if (!kpiData.translationMatrix[sourceTeam]) {
            kpiData.translationMatrix[sourceTeam] = {};
        }
        
        const sourceMetrics = [];
        for (const metricName in kpiData.metrics[sourceTeam] || {}) {
            if (targetMetrics[sourceTeam].some(target => metricName.toLowerCase().includes(target))) {
                sourceMetrics.push({
                    name: metricName,
                    definition: kpiData.metrics[sourceTeam][metricName].definition
                });
            }
        }
        
        // Create translations to other teams' metrics
        for (const targetTeam in targetMetrics) {
            if (sourceTeam === targetTeam) continue;
            
            const targetTeamMetrics = [];
            for (const metricName in kpiData.metrics[targetTeam] || {}) {
                if (targetMetrics[targetTeam].some(target => metricName.toLowerCase().includes(target))) {
                    targetTeamMetrics.push({
                        name: metricName,
                        definition: kpiData.metrics[targetTeam][metricName].definition
                    });
                }
            }
            
            // Create translations between each source and target metric
            for (const sourceMetric of sourceMetrics) {
                if (!kpiData.translationMatrix[sourceTeam][sourceMetric.name]) {
                    kpiData.translationMatrix[sourceTeam][sourceMetric.name] = {};
                }
                
                if (!kpiData.translationMatrix[sourceTeam][sourceMetric.name][targetTeam]) {
                    kpiData.translationMatrix[sourceTeam][sourceMetric.name][targetTeam] = {};
                }
                
                for (const targetMetric of targetTeamMetrics) {
                    const translation = generateTranslation(
                        sourceTeam, sourceMetric,
                        targetTeam, targetMetric
                    );
                    
                    kpiData.translationMatrix[sourceTeam][sourceMetric.name][targetTeam][targetMetric.name] = translation;
                }
            }
        }
    }
}

/**
 * Generate a translation between two metrics
 */
function generateTranslation(sourceTeam, sourceMetric, targetTeam, targetMetric) {
    const sourceMetricNameLower = sourceMetric.name.toLowerCase();
    const targetMetricNameLower = targetMetric.name.toLowerCase();
    
    // Lead-to-activation translations
    if ((sourceTeam === 'Sales' && sourceMetricNameLower.includes('lead')) && 
        (targetTeam === 'Product' && targetMetricNameLower.includes('activation'))) {
        return `When ${sourceTeam} refers to "${sourceMetric.name}", this represents potential users who will become "${targetMetric.name}" once they begin using the product.`;
    }
    else if ((sourceTeam === 'Product' && sourceMetricNameLower.includes('activation')) && 
             (targetTeam === 'Sales' && targetMetricNameLower.includes('lead'))) {
        return `"${sourceMetric.name}" represents users who successfully converted from what ${targetTeam} designated as "${targetMetric.name}".`;
    }
    else if ((sourceTeam === 'Marketing' && (sourceMetricNameLower.includes('engage') || sourceMetricNameLower.includes('conversion'))) && 
             (targetTeam === 'Sales' && targetMetricNameLower.includes('lead'))) {
        return `When ${sourceTeam} reports "${sourceMetric.name}", this corresponds to potential "${targetMetric.name}", though ${targetTeam} applies additional qualification criteria.`;
    }
    else if ((sourceTeam === 'Sales' && sourceMetricNameLower.includes('lead')) && 
             (targetTeam === 'Marketing' && (targetMetricNameLower.includes('engage') || targetMetricNameLower.includes('conversion')))) {
        return `"${sourceMetric.name}" represents users who have progressed beyond ${targetTeam}'s "${targetMetric.name}" with additional qualification steps.`;
    }
    else if ((sourceTeam === 'Marketing' && (sourceMetricNameLower.includes('engage') || sourceMetricNameLower.includes('conversion'))) && 
             (targetTeam === 'Product' && targetMetricNameLower.includes('activation'))) {
        return `"${sourceMetric.name}" is a precursor to ${targetTeam}'s "${targetMetric.name}". High engagement should eventually lead to higher activation rates.`;
    }
    else if ((sourceTeam === 'Product' && sourceMetricNameLower.includes('activation')) && 
             (targetTeam === 'Marketing' && (targetMetricNameLower.includes('engage') || targetMetricNameLower.includes('conversion')))) {
        return `"${sourceMetric.name}" represents successful conversion of what ${targetTeam} initially tracked as "${targetMetric.name}".`;
    }
    
    // Generic translations for other metrics
    else {
        return `When ${sourceTeam} refers to "${sourceMetric.name}" (${sourceMetric.definition}), this roughly corresponds to ${targetTeam}'s "${targetMetric.name}" (${targetMetric.definition}), though with different measurement criteria.`;
    }
}

/**
 * Define rules for detecting KPI misalignment in reports
 */
function defineMisalignmentRules() {
    kpiData.misalignmentRules = [
        {
            rule: "Mixed terminology without translation",
            pattern: function(text) {
                const teams = Object.keys(kpiData.metrics);
                for (let i = 0; i < teams.length; i++) {
                    for (let j = i + 1; j < teams.length; j++) {
                        const team1 = teams[i];
                        const team2 = teams[j];
                        
                        const metrics1 = Object.keys(kpiData.metrics[team1] || {});
                        const metrics2 = Object.keys(kpiData.metrics[team2] || {});
                        
                        if (text.includes(team1) && text.includes(team2) && 
                            metrics1.some(m => text.includes(m)) && metrics2.some(m => text.includes(m))) {
                            return true;
                        }
                    }
                }
                return false;
            },
            recommendation: "Flag and suggest adding a terminology translation section"
        },
        {
            rule: "Success metric ambiguity",
            pattern: function(text) {
                const textLower = text.toLowerCase();
                if (textLower.includes('success')) {
                    const teams = Object.keys(kpiData.metrics);
                    const mentionedTeams = teams.filter(team => text.includes(team));
                    
                    if (mentionedTeams.length > 1) {
                        return true;
                    }
                }
                return false;
            },
            recommendation: "Flag and suggest using the unified definition with team context"
        },
        {
            rule: "Incompatible time windows",
            pattern: function(text) {
                const textLower = text.toLowerCase();
                return (textLower.includes('30 day') && textLower.includes('14 day')) || 
                       (textLower.includes('30-day') && textLower.includes('14-day')) || 
                       (textLower.includes('monthly') && textLower.includes('weekly'));
            },
            recommendation: "Flag and suggest standardizing or explicitly noting the difference"
        }
    ];
}

/**
 * Translate a metric from one team to another
 */
function translateMetric() {
    const sourceTeam = document.getElementById('sourceTeam').value;
    const sourceMetric = document.getElementById('sourceMetric').value;
    const targetTeam = document.getElementById('targetTeam').value;
    
    // Reset all result fields to default messages
    document.getElementById('translationText').textContent = "No translation available for this metric.";
    document.getElementById('unifiedDefinition').innerHTML = "No unified definition available for this metric.";
    document.getElementById('misalignmentWarning').textContent = "No specific misalignment concerns detected.";
    
    // Handle same team case
    if (sourceTeam === targetTeam) {
        document.getElementById('translationText').textContent = "Same team - no translation needed.";
        document.getElementById('unifiedDefinition').textContent = "N/A - Same team";
        document.getElementById('misalignmentWarning').textContent = "No misalignment risk within the same team.";
        return;
    }
    
    // Check if source metric exists
    if (!kpiData.metrics[sourceTeam] || !kpiData.metrics[sourceTeam][sourceMetric]) {
        return;
    }
    
    // Check if we have a direct translation
    if (kpiData.translationMatrix[sourceTeam] && 
        kpiData.translationMatrix[sourceTeam][sourceMetric] && 
        kpiData.translationMatrix[sourceTeam][sourceMetric][targetTeam]) {
        
        const targetTranslations = kpiData.translationMatrix[sourceTeam][sourceMetric][targetTeam];
        const firstTargetMetric = Object.keys(targetTranslations)[0];
        
        if (firstTargetMetric) {
            document.getElementById('translationText').textContent = targetTranslations[firstTargetMetric];
        }
    }
    
    // Look for unified definitions
    const semanticGroups = kpiData.metrics[sourceTeam]?.[sourceMetric]?.semanticGroups || [];
    
    for (const group of semanticGroups) {
        if (kpiData.unifiedDefinitions[group]) {
            const unified = kpiData.unifiedDefinitions[group];
            if (unified.teamsAffected.includes(targetTeam)) {
                document.getElementById('unifiedDefinition').innerHTML = `<strong>${unified.name}:</strong> ${unified.definition}`;
                break;
            }
        }
    }
    
    // Generate misalignment warning
    document.getElementById('misalignmentWarning').textContent = generateMisalignmentWarning(sourceTeam, sourceMetric, targetTeam);
}


/**
 * Generate a misalignment warning for the selected metrics
 */
function generateMisalignmentWarning(sourceTeam, sourceMetric, targetTeam) {
    // Check if the metric actually exists
    if (!sourceTeam || !sourceMetric || !targetTeam || 
        !kpiData.metrics[sourceTeam] || 
        !kpiData.metrics[sourceTeam][sourceMetric]) {
        return "Cannot generate misalignment warning - metric not found.";
    }
    
    return `When discussing "${sourceMetric}" with the ${targetTeam} team, use the unified definition and clarify the different measurement criteria to avoid misunderstandings.`;
}


/**
 * Validate a report for KPI misalignment issues
 */
function validateReport() {
    const reportText = document.getElementById('reportText').value;
    
    if (!reportText) {
        alert('Please enter report text to validate');
        return;
    }
    
    const issues = [];
    
    // Apply each rule to the report text
    for (const rule of kpiData.misalignmentRules) {
        if (rule.pattern(reportText)) {
            issues.push({
                rule: rule.rule,
                recommendation: rule.recommendation
            });
        }
    }
    
    // Also check for specific metric mentions
    const teams = Object.keys(kpiData.metrics);
    const mentionedTeams = [];
    const mentionedMetrics = [];
    
    for (const team of teams) {
        if (reportText.includes(team)) {
            mentionedTeams.push(team);
            
            for (const metric in kpiData.metrics[team]) {
                if (reportText.includes(metric)) {
                    mentionedMetrics.push({
                        team: team,
                        metric: metric
                    });
                }
            }
        }
    }
    
    // If metrics from multiple teams are mentioned, add a specific warning
    if (mentionedTeams.length > 1 && mentionedMetrics.length > 1) {
        const teamsWithMetrics = [];
        for (const team of mentionedTeams) {
            const teamMetrics = mentionedMetrics
                .filter(m => m.team === team)
                .map(m => m.metric);
            
            if (teamMetrics.length > 0) {
                teamsWithMetrics.push({
                    team: team,
                    metrics: teamMetrics
                });
            }
        }
        
        if (teamsWithMetrics.length > 1) {
            issues.push({
                rule: "Cross-team metrics without context",
                recommendation: `This report mentions metrics from multiple teams: ${teamsWithMetrics.map(t => `${t.team} (${t.metrics.join(', ')})`).join(' and ')}. Consider adding a translation section to clarify how these metrics relate.`
            });
        }
    }
    
    // Display results
    const resultsCard = document.getElementById('validationResultsCard');
    const resultsContainer = document.getElementById('validationResults');
    
    if (issues.length === 0) {
        resultsContainer.innerHTML = `
            <div class="alert alert-success">
                <i class="bi bi-check-circle"></i> No KPI misalignments detected in this report.
            </div>`;
    } else {
        let issuesHtml = `<div class="alert alert-warning mb-4">
            <i class="bi bi-exclamation-triangle"></i> Detected ${issues.length} potential KPI misalignment issue(s).
        </div>`;
        
        for (const issue of issues) {
            issuesHtml += `
                <div class="warning-card">
                    <h6 class="mb-2">${issue.rule}</h6>
                    <p>${issue.recommendation}</p>
                </div>`;
        }
        
        resultsContainer.innerHTML = issuesHtml;
    }
    
    resultsCard.style.display = 'block';
}

/**
 * Add a new metric to the glossary
 */
function saveNewMetric() {
    let team = document.getElementById('newMetricTeam').value;
    
    if (team === 'other') {
        team = document.getElementById('otherTeamName').value;
        if (!team) {
            alert('Please enter a team name');
            return;
        }
    }
    
    const metricName = document.getElementById('newMetricName').value;
    const definition = document.getElementById('newMetricDefinition').value;
    
    if (!metricName || !definition) {
        alert('Please enter both metric name and definition');
        return;
    }
    
    // Initialize team if needed
    if (!kpiData.metrics[team]) {
        kpiData.metrics[team] = {};
    }
    
    // Add the new metric
    kpiData.metrics[team][metricName] = {
        definition: definition,
        semanticGroups: []
    };
    
    // Rebuild the semantic groups, unified definitions, and translation matrix
    buildSemanticGroups();
    generateUnifiedDefinitions();
    createTranslationMatrix();
    
    // Update UI
    updateUI();
    
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addMetricModal'));
    modal.hide();
    
    // Show confirmation
    showToast(`Added "${metricName}" to ${team} glossary`);
}

/**
 * Export the business glossary as JSON
 */
function exportGlossary() {
    const glossary = {
        metrics: kpiData.metrics,
        unifiedDefinitions: kpiData.unifiedDefinitions,
        translationMatrix: kpiData.translationMatrix
    };
    
    const jsonBlob = new Blob([JSON.stringify(glossary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business_glossary.json';
    a.click();
    
    URL.revokeObjectURL(url);
    
    showToast('Business glossary exported successfully');
}

/**
 * Filter the glossary table based on search input
 */
function filterGlossary() {
    const searchTerm = document.getElementById('glossarySearch').value.toLowerCase();
    const rows = document.querySelectorAll('#glossaryTable tbody tr');
    
    for (const row of rows) {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

/**
 * Update source metrics dropdown based on selected team
 */
function updateSourceMetrics() {
    const sourceTeam = document.getElementById('sourceTeam').value;
    const sourceMetricSelect = document.getElementById('sourceMetric');
    
    // Clear existing options
    sourceMetricSelect.innerHTML = '';
    
    // Add options for the selected team
    const teamMetrics = kpiData.metrics[sourceTeam] || {};
    const metricNames = Object.keys(teamMetrics);
    
    if (metricNames.length === 0) {
        // If no metrics, add a placeholder option
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '-- No metrics available --';
        sourceMetricSelect.appendChild(option);
    } else {
        // Add all available metrics
        for (const metric in teamMetrics) {
            const option = document.createElement('option');
            option.value = metric;
            option.textContent = metric;
            sourceMetricSelect.appendChild(option);
        }
    }
    
    // Update definition
    updateSourceDefinition();
}


/**
 * Update the source metric definition display
 */
function updateSourceDefinition() {
    const sourceTeam = document.getElementById('sourceTeam').value;
    const sourceMetric = document.getElementById('sourceMetric').value;
    const definitionElement = document.getElementById('sourceDefinition');
    
    // Clear existing definition
    definitionElement.textContent = 'No definition available';
    
    // Check if we have a definition for this metric
    if (sourceTeam && sourceMetric && 
        kpiData.metrics[sourceTeam] && 
        kpiData.metrics[sourceTeam][sourceMetric] &&
        kpiData.metrics[sourceTeam][sourceMetric].definition) {
        definitionElement.textContent = kpiData.metrics[sourceTeam][sourceMetric].definition;
    }
}


/**
 * Update all UI elements after data changes
 */
function updateUI() {
    // Update teams dropdown
    updateTeamsDropdown();
    
    // Update source metrics dropdown
    updateSourceMetrics();
    
    // Update glossary table
    updateGlossaryTable();
    
    // Update unified definitions
    updateUnifiedDefinitions();
}

/**
 * Update teams dropdown with all available teams
 */
function updateTeamsDropdown() {
    const sourceTeamSelect = document.getElementById('sourceTeam');
    const targetTeamSelect = document.getElementById('targetTeam');
    const newMetricTeamSelect = document.getElementById('newMetricTeam');
    
    // Get current selections
    const sourceTeamValue = sourceTeamSelect.value;
    const targetTeamValue = targetTeamSelect.value;
    
    // Get all teams
    const teams = Object.keys(kpiData.metrics).sort();
    
    // Update source team dropdown
    sourceTeamSelect.innerHTML = '';
    for (const team of teams) {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        sourceTeamSelect.appendChild(option);
    }
    
    // Update target team dropdown
    targetTeamSelect.innerHTML = '';
    for (const team of teams) {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        targetTeamSelect.appendChild(option);
    }
    
    // Add teams to new metric dropdown (without clearing existing options)
    const existingOptions = Array.from(newMetricTeamSelect.options).map(o => o.value);
    for (const team of teams) {
        if (!existingOptions.includes(team)) {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            // Insert before the "other" option
            newMetricTeamSelect.insertBefore(option, newMetricTeamSelect.lastChild);
        }
    }
    
    // Restore selections if possible
    if (teams.includes(sourceTeamValue)) {
        sourceTeamSelect.value = sourceTeamValue;
    }
    
    if (teams.includes(targetTeamValue)) {
        targetTeamSelect.value = targetTeamValue;
    } else if (teams.length > 1 && sourceTeamValue) {
        // Select a different team than the source team
        for (const team of teams) {
            if (team !== sourceTeamValue) {
                targetTeamSelect.value = team;
                break;
            }
        }
    }
}

/**
 * Update the glossary table with all metrics
 */
function updateGlossaryTable() {
    const tableBody = document.querySelector('#glossaryTable tbody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add a row for each metric
    for (const team in kpiData.metrics) {
        for (const metricName in kpiData.metrics[team]) {
            const metricData = kpiData.metrics[team][metricName];
            
            const row = document.createElement('tr');
            
            // Team column
            const teamCell = document.createElement('td');
            const teamBadge = document.createElement('span');
            teamBadge.className = 'team-badge';
            teamBadge.style.backgroundColor = teamColors[team] || '#6c757d';
            teamBadge.style.color = 'white';
            teamBadge.textContent = team;
            teamCell.appendChild(teamBadge);
            row.appendChild(teamCell);
            
            // Metric column
            const metricCell = document.createElement('td');
            metricCell.className = 'fw-semibold';
            metricCell.textContent = metricName;
            row.appendChild(metricCell);
            
            // Definition column
            const definitionCell = document.createElement('td');
            definitionCell.textContent = metricData.definition;
            row.appendChild(definitionCell);
            
            // Related metrics column
            const relatedCell = document.createElement('td');
            
            // Find unified definitions that include this metric
            const relatedGroups = [];
            for (const group in kpiData.unifiedDefinitions) {
                const unified = kpiData.unifiedDefinitions[group];
                if (unified.relatedMetrics.some(m => m === `${team}: ${metricName}`)) {
                    relatedGroups.push(unified.name);
                }
            }
            
            if (relatedGroups.length > 0) {
                const relatedList = document.createElement('small');
                relatedList.innerHTML = relatedGroups.map(g => `<span class="badge bg-warning text-dark me-1">${g}</span>`).join('');
                relatedCell.appendChild(relatedList);
            } else {
                relatedCell.textContent = '-';
            }
            
            row.appendChild(relatedCell);
            tableBody.appendChild(row);
        }
    }
}

/**
 * Update the unified definitions display
 */
function updateUnifiedDefinitions() {
    const container = document.getElementById('unifiedDefinitionsContainer');
    
    // Clear existing content
    container.innerHTML = '';
    
    // Add each unified definition
    for (const group in kpiData.unifiedDefinitions) {
        const unified = kpiData.unifiedDefinitions[group];
        
        const card = document.createElement('div');
        card.className = 'unified-card mb-4';
        
        const header = document.createElement('h5');
        header.textContent = unified.name;
        card.appendChild(header);
        
        const definition = document.createElement('p');
        definition.textContent = unified.definition;
        card.appendChild(definition);
        
        const teamsHeading = document.createElement('h6');
        teamsHeading.className = 'mt-3 mb-2';
        teamsHeading.textContent = 'Related Team Metrics:';
        card.appendChild(teamsHeading);
        
        const metricsList = document.createElement('div');
        
        for (const team of unified.teamsAffected) {
            const teamMetrics = unified.relatedMetrics
                .filter(m => m.startsWith(`${team}: `))
                .map(m => m.substring(team.length + 2));
            
            if (teamMetrics.length > 0) {
                const teamBadge = document.createElement('div');
                teamBadge.className = 'mb-2';
                
                const badge = document.createElement('span');
                badge.className = 'team-badge';
                badge.style.backgroundColor = teamColors[team] || '#6c757d';
                badge.style.color = 'white';
                badge.textContent = team;
                teamBadge.appendChild(badge);
                
                const metrics = document.createElement('span');
                metrics.textContent = `: ${teamMetrics.join(', ')}`;
                teamBadge.appendChild(metrics);
                
                metricsList.appendChild(teamBadge);
            }
        }
        
        card.appendChild(metricsList);
        container.appendChild(card);
    }
    
    // Show a message if no unified definitions exist
    if (Object.keys(kpiData.unifiedDefinitions).length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                No unified definitions available yet. Add metrics from multiple teams to generate unified definitions.
            </div>`;
    }
}

/**
 * Show a toast notification
 */
function showToast(message) {
    // Check if a toast container exists, create one if not
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create the toast element
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">KPI Translator</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Initialize and show the toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove the toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initKPITranslator);