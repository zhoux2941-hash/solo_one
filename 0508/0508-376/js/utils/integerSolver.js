export class IntegerLinearSolver {
    constructor() {
        this.solution = [];
        this.steps = [];
    }

    solve(matrix) {
        this.steps = [];
        
        const rows = matrix.length;
        const cols = matrix[0].length - 1;
        
        this.steps.push({
            description: '初始系数矩阵',
            matrix: this.copyMatrix(matrix)
        });
        
        const augmented = matrix.map(row => [...row]);
        
        let pivotRow = 0;
        for (let col = 0; col < cols && pivotRow < rows; col++) {
            let maxRow = pivotRow;
            for (let row = pivotRow + 1; row < rows; row++) {
                if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
                    maxRow = row;
                }
            }
            
            if (maxRow !== pivotRow) {
                [augmented[pivotRow], augmented[maxRow]] = [augmented[maxRow], augmented[pivotRow]];
                this.steps.push({
                    description: `交换行 ${pivotRow + 1} 和行 ${maxRow + 1}`,
                    matrix: this.copyMatrix(augmented)
                });
            }
            
            const pivot = augmented[pivotRow][col];
            if (Math.abs(pivot) < 1e-10) {
                pivotRow++;
                col--;
                continue;
            }
            
            for (let row = 0; row < rows; row++) {
                if (row !== pivotRow && Math.abs(augmented[row][col]) > 0) {
                    const factor = augmented[row][col];
                    const lcm = this.lcm(Math.abs(pivot), Math.abs(factor));
                    const scalePivot = lcm / Math.abs(pivot);
                    const scaleRow = lcm / Math.abs(factor);
                    
                    for (let c = col; c <= cols; c++) {
                        augmented[row][c] = scaleRow * augmented[row][c] * Math.sign(factor) - 
                                           scalePivot * augmented[pivotRow][c] * Math.sign(pivot);
                    }
                    
                    this.steps.push({
                        description: `行 ${row + 1} = ${scaleRow}×行 ${row + 1} - ${scalePivot}×行 ${pivotRow + 1}`,
                        matrix: this.copyMatrix(augmented)
                    });
                }
            }
            
            pivotRow++;
        }
        
        const solution = this.backSubstitute(augmented);
        
        this.steps.push({
            description: '整数解向量',
            solution: solution
        });
        
        return {
            steps: this.steps,
            solution: solution,
            rowEchelonForm: augmented
        };
    }

    lcm(a, b) {
        return Math.abs(a * b) / this.gcd(a, b);
    }

    gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b !== 0) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    backSubstitute(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const solution = new Array(cols - 1).fill(0);
        
        for (let i = rows - 1; i >= 0; i--) {
            let pivotCol = -1;
            
            for (let j = 0; j < cols - 1; j++) {
                if (Math.abs(matrix[i][j]) > 1e-10) {
                    pivotCol = j;
                    break;
                }
            }
            
            if (pivotCol === -1) continue;
            
            let sum = 0;
            for (let j = pivotCol + 1; j < cols - 1; j++) {
                sum += matrix[i][j] * solution[j];
            }
            
            const val = matrix[i][cols - 1] - sum;
            const coeff = matrix[i][pivotCol];
            
            if (coeff !== 0) {
                solution[pivotCol] = val / coeff;
            }
        }
        
        return solution;
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
            return Math.abs(a);
        };
        
        const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
        
        return numbers.reduce((acc, val) => lcm(acc, val), 1);
    }

    static getIntegerSolution(solution) {
        const hasFraction = solution.some(x => x !== Math.round(x));
        
        if (!hasFraction) {
            return solution.map(x => Math.round(x));
        }
        
        const denominators = [];
        for (const x of solution) {
            if (x !== 0) {
                const frac = this.toFraction(x);
                denominators.push(frac.denominator);
            }
        }
        
        const lcm = this.findLCM(denominators);
        
        return solution.map(x => Math.round(x * lcm));
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

    static findMinimalIntegerSolution(matrix) {
        const solver = new IntegerLinearSolver();
        const result = solver.solve(matrix);
        
        let solution = result.solution;
        
        const hasNonZero = solution.some(x => Math.abs(x) > 1e-10);
        if (!hasNonZero) {
            solution = new Array(matrix[0].length - 1).fill(0);
            solution[0] = 1;
        }
        
        let integerSolution = this.getIntegerSolution(solution);
        
        const nonZeroValues = integerSolution.filter(x => Math.abs(x) > 0);
        if (nonZeroValues.length > 0) {
            let gcdVal = Math.abs(nonZeroValues[0]);
            for (const val of nonZeroValues) {
                gcdVal = this.gcdStatic(gcdVal, Math.abs(val));
            }
            
            if (gcdVal > 1) {
                integerSolution = integerSolution.map(x => x / gcdVal);
            }
        }
        
        const allZero = integerSolution.every(x => x === 0);
        if (allZero) {
            integerSolution = [1, ...new Array(integerSolution.length - 1).fill(0)];
        }
        
        const hasNegative = integerSolution.some(x => x < 0);
        if (hasNegative) {
            integerSolution = integerSolution.map(x => -x);
        }
        
        return integerSolution;
    }

    static gcdStatic(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b !== 0) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }
}

export function solveIntegerLinearSystem(matrix) {
    const solver = new IntegerLinearSolver();
    return solver.solve(matrix);
}

export function findMinimalCoefficients(matrix) {
    return IntegerLinearSolver.findMinimalIntegerSolution(matrix);
}