export class ReactionClassifier {
    constructor() {
        this.types = {
            combination: { name: '化合反应', description: '多种物质生成一种物质' },
            decomposition: { name: '分解反应', description: '一种物质生成多种物质' },
            displacement: { name: '置换反应', description: '单质与化合物反应生成新的单质和化合物' },
            doubleDisplacement: { name: '复分解反应', description: '两种化合物互相交换成分' },
            combustion: { name: '燃烧反应', description: '物质与氧气发生的发光发热反应' },
            redox: { name: '氧化还原反应', description: '有电子转移的反应' },
            neutralization: { name: '中和反应', description: '酸与碱反应生成盐和水' },
            unknown: { name: '未知反应', description: '无法确定反应类型' }
        };
    }

    classify(parsedEquation) {
        const { reactants, products, elements } = parsedEquation;
        
        const reactantCount = reactants.length;
        const productCount = products.length;
        
        const isCombination = this.isCombination(reactants, products);
        if (isCombination) return { type: 'combination', ...this.types.combination };
        
        const isDecomposition = this.isDecomposition(reactants, products);
        if (isDecomposition) return { type: 'decomposition', ...this.types.decomposition };
        
        const isDisplacement = this.isDisplacement(reactants, products);
        if (isDisplacement) return { type: 'displacement', ...this.types.displacement };
        
        const isDoubleDisplacement = this.isDoubleDisplacement(reactants, products);
        if (isDoubleDisplacement) return { type: 'doubleDisplacement', ...this.types.doubleDisplacement };
        
        const isCombustion = this.isCombustion(reactants, products);
        if (isCombustion) return { type: 'combustion', ...this.types.combustion };
        
        const isNeutralization = this.isNeutralization(reactants, products);
        if (isNeutralization) return { type: 'neutralization', ...this.types.neutralization };
        
        const isRedox = this.isRedox(reactants, products, elements);
        if (isRedox) return { type: 'redox', ...this.types.redox };
        
        return { type: 'unknown', ...this.types.unknown };
    }

    isCombination(reactants, products) {
        if (products.length !== 1) return false;
        if (reactants.length < 2) return false;
        
        const productElements = new Set(Object.keys(products[0].elements));
        
        for (const reactant of reactants) {
            for (const element of Object.keys(reactant.elements)) {
                if (!productElements.has(element)) return false;
            }
        }
        
        return true;
    }

    isDecomposition(reactants, products) {
        if (reactants.length !== 1) return false;
        if (products.length < 2) return false;
        
        const reactantElements = new Set(Object.keys(reactants[0].elements));
        
        for (const product of products) {
            for (const element of Object.keys(product.elements)) {
                if (!reactantElements.has(element)) return false;
            }
        }
        
        return true;
    }

    isDisplacement(reactants, products) {
        if (reactants.length !== 2 || products.length !== 2) return false;
        
        const reactant1 = reactants[0];
        const reactant2 = reactants[1];
        const product1 = products[0];
        const product2 = products[1];
        
        const reactant1Elements = Object.keys(reactant1.elements);
        const reactant2Elements = Object.keys(reactant2.elements);
        
        if (reactant1Elements.length !== 1 || reactant2Elements.length !== 2) {
            if (reactant1Elements.length !== 2 || reactant2Elements.length !== 1) {
                return false;
            }
        }
        
        const allElements = new Set([...reactant1Elements, ...reactant2Elements]);
        
        const product1Elements = Object.keys(product1.elements);
        const product2Elements = Object.keys(product2.elements);
        
        const productElements = new Set([...product1Elements, ...product2Elements]);
        
        if (allElements.size !== productElements.size) return false;
        
        for (const element of allElements) {
            if (!productElements.has(element)) return false;
        }
        
        return true;
    }

    isDoubleDisplacement(reactants, products) {
        if (reactants.length !== 2 || products.length !== 2) return false;
        
        const reactant1Elements = Object.keys(reactants[0].elements);
        const reactant2Elements = Object.keys(reactants[1].elements);
        
        if (reactant1Elements.length !== 2 || reactant2Elements.length !== 2) return false;
        
        const allElements = new Set([...reactant1Elements, ...reactant2Elements]);
        if (allElements.size !== 4) return false;
        
        const product1Elements = Object.keys(products[0].elements);
        const product2Elements = Object.keys(products[1].elements);
        
        if (product1Elements.length !== 2 || product2Elements.length !== 2) return false;
        
        const productElements = new Set([...product1Elements, ...product2Elements]);
        
        if (allElements.size !== productElements.size) return false;
        
        for (const element of allElements) {
            if (!productElements.has(element)) return false;
        }
        
        const hasH2O = products.some(p => p.elements['H'] && p.elements['O']);
        const hasSalt = products.some(p => {
            const els = Object.keys(p.elements);
            return els.length >= 2 && 
                   (els.includes('Na') || els.includes('K') || els.includes('Ca') || 
                    els.includes('Mg') || els.includes('Cl') || els.includes('SO4') ||
                    els.includes('NO3') || els.includes('CO3'));
        });
        
        if (hasH2O && hasSalt) return true;
        
        return true;
    }

    isCombustion(reactants, products) {
        const hasOxygen = reactants.some(r => r.elements['O'] && Object.keys(r.elements).length === 1);
        
        if (!hasOxygen) {
            const hasO2 = reactants.some(r => {
                const els = Object.keys(r.elements);
                return els.length === 1 && els[0] === 'O';
            });
            if (!hasO2) return false;
        }
        
        const hasCarbon = reactants.some(r => r.elements['C']);
        
        const hasCO2orH2O = products.some(p => p.elements['C'] && p.elements['O']) ||
                           products.some(p => p.elements['H'] && p.elements['O']);
        
        return hasOxygen && (hasCarbon || hasCO2orH2O);
    }

    isNeutralization(reactants, products) {
        let hasAcid = false;
        let hasBase = false;
        
        for (const reactant of reactants) {
            const elements = Object.keys(reactant.elements);
            
            if (elements.includes('H') && !elements.includes('O')) {
                hasAcid = true;
            } else if (elements.includes('H') && elements.includes('O') && 
                      (elements.includes('S') || elements.includes('N') || elements.includes('Cl'))) {
                hasAcid = true;
            } else if (elements.includes('O') && elements.includes('H') && 
                      (elements.includes('Na') || elements.includes('K') || 
                       elements.includes('Ca') || elements.includes('Mg'))) {
                hasBase = true;
            }
        }
        
        const hasH2O = products.some(p => p.elements['H'] && p.elements['O'] && 
                                       Object.keys(p.elements).length === 2);
        
        const hasSalt = products.some(p => {
            const els = Object.keys(p.elements);
            return els.length >= 2 && !els.includes('H');
        });
        
        return hasAcid && hasBase && hasH2O && hasSalt;
    }

    isRedox(reactants, products, elements) {
        for (const element of elements) {
            let leftTotal = 0;
            let rightTotal = 0;
            
            for (let i = 0; i < reactants.length; i++) {
                leftTotal += (reactants[i].elements[element] || 0);
            }
            
            for (let i = 0; i < products.length; i++) {
                rightTotal += (products[i].elements[element] || 0);
            }
            
            if (leftTotal !== rightTotal) {
                return true;
            }
        }
        
        const hasIon = reactants.some(r => r.charge !== 0) || 
                      products.some(p => p.charge !== 0);
        
        return hasIon;
    }

    getAllTypes() {
        return this.types;
    }
}

export function classifyReaction(parsedEquation) {
    const classifier = new ReactionClassifier();
    return classifier.classify(parsedEquation);
}