export class GaussianElimination {
    constructor() {
        this.matrix = [];
        this.steps = [];
        this.solution = [];
    }

    solve(matrix) {
        this.matrix = matrix.map(row => [...row]);
        this.steps = [];
        this.solution = [];
        
        const rows = this.matrix.length;
        const cols = this.matrix[0].length;
        
        this.steps.push({
            description: '初始增广矩阵',
            matrix: this.copyMatrix(this.matrix)
        });
        
        let pivotRow = 0;
        
        for (let col = 0; col < cols - 1 && pivotRow < rows; col++) {
            let maxRow = pivotRow;
            
            for (let row = pivotRow + 1; row < rows; row++) {
                if (Math.abs(this.matrix[row][col]) > Math.abs(this.matrix[maxRow][col])) {
                    maxRow = row;
                }
            }
            
            if (maxRow !== pivotRow) {
                this.swapRows(pivotRow, maxRow);
                this.steps.push({
                    description: `交换行 ${pivotRow + 1} 和行 ${maxRow + 1}`,
                    matrix: this.copyMatrix(this.matrix)
                });
            }
            
            const pivot = this.matrix[pivotRow][col];
            
            if (Math.abs(pivot) < 1e-10) {
                pivotRow++;
                col--;
                continue;
            }
            
            for (let row = pivotRow + 1; row < rows; row++) {
                const factor = this.matrix[row][col] / pivot;
                
                for (let c = col; c < cols; c++) {
                    this.matrix[row][c] -= factor * this.matrix[pivotRow][c];
                }
                
                this.steps.push({
                    description: `行 ${row + 1} = 行 ${row + 1} - ${factor.toFixed(3)} × 行 ${pivotRow + 1}`,
                    matrix: this.copyMatrix(this.matrix)
                });
            }
            
            pivotRow++;
        }
        
        this.backSubstitute();
        
        return {
            steps: this.steps,
            solution: this.solution,
            rowEchelonForm: this.copyMatrix(this.matrix)
        };
    }

    swapRows(i, j) {
        const temp = this.matrix[i];
        this.matrix[i] = this.matrix[j];
        this.matrix[j] = temp;
    }

    backSubstitute() {
        const rows = this.matrix.length;
        const cols = this.matrix[0].length;
        
        this.solution = new Array(cols - 1).fill(0);
        
        for (let i = rows - 1; i >= 0; i--) {
            let pivotCol = -1;
            
            for (let j = 0; j < cols - 1; j++) {
                if (Math.abs(this.matrix[i][j]) > 1e-10) {
                    pivotCol = j;
                    break;
                }
            }
            
            if (pivotCol === -1) continue;
            
            let sum = 0;
            for (let j = pivotCol + 1; j < cols - 1; j++) {
                sum += this.matrix[i][j] * this.solution[j];
            }
            
            this.solution[pivotCol] = (this.matrix[i][cols - 1] - sum) / this.matrix[i][pivotCol];
        }
    }

    copyMatrix(matrix) {
        return matrix.map(row => [...row]);
    }

    static findLCM(numbers) {
        const gcd = (a, b) => {
            while (b !== 0) {
                const temp = b;
                b = a % b;
                a = temp;
            }
            return a;
        };
        
        const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
        
        return numbers.reduce((acc, val) => lcm(acc, val), 1);
    }

    static toFraction(value, tolerance = 1e-10) {
        if (Math.abs(value) < tolerance) return { numerator: 0, denominator: 1 };
        
        const gcd = (a, b) => {
            while (b !== 0) {
                const temp = b;
                b = a % b;
                a = temp;
            }
            return Math.abs(a);
        };
        
        let sign = value < 0 ? -1 : 1;
        let x = Math.abs(value);
        
        let h1 = 1, h2 = 0;
        let k1 = 0, k2 = 1;
        
        while (Math.abs(x - h1 / k1) > tolerance * h1 / k1 && k1 < 10000) {
            const a = Math.floor(x);
            const aux = h1;
            h1 = a * h1 + h2;
            h2 = aux;
            const aux2 = k1;
            k1 = a * k1 + k2;
            k2 = aux2;
            if (x === a) break;
            x = 1 / (x - a);
        }
        
        let numerator = sign * h1;
        let denominator = k1;
        
        const divisor = gcd(numerator, denominator);
        numerator /= divisor;
        denominator /= divisor;
        
        if (denominator < 0) {
            numerator *= -1;
            denominator *= -1;
        }
        
        return { numerator, denominator };
    }

    static getIntegerSolution(solution) {
        const fractions = solution.map(val => this.toFraction(val));
        const denominators = fractions.map(f => f.denominator);
        const lcm = this.findLCM(denominators);
        
        return fractions.map(f => Math.round((f.numerator * lcm) / f.denominator));
    }
}

export function solveLinearSystem(matrix) {
    const solver = new GaussianElimination();
    return solver.solve(matrix);
}

export function getIntegerCoefficients(matrix) {
    const result = solveLinearSystem(matrix);
    return GaussianElimination.getIntegerSolution(result.solution);
}