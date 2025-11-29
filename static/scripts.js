class MatrixLabPro {
    constructor() {
        this.currentEditingMatrix = null;
        this.isLoading = false;
        this.operationsCount = 0;
        this.init();
    }

    init() {
        this.initializeThemeManager();
        this.initializeEventListeners();
        this.generateMatrixInput();
        this.loadMatrices();
        this.loadHistory();
        this.updateStats();
        this.showNotification('MatrixLab Pro initialized successfully', 'success', 2000);
    }

    initializeThemeManager() {
        // Initialize theme manager if it doesn't exist
        if (!window.themeManager) {
            window.themeManager = {
                currentTheme: localStorage.getItem('matrixLab-theme') || 'dark',
                showNotification: (message, type = 'info') => {
                    this.showNotification(message, type, 2000);
                },
                getCurrentTheme: () => {
                    return localStorage.getItem('matrixLab-theme') || 'dark';
                }
            };

            // Apply initial theme
            document.body.setAttribute('data-theme', window.themeManager.currentTheme);
        }

        // Initialize theme toggle for matrix calculator page
        this.initializeThemeToggle();
    }

    initializeThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // Remove existing event listeners
            const newToggle = themeToggle.cloneNode(true);
            themeToggle.parentNode.replaceChild(newToggle, themeToggle);

            // Add new event listener
            document.getElementById('themeToggle').addEventListener('click', () => {
                this.toggleTheme();
            });

            // Update initial icon state
            this.updateThemeToggleIcon();
        }
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        // Apply theme
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('matrixLab-theme', newTheme);

        // Update theme manager
        if (window.themeManager) {
            window.themeManager.currentTheme = newTheme;
        }

        // Update UI
        this.updateThemeToggleIcon();
        this.updateParticles();

        const themeName = newTheme === 'light' ? 'Light' : 'Dark';
        this.showNotification(`${themeName} mode activated`, 'success', 2000);
    }

    updateThemeToggleIcon() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const icon = themeToggle.querySelector('svg');
        const currentTheme = document.body.getAttribute('data-theme');

        if (icon) {
            icon.style.transition = 'transform 0.3s ease, fill 0.3s ease';
            icon.style.transform = currentTheme === 'light' ? 'rotate(180deg)' : 'rotate(0deg)';

            const iconColor = currentTheme === 'light' ?
                'var(--neutral-600)' : 'var(--neutral-300)';
            icon.style.fill = iconColor;
        }
    }

    updateParticles() {
        const container = document.getElementById('particlesContainer');
        if (!container) return;

        const particles = container.querySelectorAll('.particle');
        const currentTheme = document.body.getAttribute('data-theme');

        particles.forEach(particle => {
            particle.style.background = currentTheme === 'light' ?
                'var(--primary-400)' : 'var(--primary-500)';
            particle.style.opacity = currentTheme === 'light' ? '0.08' : '0.1';
        });
    }

    showNotification(message, type = 'info', duration = 3000) {
        if (window.notificationManager) {
            window.notificationManager.show(message, type, duration);
        } else {
            // Fallback basic notification
            console.log(`${type}: ${message}`);
        }
    }

    initializeEventListeners() {
        // Theme toggle listener is now handled separately

        document.getElementById('generateGridBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.generateMatrixInput();
        });

        document.getElementById('saveMatrixBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.saveMatrix();
        });

        document.getElementById('clearMatrixBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.clearMatrix();
        });

        document.getElementById('runSingleOpBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.runSingleMatrixOperation();
        });

        document.getElementById('runAlgebraOpBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.runAlgebraOperation();
        });

        document.getElementById('runScalarOpBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.runScalarOperation();
        });

        document.getElementById('runCramerBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.runCramerOperation();
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.clearHistory();
        });

        document.getElementById('copyResultBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.copyResult();
        });

        document.getElementById('clearResultBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.clearResult();
        });

        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('updateMatrixBtn').addEventListener('click', () => this.updateMatrix());
        document.getElementById('deleteMatrixBtn').addEventListener('click', () => this.deleteMatrix());

        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleQuickAction(e.target.closest('.quick-btn').dataset.action);
            });
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('matrixModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveMatrix();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.generateMatrixInput();
                        break;
                    case 'l':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.toggleTheme();
                        }
                        break;
                }
            }
        });

        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        setInterval(() => this.updateStats(), 30000);
    }

    updateStats() {
        const matrices = JSON.parse(localStorage.getItem('matrixLab-matrices') || '[]');
        document.getElementById('totalMatrices').textContent = matrices.length;
        document.getElementById('totalOperations').textContent = this.operationsCount;
        document.getElementById('systemStatus').textContent = 'Online';
    }

    clearMatrix() {
        const inputs = document.querySelectorAll('.matrix-input');
        inputs.forEach(input => input.value = '');
        this.showNotification('Matrix cleared', 'info', 2000);
    }

    clearResult() {
        document.getElementById('result').textContent = '';
        this.showNotification('Results cleared', 'info', 2000);
    }

    async copyResult() {
        const resultText = document.getElementById('result').textContent;
        if (!resultText.trim()) {
            this.showNotification('No results to copy', 'warning', 2000);
            return;
        }

        try {
            await navigator.clipboard.writeText(resultText);
            this.showNotification('Results copied to clipboard', 'success', 2000);
        } catch (err) {
            this.showNotification('Failed to copy results', 'error', 2000);
        }
    }

    generateMatrixInput() {
        const rows = this.getValidatedDimension('mRows');
        const cols = this.getValidatedDimension('mCols');
        const container = document.getElementById('matrixInputGrid');

        container.innerHTML = '';

        for (let i = 0; i < rows; i++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'matrix-row';

            for (let j = 0; j < cols; j++) {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'matrix-input-group';

                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.placeholder = '0';
                input.name = `cell_${i}_${j}`;
                input.className = 'matrix-input';
                input.dataset.row = i;
                input.dataset.col = j;
                input.addEventListener('keydown', (e) => this.handleMatrixInputNavigation(e, rows, cols));

                inputGroup.appendChild(input);
                rowDiv.appendChild(inputGroup);
            }
            container.appendChild(rowDiv);
        }

        const firstInput = container.querySelector('.matrix-input');
        if (firstInput) firstInput.focus();
    }

    getValidatedDimension(elementId) {
        const input = document.getElementById(elementId);
        let value = parseInt(input.value) || 3;
        value = Math.max(1, Math.min(10, value));
        input.value = value;
        return value;
    }

    handleMatrixInputNavigation(event, totalRows, totalCols) {
        if (event.key !== 'Tab') return;

        event.preventDefault();

        const currentInput = event.target;
        const currentRow = parseInt(currentInput.dataset.row);
        const currentCol = parseInt(currentInput.dataset.col);

        let nextRow = currentRow;
        let nextCol = currentCol + (event.shiftKey ? -1 : 1);

        if (nextCol >= totalCols) {
            nextRow++;
            nextCol = 0;
        } else if (nextCol < 0) {
            nextRow--;
            nextCol = totalCols - 1;
        }

        if (nextRow >= totalRows) nextRow = 0;
        else if (nextRow < 0) nextRow = totalRows - 1;

        const nextInput = document.querySelector(`.matrix-input[data-row="${nextRow}"][data-col="${nextCol}"]`);
        if (nextInput) {
            nextInput.focus();
            nextInput.select();
        }
    }

    async handleQuickAction(action) {
        const rows = this.getValidatedDimension('mRows');
        const cols = this.getValidatedDimension('mCols');

        try {
            const response = await fetch('/api/quick_actions', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: action,
                    rows: rows,
                    cols: cols,
                    size: Math.max(rows, cols)
                })
            });

            const data = await response.json();
            if (data.success) {
                this.fillMatrixWithData(data.matrix);
                this.showNotification(`${action.charAt(0).toUpperCase() + action.slice(1)} matrix generated`, 'success', 2000);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showNotification(`Quick action failed: ${error.message}`, 'error', 2000);
        }
    }

    fillMatrixWithData(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;

        document.getElementById('mRows').value = rows;
        document.getElementById('mCols').value = cols;
        this.generateMatrixInput();

        setTimeout(() => {
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const input = document.querySelector(`.matrix-input[data-row="${i}"][data-col="${j}"]`);
                    if (input) input.value = matrix[i][j];
                }
            }
        }, 100);
    }

    getCurrentMatrix() {
        const rows = this.getValidatedDimension('mRows');
        const cols = this.getValidatedDimension('mCols');
        const matrix = [];

        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                const input = document.querySelector(`.matrix-input[data-row="${i}"][data-col="${j}"]`);
                const value = input ? parseFloat(input.value) || 0 : 0;
                row.push(value);
            }
            matrix.push(row);
        }
        return matrix;
    }

    async saveMatrix() {
        if (this.isLoading) return;

        const name = document.getElementById('mName').value.trim() || `M${new Date().getTime()}`;
        const matrix = this.getCurrentMatrix();

        if (!this.isValidMatrix(matrix)) {
            this.showNotification('Please enter valid matrix values', 'warning', 2000);
            return;
        }

        this.setLoadingState(true);

        try {
            const response = await fetch('/api/save_matrix', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: name, matrix: matrix})
            });

            const data = await response.json();
            if (data.success) {
                this.updateMatrixList(data.matrices);
                this.updateMatrixSelectors();
                document.getElementById('mName').value = '';
                this.showNotification(`Matrix "${name}" saved successfully`, 'success', 2000);
                this.updateStats();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showNotification(`Save failed: ${error.message}`, 'error', 2000);
        } finally {
            this.setLoadingState(false);
        }
    }

    isValidMatrix(matrix) {
        return Array.isArray(matrix) && matrix.length > 0 && Array.isArray(matrix[0]) && matrix[0].length > 0;
    }

    async loadMatrices() {
        try {
            const response = await fetch('/api/get_matrices');
            const matrices = await response.json();
            this.updateMatrixList(matrices);
            this.updateMatrixSelectors();
        } catch (error) {
            this.showNotification('Failed to load matrices', 'error', 2000);
        }
    }

    async loadHistory() {
        try {
            const response = await fetch('/api/get_history');
            const history = await response.json();
            this.updateHistoryList(history);
        } catch (error) {
            console.error('History loading error:', error);
        }
    }

    updateMatrixList(matrices) {
        const matrixList = document.getElementById('matrixList');
        const matrixCount = document.getElementById('matrixCount');
        matrixList.innerHTML = '';

        matrixCount.textContent = `${matrices.length} ${matrices.length === 1 ? 'matrix' : 'matrices'}`;

        if (matrices.length === 0) {
            const emptyState = document.createElement('li');
            emptyState.className = 'matrix-list-item';
            emptyState.innerHTML = `
                <div style="color: var(--text-tertiary); font-style: italic; text-align: center; width: 100%;">
                    No matrices stored
                </div>
            `;
            matrixList.appendChild(emptyState);
            return;
        }

        matrices.forEach(matrix => {
            const li = document.createElement('li');
            li.className = 'matrix-list-item';
            li.innerHTML = `
                <div>
                    <div class="matrix-name">${this.escapeHtml(matrix.name)}</div>
                    <div class="matrix-dimensions">${matrix.matrix.length}×${matrix.matrix[0].length}</div>
                </div>
            `;

            li.addEventListener('click', () => {
                this.showMatrixDetails(matrix);
            });

            matrixList.appendChild(li);
        });
    }

    updateHistoryList(history) {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); font-style: italic;">No recent activity</div>';
            return;
        }

        history.reverse().forEach(entry => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-operation">${this.formatOperationName(entry.operation)}</div>
                <div class="history-matrix">Matrix: ${entry.matrix}</div>
                <div class="history-preview">${this.escapeHtml(entry.result_preview)}</div>
            `;
            historyList.appendChild(item);
        });
    }

    formatOperationName(operation) {
        const names = {
            'rref': 'RREF',
            'ref': 'REF',
            'det': 'Determinant',
            'linear_independent': 'Linear Independence',
            'basis_dimension': 'Basis & Dimension',
            'row_space': 'Row Space',
            'col_space': 'Column Space',
            'eig': 'Eigen Analysis',
            'diagonalize': 'Diagonalization',
            'inverse': 'Inverse',
            'transpose': 'Transpose',
            'trace': 'Trace',
            'rank': 'Matrix Rank',
            'nullity': 'Nullity'
        };
        return names[operation] || operation;
    }

    async updateMatrixSelectors() {
        const selectors = [
            'singleMatrixSelect',
            'matrix1Select',
            'matrix2Select',
            'scalarMatrixSelect',
            'cramerMatrixSelect',
            'cramerResultSelect'
        ];

        try {
            const response = await fetch('/api/get_matrices');
            const matrices = await response.json();

            selectors.forEach(selectorId => {
                const selector = document.getElementById(selectorId);
                if (selector) {
                    while (selector.children.length > 1) selector.removeChild(selector.lastChild);
                    matrices.forEach(matrix => {
                        const option = document.createElement('option');
                        option.value = JSON.stringify(matrix.matrix);
                        option.textContent = matrix.name;
                        selector.appendChild(option);
                    });
                }
            });
        } catch (error) {
            console.error('Selector update error:', error);
        }
    }

    showMatrixDetails(matrix) {
        this.currentEditingMatrix = matrix;
        document.getElementById('editMatrixName').value = matrix.name;

        const container = document.getElementById('editMatrixGrid');
        container.innerHTML = '';

        matrix.matrix.forEach((row, i) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'matrix-row';
            row.forEach((cell, j) => {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'matrix-input-group';

                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.value = cell;
                input.name = `edit_cell_${i}_${j}`;
                input.className = 'matrix-input';
                input.dataset.row = i;
                input.dataset.col = j;
                input.addEventListener('keydown', (e) => this.handleMatrixInputNavigation(e, matrix.matrix.length, matrix.matrix[0].length));

                inputGroup.appendChild(input);
                rowDiv.appendChild(inputGroup);
            });
            container.appendChild(rowDiv);
        });

        document.getElementById('matrixModal').style.display = 'block';

        const firstInput = container.querySelector('.matrix-input');
        if (firstInput) {
            firstInput.focus();
            firstInput.select();
        }
    }

    closeModal() {
        document.getElementById('matrixModal').style.display = 'none';
        this.currentEditingMatrix = null;
    }

    async updateMatrix() {
        if (!this.currentEditingMatrix || this.isLoading) return;

        const newName = document.getElementById('editMatrixName').value.trim();
        if (!newName) {
            this.showNotification('Matrix name is required', 'warning', 2000);
            return;
        }

        const container = document.getElementById('editMatrixGrid');
        const rows = this.currentEditingMatrix.matrix.length;
        const cols = this.currentEditingMatrix.matrix[0].length;
        const newMatrix = [];

        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                const input = container.querySelector(`.matrix-input[data-row="${i}"][data-col="${j}"]`);
                row.push(parseFloat(input.value) || 0);
            }
            newMatrix.push(row);
        }

        this.setLoadingState(true);

        try {
            const response = await fetch('/api/update_matrix', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    old_name: this.currentEditingMatrix.name,
                    new_name: newName,
                    matrix: newMatrix
                })
            });

            const data = await response.json();
            if (data.success) {
                this.updateMatrixList(data.matrices);
                this.updateMatrixSelectors();
                this.closeModal();
                this.showNotification('Matrix updated successfully', 'success', 2000);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showNotification(`Update failed: ${error.message}`, 'error', 2000);
        } finally {
            this.setLoadingState(false);
        }
    }

    async deleteMatrix() {
        if (!this.currentEditingMatrix) return;

        if (confirm(`Delete matrix "${this.currentEditingMatrix.name}"?`)) {
            this.setLoadingState(true);

            try {
                const response = await fetch('/api/delete_matrix', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name: this.currentEditingMatrix.name})
                });

                const data = await response.json();
                if (data.success) {
                    this.updateMatrixList(data.matrices);
                    this.updateMatrixSelectors();
                    this.closeModal();
                    this.showNotification('Matrix deleted', 'success', 2000);
                    this.updateStats();
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                this.showNotification(`Deletion failed: ${error.message}`, 'error', 2000);
            } finally {
                this.setLoadingState(false);
            }
        }
    }

    async clearHistory() {
        try {
            const response = await fetch('/api/clear_history', {method: 'POST'});
            const data = await response.json();
            if (data.success) {
                this.updateHistoryList([]);
                this.showNotification('History cleared', 'success', 2000);
            }
        } catch (error) {
            this.showNotification('Failed to clear history', 'error', 2000);
        }
    }

    async runSingleMatrixOperation() {
        if (this.isLoading) return;

        const matrixSelect = document.getElementById('singleMatrixSelect');
        const operation = document.getElementById('singleMatrixOp').value;

        if (!matrixSelect.value) {
            this.showNotification('Please select a matrix', 'warning', 2000);
            return;
        }

        const matrix = JSON.parse(matrixSelect.value);
        const matrixName = matrixSelect.options[matrixSelect.selectedIndex].text;

        this.showResult('Computing...');
        this.setLoadingState(true);

        try {
            const response = await fetch('/api/single_matrix_operation', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    matrix: matrix,
                    operation: operation,
                    matrix_name: matrixName
                })
            });

            const data = await response.json();
            if (data.success) {
                const result = this.formatOperationResult(data.result, operation, matrixName);
                this.showResult(result);

                // Use context-aware notification
                if (window.notificationManager && window.notificationManager.matrixOperationSuccess) {
                    window.notificationManager.matrixOperationSuccess(operation, matrixName);
                } else {
                    this.showNotification('Analysis completed successfully', 'success', 2000);
                }

                this.loadHistory();
                this.operationsCount++;
                this.updateStats();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showResult(`Error: ${error.message}`);

            // Use context-aware error notification
            if (window.notificationManager && window.notificationManager.matrixOperationError) {
                window.notificationManager.matrixOperationError(operation, error.message);
            } else {
                this.showNotification('Operation failed', 'error', 2000);
            }
        } finally {
            this.setLoadingState(false);
        }
    }

    async runAlgebraOperation() {
        if (this.isLoading) return;

        const matrix1Select = document.getElementById('matrix1Select');
        const matrix2Select = document.getElementById('matrix2Select');
        const operator = document.getElementById('matrixOperator').value;

        if (!matrix1Select.value || !matrix2Select.value) {
            this.showNotification('Please select both matrices', 'warning', 2000);
            return;
        }

        const matrix1 = JSON.parse(matrix1Select.value);
        const matrix2 = JSON.parse(matrix2Select.value);
        const matrix1Name = matrix1Select.options[matrix1Select.selectedIndex].text;
        const matrix2Name = matrix2Select.options[matrix2Select.selectedIndex].text;

        this.showResult('Computing...');
        this.setLoadingState(true);

        try {
            const response = await fetch('/api/matrix_operation', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    operation: 'algebra',
                    matrix1: matrix1,
                    matrix2: matrix2,
                    operator: operator
                })
            });

            const data = await response.json();
            if (data.success) {
                const result = this.formatAlgebraResult(data.result, operator, matrix1Name, matrix2Name, matrix1, matrix2);
                this.showResult(result);
                this.showNotification('Algebra operation completed', 'success', 2000);
                this.loadHistory();
                this.operationsCount++;
                this.updateStats();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showResult(`Error: ${error.message}`);
            this.showNotification('Algebra operation failed', 'error', 2000);
        } finally {
            this.setLoadingState(false);
        }
    }

    async runScalarOperation() {
        if (this.isLoading) return;

        const matrixSelect = document.getElementById('scalarMatrixSelect');
        const scalarValue = document.getElementById('scalarValue').value;
        const scalar = parseFloat(scalarValue);

        if (!matrixSelect.value || isNaN(scalar)) {
            this.showNotification('Please select a matrix and enter a valid scalar', 'warning', 2000);
            return;
        }

        const matrix = JSON.parse(matrixSelect.value);
        const matrixName = matrixSelect.options[matrixSelect.selectedIndex].text;

        this.showResult('Computing...');
        this.setLoadingState(true);

        try {
            const response = await fetch('/api/matrix_operation', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    operation: 'scalar',
                    matrix1: matrix,
                    scalar: scalar
                })
            });

            const data = await response.json();
            if (data.success) {
                const result = this.formatScalarResult(data.result, scalar, matrixName, matrix);
                this.showResult(result);
                this.showNotification('Scalar multiplication completed', 'success', 2000);
                this.loadHistory();
                this.operationsCount++;
                this.updateStats();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showResult(`Error: ${error.message}`);
            this.showNotification('Scalar operation failed', 'error', 2000);
        } finally {
            this.setLoadingState(false);
        }
    }

    async runCramerOperation() {
        if (this.isLoading) return;

        const matrixSelect = document.getElementById('cramerMatrixSelect');
        const resultSelect = document.getElementById('cramerResultSelect');

        if (!matrixSelect.value || !resultSelect.value) {
            this.showNotification('Please select both coefficient matrix and constant vector', 'warning', 2000);
            return;
        }

        const matrix = JSON.parse(matrixSelect.value);
        const result = JSON.parse(resultSelect.value);
        const matrixName = matrixSelect.options[matrixSelect.selectedIndex].text;
        const resultName = resultSelect.options[resultSelect.selectedIndex].text;

        this.showResult('Solving linear system...');
        this.setLoadingState(true);

        try {
            const response = await fetch('/api/matrix_operation', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    operation: 'cramer',
                    matrix1: matrix,
                    matrix2: result
                })
            });

            const data = await response.json();
            if (data.success) {
                const result = this.formatCramerResult(data.result, matrixName, resultName, matrix, data.result);
                this.showResult(result);
                this.showNotification('System solved successfully', 'success', 2000);
                this.loadHistory();
                this.operationsCount++;
                this.updateStats();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showResult(`Error: ${error.message}`);
            this.showNotification('Cramer operation failed', 'error', 2000);
        } finally {
            this.setLoadingState(false);
        }
    }

    formatOperationResult(result, operation, matrixName) {
        const operationNames = {
            'rref': 'Reduced Row Echelon Form',
            'ref': 'Row Echelon Form',
            'det': 'Determinant',
            'linear_independent': 'Linear Independence Check',
            'basis_dimension': 'Basis and Dimension Analysis',
            'row_space': 'Row Space',
            'col_space': 'Column Space',
            'eig': 'Eigen Analysis',
            'diagonalize': 'Diagonalization',
            'inverse': 'Matrix Inverse',
            'transpose': 'Matrix Transpose',
            'trace': 'Matrix Trace',
            'rank': 'Matrix Rank',
            'nullity': 'Matrix Nullity'
        };

        let output = `OPERATION: ${operationNames[operation] || operation}\n`;
        output += `MATRIX: ${matrixName}\n`;
        output += `${'='.repeat(50)}\n\n`;

        if (typeof result === 'string') {
            output += result;
        } else if (typeof result === 'number') {
            output += `Result: ${this.formatNumber(result)}`;
        } else if (typeof result === 'boolean') {
            output += `Result: ${result ? 'True' : 'False'}`;
        } else if (Array.isArray(result)) {
            if (result.length > 0 && Array.isArray(result[0])) {
                output += "Result Matrix:\n";
                output += this.formatMatrixForDisplay(result);
            } else {
                output += "Result Vector: [ " + result.map(x => this.formatNumber(x)).join(", ") + " ]";
            }
        } else if (typeof result === 'object' && result !== null) {
            if (result.P && result.D && result.P_inv) {
                output += "DIAGONALIZATION RESULT:\n\n";
                output += "Transformation Matrix P:\n";
                output += this.formatMatrixForDisplay(result.P);
                output += "\nDiagonal Matrix D:\n";
                output += this.formatMatrixForDisplay(result.D);
                output += "\nInverse Matrix P⁻¹:\n";
                output += this.formatMatrixForDisplay(result.P_inv);
                if (result.message) output += `\nNote: ${result.message}`;
            } else if (result.eigenvalues && result.eigenvectors) {
                output += "EIGEN ANALYSIS:\n\n";
                output += "Eigenvalues:\n";
                result.eigenvalues.forEach((eigenvalue, index) => {
                    output += `  λ${index + 1} = ${this.formatNumber(eigenvalue)}\n`;
                });
                output += "\nEigenvectors:\n";
                result.eigenvectors.forEach((eigenvector, index) => {
                    output += `  v${index + 1} = [ ` + eigenvector.map(x => this.formatNumber(x)).join(", ") + " ]\n";
                });
            } else {
                for (const [key, value] of Object.entries(result)) {
                    const formattedKey = key.replace(/_/g, ' ').toUpperCase();
                    output += `${formattedKey}:\n`;

                    if (Array.isArray(value)) {
                        if (value.length > 0 && Array.isArray(value[0])) {
                            output += this.formatMatrixForDisplay(value, '  ');
                        } else {
                            output += "  [ " + value.map(x => this.formatNumber(x)).join(", ") + " ]\n";
                        }
                    } else output += `  ${value}\n`;
                    output += "\n";
                }
            }
        } else output += `Result: ${JSON.stringify(result, null, 2)}`;

        output += `\n\n${'='.repeat(50)}`;
        output += `\nComputation completed: ${new Date().toLocaleString()}`;
        return output;
    }

    formatAlgebraResult(result, operator, matrix1Name, matrix2Name, matrix1, matrix2) {
        const operatorSymbols = {'+': '＋', '-': '－', '*': '×'};
        let output = `MATRIX ALGEBRA OPERATION\n`;
        output += `${'='.repeat(50)}\n\n`;
        output += `Expression: ${matrix1Name} ${operatorSymbols[operator] || operator} ${matrix2Name}\n\n`;
        output += `Matrix A (${matrix1Name}):\n${this.formatMatrixForDisplay(matrix1)}\n\n`;
        output += `Matrix B (${matrix2Name}):\n${this.formatMatrixForDisplay(matrix2)}\n\n`;
        output += `Result:\n${this.formatMatrixForDisplay(result)}\n\n`;
        output += `Dimensions: ${result.length} × ${result[0].length}`;
        return output;
    }

    formatScalarResult(result, scalar, matrixName, originalMatrix) {
        let output = `SCALAR MULTIPLICATION\n`;
        output += `${'='.repeat(50)}\n\n`;
        output += `Expression: ${scalar} × ${matrixName}\n\n`;
        output += `Original Matrix:\n${this.formatMatrixForDisplay(originalMatrix)}\n\n`;
        output += `Scalar: ${scalar}\n\n`;
        output += `Result:\n${this.formatMatrixForDisplay(result)}\n\n`;
        output += `Dimensions: ${result.length} × ${result[0].length}`;
        return output;
    }

    formatCramerResult(result, matrixName, vectorName, coefficientMatrix, solution) {
        let output = `LINEAR SYSTEM SOLUTION (CRAMER'S RULE)\n`;
        output += `${'='.repeat(50)}\n\n`;
        output += `Coefficient Matrix (${matrixName}):\n${this.formatMatrixForDisplay(coefficientMatrix)}\n\n`;
        output += `Constant Vector (${vectorName}):\n${this.formatMatrixForDisplay([solution])}\n\n`;

        if (typeof result === 'string') output += `Solution: ${result}`;
        else {
            output += `Solution Vector:\n`;
            if (Array.isArray(result) && result.length > 0) {
                if (Array.isArray(result[0])) output += this.formatMatrixForDisplay(result);
                else result.forEach((value, index) => output += `  x${index + 1} = ${this.formatNumber(value)}\n`);
            } else output += this.formatMatrixForDisplay(result);
        }
        return output;
    }

    formatMatrixForDisplay(matrix, indent = '') {
        if (!Array.isArray(matrix)) return String(matrix);
        if (matrix.length === 0) return "[]";
        if (!Array.isArray(matrix[0])) return indent + "[" + matrix.map(val => this.formatNumber(val)).join(", ") + "]";
        const formattedRows = matrix.map(row => {
            const formattedRow = row.map(val => this.formatNumber(val));
            return indent + "[ " + formattedRow.join(", ") + " ]";
        });
        return formattedRows.join("\n");
    }

    formatNumber(value) {
        if (typeof value !== 'number') return String(value);
        if (Math.abs(value) < 1e-10) return '0';
        if (Math.abs(value - Math.round(value)) < 1e-10) return Math.round(value).toString();
        const absValue = Math.abs(value);
        if (absValue >= 1000 || absValue < 0.001) return value.toExponential(4);
        else if (absValue >= 100) return value.toFixed(2);
        else if (absValue >= 10) return value.toFixed(3);
        else if (absValue >= 1) return value.toFixed(4);
        else return value.toFixed(6);
    }

    showResult(message) {
        const resultElement = document.getElementById('result');
        resultElement.textContent = message;
        resultElement.scrollTop = 0;
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        document.querySelectorAll('button').forEach(btn => {
            if (loading) {
                btn.disabled = true;
                btn.classList.add('loading');
            } else {
                btn.disabled = false;
                btn.classList.remove('loading');
            }
        });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

document.addEventListener('DOMContentLoaded', () => window.matrixLab = new MatrixLabPro());