# Viking Negotiation Model

## Context

This project is part of preparation for a **Negotiation & Bargaining** class at [London Business School](https://london.edu) (LBS), led by [Professor David Loschelder](https://www.leuphana.de/en/institutes/imo/persons/david-loschelder.html), and prepared by [Dima Malyshenko](https://www.linkedin.com/in/dima-malyshenko/) (eMBA student, London stream EMBALS_2026).

**🌐 Hosted Simulation:** [https://debesha.github.io/viking-simulation/](https://debesha.github.io/viking-simulation/)

## Disclaimer

This tool was developed using [Cursor](https://cursor.sh) in vibe-coding mode.

## Case Study Overview

This financial simulation tool models a negotiation scenario between two parties: **Sandy** (a contractor/subcontractor) and **Viking** (a developer/project owner). The case involves financial arrangements including unit construction payments, rental agreements, loan obligations, and potential asset sales.

**Important Note:** This model represents **Sandy's perspective** and simulates the negotiation based on information available to Sandy. It does not factor in information that is unknown to Sandy but known to Pat (Viking's representative).

## Features

- **Interactive financial modeling** for both Sandy and Viking
- **Real-time calculation** of cash flows, balance sheets, and equity positions
- **Scenario comparison** to evaluate different negotiation outcomes
- **Solvency analysis** to identify scenarios that could lead to bankruptcy
- **12-month financial projections**

## How to Run Locally

### Prerequisites

- Python 3.x installed on your system

### Steps

1. **Navigate to the project directory:**
   ```bash
   cd viking-simulation
   ```

2. **Start a local HTTP server using Python:**
   
   ```bash
   python -m http.server 8000
   ```
   
3. **Open your web browser** and navigate to:
   ```
   http://localhost:8000
   ```

4. **Use the application:**
   - Adjust negotiation inputs (payment per unit, rent, loan terms, etc.)
   - Select predefined scenarios from the dropdown
   - View real-time results for both Sandy and Viking
   - Run equity tests to compare multiple scenarios
   - Copy scenario configurations as JSON

### Alternative: Using Python's built-in server on a different port

If port 8000 is already in use, you can specify a different port:
```bash
python3 -m http.server 8080
```

Then access the application at `http://localhost:8080`

## File Structure

- `index.html` - Main application interface
- `app.js` - Simulation logic and UI interactions
- `styles.css` - Styling
- `scenarios.json` - Predefined negotiation scenarios

