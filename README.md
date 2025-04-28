# KPI Translator & Alignment Tool

A browser-based solution for the "Metrics Lost in Translation" problem where different teams use different terminology for related KPIs.

## Problem Statement

In many organizations, teams develop their own metrics and terminology:
- Sales uses "qualified lead"
- Marketing uses "engaged contact"
- Product talks about "activation"

This leads to misalignment, blocked decisions, and inefficient cross-team collaboration.

## Solution

The KPI Translator tool provides a web interface to:
1. Create a business glossary that maps KPIs across departments
2. Translate metrics between team contexts
3. Automatically flag misalignment in reports
4. Establish unified definitions for cross-team concepts

## Features

- **Business Glossary**: Central repository of all metrics with team-specific definitions
- **Translation Engine**: Converts metrics between team contexts
- **Misalignment Detector**: Identifies conflicting KPI usage in reports
- **Unified Definition Generator**: Creates cross-team metric definitions

## Live Demo

You can view a live demo of this tool at [https://your-username.github.io/kpi-translator](https://your-username.github.io/kpi-translator)

## Installation

This is a client-side application that requires no server-side setup:

```bash
# Clone the repository
git clone https://github.com/your-username/kpi-translator.git
cd kpi-translator

# Open in browser
open index.html
```

## Usage

### 1. Translator

The translator tab allows you to:
- Select a source team and metric
- View the definition for the selected metric
- Select a target team to translate to
- See the translation, unified definition, and potential misalignment warnings

### 2. Business Glossary

The glossary tab provides:
- A searchable table of all metrics by team
- The ability to add new metrics
- Export functionality to save your glossary
- A view of all unified definitions

### 3. Report Validator

The validator tab lets you:
- Paste report text to check for KPI misalignment issues
- See specific misalignment warnings with recommendations
- Identify terminology conflicts that could cause confusion

### 4. Upload KPIs

The upload tab allows you to:
- Upload a CSV file with your organization's KPI definitions
- Load sample data to see how the tool works
- See the required CSV format

## CSV Format

Your KPI definitions should be in a CSV file with the following columns:
- `Team`: The department or team name
- `Metric_Name`: The name of the KPI
- `Definition`: The definition of the KPI

Example:
```
Team,Metric_Name,Definition
Marketing,Engagement Rate,Clicks + opens ÷ total emails sent over past 30 days.
Sales,Qualified Lead,Any lead with a score >80 OR passed SDR call.
Product,Activation,User finishes onboarding OR uses 2+ features in week 1.
```

## Technical Details

This application uses:
- Plain HTML, CSS, and JavaScript (no frameworks)
- Bootstrap 5 for styling
- PapaParse for CSV parsing
- LocalStorage to persist data between sessions

No backend is required as all processing happens in the browser.

## Customization

### Team Colors

You can customize the team colors by modifying the `teamColors` object in `js/kpi-translator.js`:

```javascript
const teamColors = {
    'Marketing': '#4285F4',  // Blue
    'Sales': '#34A853',      // Green
    'Product': '#FBBC05',    // Yellow
    'Customer Success': '#EA4335',  // Red
    // Add custom teams here
};
```

### Semantic Groups

You can extend the semantic groupings to better match your organization's terminology by modifying the `semanticKey