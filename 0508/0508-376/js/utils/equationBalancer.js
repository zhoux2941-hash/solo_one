import { EquationParser } from './equationParser.js';
import { IntegerLinearSolver, solveIntegerLinearSystem, findMinimalCoefficients } from './integerSolver.js';
import { classifyReaction } from './reactionClassifier.js';

export class EquationBalancer {
    constructor() {
        this.parser = null;
        this.matrixInfo = null;
        this.solutionSteps = null;
        this.coefficients = [];
    }

    balance(equation) {
        this.parser = new EquationParser();
        const parsed = this.parser.parse(equation);
        
        const reactionType = classifyReaction(parsed);
        
        this.matrixInfo = this.parser.getMatrix();
        
        const augmentedMatrix = this.matrixInfo.matrix;
        
        this.solutionSteps = solveIntegerLinearSystem(augmentedMatrix);
        
        this.coefficients = findMinimalCoefficients(augmentedMatrix);
        
        return {
            coefficients: this.coefficients,
            parsed: parsed,
            matrixInfo: this.matrixInfo,
            solutionSteps: this.solutionSteps,
            reactionType: reactionType
        };
    }

    formatBalancedEquation(equation) {
        const result = this.balance(equation);
        const { reactants, products } = result.parsed;
        let coefficients = result.coefficients;
        
        const hasNegative = coefficients.some(c => c < 0);
        if (hasNegative) {
            coefficients = coefficients.map(c => -c);
        }
        
        const hasZero = coefficients.some(c => c === 0);
        if (hasZero && coefficients.filter(c => c > 0).length > 0) {
            const minPositive = Math.min(...coefficients.filter(c => c > 0));
            const newCoefficients = coefficients.map(c => c === 0 ? minPositive : c);
            coefficients = newCoefficients;
        }
        
        let reactantStr = '';
        for (let i = 0; i < reactants.length; i++) {
            const coeff = coefficients[i] || 1;
            const absCoeff = Math.abs(coeff);
            if (i > 0) reactantStr += '+';
            reactantStr += (absCoeff === 1 ? '' : absCoeff) + reactants[i].formula;
        }
        
        let productStr = '';
        for (let i = 0; i < products.length; i++) {
            const coeff = coefficients[reactants.length + i] || 1;
            const absCoeff = Math.abs(coeff);
            if (i > 0) productStr += '+';
            productStr += (absCoeff === 1 ? '' : absCoeff) + products[i].formula;
        }
        
        return {
            balanced: reactantStr + '=' + productStr,
            coefficients: coefficients,
            steps: this.solutionSteps,
            reactionType: result.reactionType
        };
    }

    validateEquation(equation) {
        if (!equation || !equation.includes('=')) {
            return { valid: false, error: '方程式必须包含等号' };
        }
        
        const [left, right] = equation.split('=');
        
        if (!left.trim() || !right.trim()) {
            return { valid: false, error: '方程式两边都不能为空' };
        }
        
        try {
            const parser = new EquationParser();
            const parsed = parser.parse(equation);
            
            if (parsed.elements.length === 0) {
                return { valid: false, error: '未能识别任何元素' };
            }
            
            return { valid: true, parsed };
        } catch (e) {
            return { valid: false, error: '方程式格式无效: ' + e.message };
        }
    }

    verifyBalance(equation) {
        const result = this.balance(equation);
        const { reactants, products, elements } = result.parsed;
        const coefficients = result.coefficients;
        
        const elementCounts = {};
        
        for (const element of elements) {
            let leftCount = 0;
            let rightCount = 0;
            
            for (let i = 0; i < reactants.length; i++) {
                leftCount += coefficients[i] * (reactants[i].elements[element] || 0);
            }
            
            for (let i = 0; i < products.length; i++) {
                rightCount += coefficients[reactants.length + i] * (products[i].elements[element] || 0);
            }
            
            elementCounts[element] = { left: leftCount, right: rightCount, balanced: leftCount === rightCount };
        }
        
        const allBalanced = elements.every(e => elementCounts[e].balanced);
        
        return {
            balanced: allBalanced,
            elementCounts: elementCounts
        };
    }
}

export function balanceEquation(equation) {
    const balancer = new EquationBalancer();
    return balancer.formatBalancedEquation(equation);
}

export function validateAndBalance(equation) {
    const balancer = new EquationBalancer();
    const validation = balancer.validateEquation(equation);
    
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }
    
    try {
        const result = balancer.formatBalancedEquation(equation);
        const verification = balancer.verifyBalance(equation);
        
        return {
            success: true,
            balancedEquation: result.balanced,
            coefficients: result.coefficients,
            steps: result.steps,
            verified: verification.balanced,
            elementCounts: verification.elementCounts
        };
    } catch (e) {
        return { success: false, error: '配平失败: ' + e.message };
    }
}