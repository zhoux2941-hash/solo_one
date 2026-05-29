export class Tokenizer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.tokens = [];
        this.tokenize();
    }

    tokenize() {
        while (this.pos < this.input.length) {
            const char = this.input[this.pos];
            
            if (char === ' ' || char === '\t') {
                this.pos++;
                continue;
            }
            
            if (/[A-Z]/.test(char)) {
                let element = char;
                this.pos++;
                
                while (this.pos < this.input.length && /[a-z]/.test(this.input[this.pos])) {
                    element += this.input[this.pos];
                    this.pos++;
                }
                
                this.tokens.push({ type: 'ELEMENT', value: element });
                continue;
            }
            
            if (/[0-9]/.test(char)) {
                let number = '';
                while (this.pos < this.input.length && /[0-9]/.test(this.input[this.pos])) {
                    number += this.input[this.pos];
                    this.pos++;
                }
                this.tokens.push({ type: 'NUMBER', value: parseInt(number) });
                continue;
            }
            
            if (char === '(') {
                this.tokens.push({ type: 'LPAREN', value: '(' });
                this.pos++;
                continue;
            }
            
            if (char === ')') {
                this.tokens.push({ type: 'RPAREN', value: ')' });
                this.pos++;
                continue;
            }
            
            if (char === '+') {
                this.tokens.push({ type: 'PLUS', value: '+' });
                this.pos++;
                continue;
            }
            
            if (char === '=') {
                this.tokens.push({ type: 'EQUALS', value: '=' });
                this.pos++;
                continue;
            }
            
            if (char === '-') {
                this.tokens.push({ type: 'MINUS', value: '-' });
                this.pos++;
                continue;
            }
            
            this.pos++;
        }
        
        this.tokens.push({ type: 'EOF', value: '' });
    }

    peek() {
        return this.tokens[0];
    }

    consume() {
        return this.tokens.shift();
    }

    expect(type) {
        const token = this.consume();
        if (token.type !== type) {
            throw new Error(`Expected ${type}, got ${token.type}`);
        }
        return token;
    }
}

export class ASTNode {
    constructor(type) {
        this.type = type;
    }
}

export class ElementNode extends ASTNode {
    constructor(symbol, count = 1) {
        super('ELEMENT');
        this.symbol = symbol;
        this.count = count;
    }
}

export class GroupNode extends ASTNode {
    constructor(children, count = 1) {
        super('GROUP');
        this.children = children;
        this.count = count;
    }
}

export class CompoundNode extends ASTNode {
    constructor(children, charge = 0) {
        super('COMPOUND');
        this.children = children;
        this.charge = charge;
    }
}

export class EquationNode extends ASTNode {
    constructor(reactants, products) {
        super('EQUATION');
        this.reactants = reactants;
        this.products = products;
    }
}

export class EquationParser {
    constructor(input) {
        this.tokenizer = new Tokenizer(input);
        this.elements = {};
    }

    parse() {
        const reactants = this.parseSide();
        this.tokenizer.expect('EQUALS');
        const products = this.parseSide();
        
        this.extractElements([...reactants, ...products]);
        
        return {
            reactants: reactants.map(c => this.compoundToObject(c)),
            products: products.map(c => this.compoundToObject(c)),
            elements: Object.keys(this.elements)
        };
    }

    parseSide() {
        const compounds = [];
        compounds.push(this.parseCompound());
        
        while (this.tokenizer.peek().type === 'PLUS') {
            this.tokenizer.consume();
            compounds.push(this.parseCompound());
        }
        
        return compounds;
    }

    parseCompound() {
        const children = [];
        let charge = 0;
        
        while (this.tokenizer.peek().type === 'ELEMENT' || 
               this.tokenizer.peek().type === 'LPAREN') {
            if (this.tokenizer.peek().type === 'ELEMENT') {
                children.push(this.parseElement());
            } else if (this.tokenizer.peek().type === 'LPAREN') {
                children.push(this.parseGroup());
            }
        }
        
        if (this.tokenizer.peek().type === 'PLUS') {
            this.tokenizer.consume();
            if (this.tokenizer.peek().type === 'NUMBER') {
                charge = this.tokenizer.consume().value;
            } else {
                charge = 1;
            }
        } else if (this.tokenizer.peek().type === 'MINUS') {
            this.tokenizer.consume();
            if (this.tokenizer.peek().type === 'NUMBER') {
                charge = -this.tokenizer.consume().value;
            } else {
                charge = -1;
            }
        }
        
        return new CompoundNode(children, charge);
    }

    parseElement() {
        const element = this.tokenizer.expect('ELEMENT').value;
        let count = 1;
        
        if (this.tokenizer.peek().type === 'NUMBER') {
            count = this.tokenizer.consume().value;
        }
        
        return new ElementNode(element, count);
    }

    parseGroup() {
        this.tokenizer.expect('LPAREN');
        const children = [];
        
        while (this.tokenizer.peek().type !== 'RPAREN' && 
               this.tokenizer.peek().type !== 'EOF') {
            if (this.tokenizer.peek().type === 'ELEMENT') {
                children.push(this.parseElement());
            } else if (this.tokenizer.peek().type === 'LPAREN') {
                children.push(this.parseGroup());
            }
        }
        
        this.tokenizer.expect('RPAREN');
        
        let count = 1;
        if (this.tokenizer.peek().type === 'NUMBER') {
            count = this.tokenizer.consume().value;
        }
        
        return new GroupNode(children, count);
    }

    extractElements(compounds) {
        for (const compound of compounds) {
            this.extractFromNode(compound);
        }
    }

    extractFromNode(node) {
        if (node.type === 'ELEMENT') {
            this.elements[node.symbol] = true;
        } else if (node.type === 'GROUP' || node.type === 'COMPOUND') {
            for (const child of node.children) {
                this.extractFromNode(child);
            }
        }
    }

    compoundToObject(compound) {
        const elements = {};
        this.countElements(compound, elements);
        
        return {
            formula: this.nodeToString(compound),
            elements: elements,
            charge: compound.charge
        };
    }

    countElements(node, elements, multiplier = 1) {
        if (node.type === 'ELEMENT') {
            const count = node.count * multiplier;
            elements[node.symbol] = (elements[node.symbol] || 0) + count;
        } else if (node.type === 'GROUP') {
            const newMultiplier = multiplier * node.count;
            for (const child of node.children) {
                this.countElements(child, elements, newMultiplier);
            }
        } else if (node.type === 'COMPOUND') {
            for (const child of node.children) {
                this.countElements(child, elements, multiplier);
            }
        }
    }

    nodeToString(node) {
        if (node.type === 'ELEMENT') {
            return node.symbol + (node.count > 1 ? node.count : '');
        } else if (node.type === 'GROUP') {
            return '(' + node.children.map(c => this.nodeToString(c)).join('') + ')' + 
                   (node.count > 1 ? node.count : '');
        } else if (node.type === 'COMPOUND') {
            let str = node.children.map(c => this.nodeToString(c)).join('');
            if (node.charge !== 0) {
                str += node.charge > 0 ? '+' : '-';
                if (Math.abs(node.charge) > 1) {
                    str += Math.abs(node.charge);
                }
            }
            return str;
        }
        return '';
    }

    getMatrix() {
        const result = this.parse();
        const elementList = Object.keys(this.elements);
        const matrix = [];
        
        for (const element of elementList) {
            const row = [];
            
            for (const reactant of result.reactants) {
                row.push(reactant.elements[element] || 0);
            }
            
            for (const product of result.products) {
                row.push(-(product.elements[element] || 0));
            }
            
            row.push(0);
            matrix.push(row);
        }
        
        return {
            matrix,
            elements: elementList,
            compoundCount: result.reactants.length + result.products.length,
            reactantCount: result.reactants.length,
            productCount: result.products.length,
            reactants: result.reactants,
            products: result.products
        };
    }
}

export function parseEquation(equation) {
    const parser = new EquationParser(equation);
    return parser.parse();
}

export function getBalanceMatrix(equation) {
    const parser = new EquationParser(equation);
    return parser.getMatrix();
}