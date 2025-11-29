class DifferentialEquationsSolver {
    constructor() {
        this.isLoading = false;
        this.currentSolution = null;
        this.chart = null;
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.loadChartJS();
        setTimeout(() => {
            this.showNotification('Differential Equation Solver Ready', 'success', 5000);
        }, 1000);
    }

    showNotification(message, type = 'info', duration = 5000) {
        if (window.notificationManager) {
            window.notificationManager.show(message, type, duration);
        } else {
            console.log(`${type}: ${message}`);
        }
    }

    initializeEventListeners() {
        document.getElementById('solveOdeBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.solveODE();
        });

        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadExample(
                    btn.dataset.equation,
                    btn.dataset.conditions,
                    btn.dataset.type
                );
            });
        });

        document.getElementById('copyDeResultBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.copyResult();
        });

        document.getElementById('clearDeResultBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.clearResult();
        });

        document.getElementById('exportDataBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportData();
        });

        document.getElementById('toggleGrid')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleGrid();
        });

        document.getElementById('exportPlot')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportPlot();
        });
    }

    updateChartTheme(theme) {
        if (this.chart) {
            const isDark = theme === 'dark';

            this.chart.options.plugins.title.color = isDark ? '#f1f5f9' : '#0f172a';
            this.chart.options.scales.x.ticks.color = isDark ? '#94a3b8' : '#64748b';
            this.chart.options.scales.y.ticks.color = isDark ? '#94a3b8' : '#64748b';
            this.chart.options.scales.x.grid.color = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            this.chart.options.scales.y.grid.color = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

            this.chart.update('none');
        }
    }

    loadChartJS() {
        console.log('Chart.js loaded successfully');
    }

    loadExample(equation, conditions, type) {
        document.getElementById('odeEquation').value = equation;
        document.getElementById('initialConditions').value = conditions;
        document.getElementById('odeType').value = type;

        this.showNotification('Example loaded successfully', 'success', 3000);
    }

    async solveODE() {
        if (this.isLoading) return;

        const equation = document.getElementById('odeEquation').value.trim();
        const conditions = document.getElementById('initialConditions').value.trim();
        const type = document.getElementById('odeType').value;
        const rangeStart = parseFloat(document.getElementById('rangeStart').value);
        const rangeEnd = parseFloat(document.getElementById('rangeEnd').value);
        const stepSize = parseFloat(document.getElementById('stepSize').value);

        if (!equation || !conditions) {
            this.showNotification('Please enter both equation and initial conditions', 'warning', 5000);
            return;
        }

        if (isNaN(rangeStart) || isNaN(rangeEnd) || isNaN(stepSize)) {
            this.showNotification('Please enter valid range and step size values', 'warning', 5000);
            return;
        }

        if (rangeStart >= rangeEnd) {
            this.showNotification('End value must be greater than start value', 'error', 5000);
            return;
        }

        this.setLoadingState(true);
        this.showResult('Solving differential equation...\n\nPlease wait while we compute the numerical solution.');

        try {
            const response = await fetch('/api/solve_ode', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    equation: equation,
                    conditions: conditions,
                    type: type,
                    range_start: rangeStart,
                    range_end: rangeEnd,
                    step_size: stepSize
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentSolution = data.result;
                const solution = this.formatODESolution(data.result);
                this.showResult(solution);
                this.plotSolution(data.result);
                this.analyzeSolution(data.result);

                if (window.notificationManager && window.notificationManager.odeSolutionSuccess) {
                    window.notificationManager.odeSolutionSuccess(data.result.type);
                } else {
                    this.showNotification('Differential equation solved successfully', 'success', 5000);
                }
            } else {
                throw new Error(data.error);
            }

        } catch (error) {
            this.showResult(`Error: ${error.message}\n\nPlease check your equation and initial conditions.`);

            if (window.notificationManager && window.notificationManager.odeSolutionError) {
                window.notificationManager.odeSolutionError(error.message);
            } else {
                this.showNotification('Failed to solve differential equation', 'error', 5000);
            }

            this.clearVisualization();
        } finally {
            this.setLoadingState(false);
        }
    }

    formatODESolution(result) {
        let output = `ORDINARY DIFFERENTIAL EQUATION SOLUTION\n`;
        output += `${'='.repeat(60)}\n\n`;
        output += `Equation: ${result.equation}\n`;
        output += `Type: ${result.type.replace('_', ' ').toUpperCase()}\n`;

        if (result.initial_condition) {
            output += `Initial Condition: ${result.initial_condition}\n`;
        }
        if (result.initial_conditions) {
            output += `Initial Conditions: ${result.initial_conditions}\n`;
        }

        output += `Range: [${result.range_start}, ${result.range_end}]\n`;
        output += `Step Size: ${result.step_size}\n`;

        output += `\n${'='.repeat(60)}\n\n`;
        output += `NUMERICAL SOLUTION\n\n`;

        const solution = result.solution;

        if (result.type === 'first_order') {
            output += "x\t\ty(x)\n";
            output += "―".repeat(8) + "\t\t" + "―".repeat(12) + "\n";

            const n = Math.min(solution.x.length, 15);
            for (let i = 0; i < n; i++) {
                output += `${solution.x[i].toFixed(3)}\t\t${solution.y[i].toFixed(6)}\n`;
            }

            if (solution.x.length > 15) {
                output += `...\t\t...\n`;
                const last = solution.x.length - 1;
                output += `${solution.x[last].toFixed(3)}\t\t${solution.y[last].toFixed(6)}\n`;
            }

            output += `\nFinal Value: y(${solution.x[solution.x.length - 1].toFixed(3)}) ≈ ${solution.y[solution.y.length - 1].toFixed(6)}`;

        } else if (result.type === 'second_order') {
            output += "x\t\ty(x)\t\ty'(x)\n";
            output += "―".repeat(8) + "\t\t" + "―".repeat(12) + "\t\t" + "―".repeat(12) + "\n";

            const n = Math.min(solution.x.length, 12);
            for (let i = 0; i < n; i++) {
                output += `${solution.x[i].toFixed(3)}\t\t${solution.y[i].toFixed(6)}\t\t${solution.dy[i].toFixed(6)}\n`;
            }

            if (solution.x.length > 12) {
                output += `...\t\t...\t\t...\n`;
                const last = solution.x.length - 1;
                output += `${solution.x[last].toFixed(3)}\t\t${solution.y[last].toFixed(6)}\t\t${solution.dy[last].toFixed(6)}\n`;
            }

            output += `\nFinal Values:\n`;
            output += `y(${solution.x[solution.x.length - 1].toFixed(3)}) ≈ ${solution.y[solution.y.length - 1].toFixed(6)}\n`;
            output += `y'(${solution.x[solution.x.length - 1].toFixed(3)}) ≈ ${solution.dy[solution.dy.length - 1].toFixed(6)}`;

        } else if (result.type === 'system') {
            output += "t\t\tx(t)\t\ty(t)\n";
            output += "―".repeat(8) + "\t\t" + "―".repeat(12) + "\t\t" + "―".repeat(12) + "\n";

            const n = Math.min(solution.t.length, 12);
            for (let i = 0; i < n; i++) {
                output += `${solution.t[i].toFixed(3)}\t\t${solution.x[i].toFixed(6)}\t\t${solution.y[i].toFixed(6)}\n`;
            }

            if (solution.t.length > 12) {
                output += `...\t\t...\t\t...\n`;
                const last = solution.t.length - 1;
                output += `${solution.t[last].toFixed(3)}\t\t${solution.x[last].toFixed(6)}\t\t${solution.y[last].toFixed(6)}\n`;
            }

            output += `\nFinal Values:\n`;
            output += `x(${solution.t[solution.t.length - 1].toFixed(3)}) ≈ ${solution.x[solution.x.length - 1].toFixed(6)}\n`;
            output += `y(${solution.t[solution.t.length - 1].toFixed(3)}) ≈ ${solution.y[solution.y.length - 1].toFixed(6)}`;
        }

        output += `\n\n${'='.repeat(60)}`;
        output += `\nComputation Details:\n`;
        output += `• Method: Numerical Integration (Runge-Kutta 4th/5th Order)\n`;
        output += `• Points Computed: ${solution.x ? solution.x.length : solution.t ? solution.t.length : 0}\n`;
        output += `• Computation Time: ${new Date().toLocaleString()}`;

        return output;
    }

    plotSolution(result) {
        const placeholder = document.getElementById('plotPlaceholder');
        const canvas = document.getElementById('solutionChart');
        const plotControls = document.getElementById('plotControls');

        if (placeholder) placeholder.style.display = 'none';
        if (canvas) canvas.style.display = 'block';
        if (plotControls) plotControls.style.display = 'flex';

        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = canvas.getContext('2d');

        let labels, datasets;
        const isDark = document.body.getAttribute('data-theme') === 'dark';

        if (result.type === 'first_order') {
            labels = result.solution.x;
            datasets = [{
                label: 'y(x)',
                data: result.solution.y,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }];
        } else if (result.type === 'second_order') {
            labels = result.solution.x;
            datasets = [
                {
                    label: 'y(x)',
                    data: result.solution.y,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: "y'(x)",
                    data: result.solution.dy,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }
            ];
        } else if (result.type === 'system') {
            labels = result.solution.t;
            datasets = [
                {
                    label: 'x(t)',
                    data: result.solution.x,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'y(t)',
                    data: result.solution.y,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ];
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Solution: ${result.equation}`,
                        color: isDark ? '#f1f5f9' : '#0f172a',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        labels: {
                            color: isDark ? '#cbd5e0' : '#475569'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: result.type === 'system' ? 't' : 'x',
                            color: isDark ? '#94a3b8' : '#64748b'
                        },
                        grid: {
                            color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            color: isDark ? '#94a3b8' : '#64748b'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Value',
                            color: isDark ? '#94a3b8' : '#64748b'
                        },
                        grid: {
                            color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            color: isDark ? '#94a3b8' : '#64748b'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    analyzeSolution(result) {
        const container = document.getElementById('analysisContainer');
        if (!container) return;

        let analysis = '<div class="solution-analysis">';
        analysis += '<h4>📊 Solution Analysis</h4>';

        const solution = result.solution;

        if (result.type === 'first_order') {
            const yValues = solution.y;
            analysis += this.analyzeFirstOrder(yValues, solution.x);
        } else if (result.type === 'second_order') {
            const yValues = solution.y;
            const dyValues = solution.dy;
            analysis += this.analyzeSecondOrder(yValues, dyValues, solution.x);
        } else if (result.type === 'system') {
            const xValues = solution.x;
            const yValues = solution.y;
            analysis += this.analyzeSystem(xValues, yValues, solution.t);
        }

        analysis += '</div>';
        container.innerHTML = analysis;
    }

    analyzeFirstOrder(yValues, xValues) {
        const first = yValues[0];
        const last = yValues[yValues.length - 1];
        const min = Math.min(...yValues);
        const max = Math.max(...yValues);
        const avg = yValues.reduce((a, b) => a + b, 0) / yValues.length;

        let analysis = `<div class="analysis-grid">`;
        analysis += `<div class="analysis-item"><strong>Initial Value:</strong> ${first.toFixed(4)}</div>`;
        analysis += `<div class="analysis-item"><strong>Final Value:</strong> ${last.toFixed(4)}</div>`;
        analysis += `<div class="analysis-item"><strong>Range:</strong> [${min.toFixed(4)}, ${max.toFixed(4)}]</div>`;
        analysis += `<div class="analysis-item"><strong>Average:</strong> ${avg.toFixed(4)}</div>`;

        const behavior = this.determineBehavior(yValues);
        analysis += `<div class="analysis-item"><strong>Behavior:</strong> ${behavior}</div>`;

        analysis += `</div>`;
        return analysis;
    }

    analyzeSecondOrder(yValues, dyValues, xValues) {
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        const amplitude = (yMax - yMin) / 2;
        const oscillations = this.countOscillations(yValues);

        let analysis = `<div class="analysis-grid">`;
        analysis += `<div class="analysis-item"><strong>Amplitude:</strong> ${amplitude.toFixed(4)}</div>`;
        analysis += `<div class="analysis-item"><strong>Oscillations:</strong> ${oscillations}</div>`;
        analysis += `<div class="analysis-item"><strong>Y Range:</strong> [${yMin.toFixed(4)}, ${yMax.toFixed(4)}]</div>`;

        const stability = this.analyzeStability(yValues);
        analysis += `<div class="analysis-item"><strong>Stability:</strong> ${stability}</div>`;

        analysis += `</div>`;
        return analysis;
    }

    analyzeSystem(xValues, yValues, tValues) {
        const xAvg = xValues.reduce((a, b) => a + b, 0) / xValues.length;
        const yAvg = yValues.reduce((a, b) => a + b, 0) / yValues.length;
        const correlation = this.calculateCorrelation(xValues, yValues);

        let analysis = `<div class="analysis-grid">`;
        analysis += `<div class="analysis-item"><strong>X Average:</strong> ${xAvg.toFixed(4)}</div>`;
        analysis += `<div class="analysis-item"><strong>Y Average:</strong> ${yAvg.toFixed(4)}</div>`;
        analysis += `<div class="analysis-item"><strong>Correlation:</strong> ${correlation.toFixed(4)}</div>`;

        const phase = this.analyzePhaseRelationship(xValues, yValues);
        analysis += `<div class="analysis-item"><strong>Phase:</strong> ${phase}</div>`;

        analysis += `</div>`;
        return analysis;
    }

    determineBehavior(values) {
        const first = values[0];
        const last = values[values.length - 1];
        const diff = last - first;

        if (Math.abs(diff) < 0.001) return "Stable equilibrium";
        if (diff > 0.01) return "Increasing";
        if (diff < -0.01) return "Decreasing";

        let signChanges = 0;
        for (let i = 1; i < values.length - 1; i++) {
            if ((values[i] > 0 && values[i + 1] < 0) || (values[i] < 0 && values[i + 1] > 0)) {
                signChanges++;
            }
        }

        if (signChanges > 2) return "Oscillatory";
        return "Variable";
    }

    countOscillations(values) {
        let count = 0;
        for (let i = 2; i < values.length; i++) {
            if ((values[i-1] > values[i-2] && values[i-1] > values[i]) ||
                (values[i-1] < values[i-2] && values[i-1] < values[i])) {
                count++;
            }
        }
        return Math.floor(count / 2);
    }

    analyzeStability(values) {
        const variance = this.calculateVariance(values);
        if (variance < 0.1) return "Highly Stable";
        if (variance < 1) return "Stable";
        if (variance < 5) return "Moderately Stable";
        return "Variable";
    }

    calculateCorrelation(x, y) {
        const n = x.length;
        const meanX = x.reduce((a, b) => a + b, 0) / n;
        const meanY = y.reduce((a, b) => a + b, 0) / n;

        let num = 0, denX = 0, denY = 0;
        for (let i = 0; i < n; i++) {
            num += (x[i] - meanX) * (y[i] - meanY);
            denX += Math.pow(x[i] - meanX, 2);
            denY += Math.pow(y[i] - meanY, 2);
        }

        return num / Math.sqrt(denX * denY);
    }

    analyzePhaseRelationship(x, y) {
        const correlation = this.calculateCorrelation(x, y);
        if (Math.abs(correlation) > 0.8) return "Strong";
        if (Math.abs(correlation) > 0.5) return "Moderate";
        if (Math.abs(correlation) > 0.2) return "Weak";
        return "Independent";
    }

    calculateVariance(arr) {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    }

    toggleGrid() {
        if (this.chart) {
            const xGrid = this.chart.options.scales.x.grid;
            const yGrid = this.chart.options.scales.y.grid;

            xGrid.display = !xGrid.display;
            yGrid.display = !yGrid.display;

            this.chart.update();
            this.showNotification('Grid toggled', 'info', 1000);
        }
    }

    exportPlot() {
        if (this.chart) {
            const link = document.createElement('a');
            link.download = 'ode-solution.png';
            link.href = this.chart.toBase64Image();
            link.click();
            this.showNotification('Plot exported successfully', 'success', 3000);
        }
    }

    exportData() {
        if (!this.currentSolution) {
            this.showNotification('No solution data to export', 'warning', 5000);
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        const solution = this.currentSolution.solution;

        if (this.currentSolution.type === 'first_order') {
            csvContent += "x,y(x)\n";
            solution.x.forEach((x, i) => {
                csvContent += `${x},${solution.y[i]}\n`;
            });
        } else if (this.currentSolution.type === 'second_order') {
            csvContent += "x,y(x),y'(x)\n";
            solution.x.forEach((x, i) => {
                csvContent += `${x},${solution.y[i]},${solution.dy[i]}\n`;
            });
        } else if (this.currentSolution.type === 'system') {
            csvContent += "t,x(t),y(t)\n";
            solution.t.forEach((t, i) => {
                csvContent += `${t},${solution.x[i]},${solution.y[i]}\n`;
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'ode_solution_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Data exported successfully', 'success', 3000);
    }

    clearVisualization() {
        const placeholder = document.getElementById('plotPlaceholder');
        const canvas = document.getElementById('solutionChart');
        const plotControls = document.getElementById('plotControls');
        const analysisContainer = document.getElementById('analysisContainer');

        if (placeholder) placeholder.style.display = 'flex';
        if (canvas) canvas.style.display = 'none';
        if (plotControls) plotControls.style.display = 'none';
        if (analysisContainer) {
            analysisContainer.innerHTML = `
                <div class="analysis-placeholder">
                    <div class="analysis-icon">🔍</div>
                    <div class="analysis-message">Solution analysis will appear here</div>
                </div>
            `;
        }

        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    showResult(message) {
        const resultElement = document.getElementById('deResult');
        resultElement.textContent = message;
        resultElement.scrollTop = 0;
        resultElement.classList.add('solution-result');

        setTimeout(() => {
            resultElement.classList.remove('solution-result');
        }, 300);
    }

    async copyResult() {
        const resultText = document.getElementById('deResult').textContent;
        if (!resultText.trim() || resultText.includes('Solution will appear here')) {
            this.showNotification('No results to copy', 'warning', 5000);
            return;
        }

        try {
            await navigator.clipboard.writeText(resultText);
            this.showNotification('Results copied to clipboard', 'success', 3000);
        } catch (err) {
            this.showNotification('Failed to copy results', 'error', 5000);
        }
    }

    clearResult() {
        document.getElementById('deResult').textContent = '// Solution will appear here\n\nEnter your differential equation and click "Solve" to see the numerical solution.';
        this.clearVisualization();
        this.currentSolution = null;
        this.showNotification('Results cleared', 'info', 3000);
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        const button = document.getElementById('solveOdeBtn');

        if (loading) {
            button.disabled = true;
            button.classList.add('loading', 'ode-solving');
            button.innerHTML = '<span class="btn-icon">⏳</span>Solving...';
        } else {
            button.disabled = false;
            button.classList.remove('loading', 'ode-solving');
            button.innerHTML = '<span class="btn-icon">⚡</span>Solve Differential Equation';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.deSolver = new DifferentialEquationsSolver();

});
