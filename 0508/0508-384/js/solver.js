class CubeSolver {
    constructor() {
        this.moves = ['U', 'U\'', 'D', 'D\'', 'L', 'L\'', 'R', 'R\'', 'F', 'F\'', 'B', 'B\''];
        this.oppositeMoves = {
            'U': 'U\'', 'U\'': 'U',
            'D': 'D\'', 'D\'': 'D',
            'L': 'L\'', 'L\'': 'L',
            'R': 'R\'', 'R\'': 'R',
            'F': 'F\'', 'F\'': 'F',
            'B': 'B\'', 'B\'': 'B'
        };
        this.solutionQueue = [];
    }
    
    getNextMove(cube) {
        const state = this.analyzeState(cube);
        
        if (state.stage === 0) {
            return this.solveCross(cube);
        } else if (state.stage === 1) {
            return this.solveFirstLayerCorners(cube);
        } else if (state.stage === 2) {
            return this.solveSecondLayer(cube);
        } else if (state.stage === 3) {
            return this.solveYellowCross(cube);
        } else if (state.stage === 4) {
            return this.solveYellowCorners(cube);
        } else if (state.stage === 5) {
            return this.solveFinalLayer(cube);
        }
        
        return null;
    }
    
    analyzeState(cube) {
        const faces = cube.faces;
        let stage = 0;
        
        const crossDone = this.isCrossDone(faces);
        if (crossDone) stage = 1;
        
        const firstLayerDone = this.isFirstLayerDone(faces);
        if (firstLayerDone) stage = 2;
        
        const secondLayerDone = this.isSecondLayerDone(faces);
        if (secondLayerDone) stage = 3;
        
        const yellowCrossDone = this.isYellowCrossDone(faces);
        if (yellowCrossDone) stage = 4;
        
        const yellowCornersDone = this.isYellowCornersDone(faces);
        if (yellowCornersDone) stage = 5;
        
        const solved = cube.isSolved();
        if (solved) stage = 6;
        
        return { stage, crossDone, firstLayerDone, secondLayerDone, yellowCrossDone, yellowCornersDone, solved };
    }
    
    isCrossDone(faces) {
        const edges = [
            faces.U[0][1] === 'W' && faces.F[0][1] === 'G',
            faces.U[1][2] === 'W' && faces.R[0][1] === 'R',
            faces.U[2][1] === 'W' && faces.B[0][1] === 'B',
            faces.U[1][0] === 'W' && faces.L[0][1] === 'O'
        ];
        return edges.every(e => e);
    }
    
    isFirstLayerDone(faces) {
        if (!this.isCrossDone(faces)) return false;
        const corners = [
            faces.U[0][0] === 'W' && faces.F[0][0] === 'G' && faces.L[0][0] === 'O',
            faces.U[0][2] === 'W' && faces.F[0][2] === 'G' && faces.R[0][0] === 'R',
            faces.U[2][2] === 'W' && faces.B[0][2] === 'B' && faces.R[0][2] === 'R',
            faces.U[2][0] === 'W' && faces.B[0][0] === 'B' && faces.L[0][2] === 'O'
        ];
        return corners.every(c => c);
    }
    
    isSecondLayerDone(faces) {
        if (!this.isFirstLayerDone(faces)) return false;
        const edges = [
            faces.F[1][0] === 'G' && faces.L[1][2] === 'O',
            faces.F[1][2] === 'G' && faces.R[1][0] === 'R',
            faces.B[1][2] === 'B' && faces.R[1][2] === 'R',
            faces.B[1][0] === 'B' && faces.L[1][0] === 'O'
        ];
        return edges.every(e => e);
    }
    
    isYellowCrossDone(faces) {
        if (!this.isSecondLayerDone(faces)) return false;
        return faces.D[1][1] === 'Y' && 
               faces.D[0][1] === 'Y' && 
               faces.D[1][0] === 'Y' && 
               faces.D[1][2] === 'Y' &&
               faces.D[2][1] === 'Y';
    }
    
    isYellowCornersDone(faces) {
        if (!this.isYellowCrossDone(faces)) return false;
        return faces.D[0][0] === 'Y' && faces.D[0][2] === 'Y' && 
               faces.D[2][0] === 'Y' && faces.D[2][2] === 'Y';
    }
    
    solveCross(cube) {
        const faces = cube.faces;
        const moves = ['U', 'D', 'L', 'R', 'F', 'B'];
        
        for (const move of moves) {
            const testCube = cube.clone();
            testCube.executeMove(move);
            if (this.isCrossDone(testCube.faces)) {
                return move;
            }
        }
        
        for (const move1 of moves) {
            for (const move2 of moves) {
                if (move2 === this.oppositeMoves[move1]) continue;
                const testCube = cube.clone();
                testCube.executeMove(move1);
                testCube.executeMove(move2);
                if (this.isCrossDone(testCube.faces)) {
                    return move1;
                }
            }
        }
        
        const candidates = ['F', 'F\'', 'R', 'R\'', 'B', 'B\'', 'L', 'L\''];
        const randomMove = candidates[Math.floor(Math.random() * candidates.length)];
        return randomMove;
    }
    
    solveFirstLayerCorners(cube) {
        const moves = ['U', 'U\'', 'F', 'F\'', 'R', 'R\'', 'B', 'B\'', 'L', 'L\''];
        
        for (const move of moves) {
            const testCube = cube.clone();
            testCube.executeMove(move);
            if (this.isFirstLayerDone(testCube.faces)) {
                return move;
            }
        }
        
        for (const move of ['U', 'U\'', 'F', 'F\'', 'R', 'R\'']) {
            return move;
        }
        
        return 'U';
    }
    
    solveSecondLayer(cube) {
        const moves = ['U', 'U\'', 'F', 'F\'', 'R', 'R\'', 'B', 'B\'', 'L', 'L\''];
        
        for (const move of moves) {
            const testCube = cube.clone();
            testCube.executeMove(move);
            if (this.isSecondLayerDone(testCube.faces)) {
                return move;
            }
        }
        
        const secondLayerMoves = [
            'U R U\' R\' U\' F\' U F',
            'U\' L\' U L U F U\' F\''
        ];
        
        for (const sequence of secondLayerMoves) {
            const testCube = cube.clone();
            sequence.split(' ').forEach(m => testCube.executeMove(m));
            if (this.isSecondLayerDone(testCube.faces)) {
                return sequence.split(' ')[0];
            }
        }
        
        return 'U';
    }
    
    solveYellowCross(cube) {
        const yellowEdges = [
            cube.faces.D[0][1] === 'Y',
            cube.faces.D[1][2] === 'Y',
            cube.faces.D[2][1] === 'Y',
            cube.faces.D[1][0] === 'Y'
        ];
        
        const edgeCount = yellowEdges.filter(e => e).length;
        
        if (edgeCount === 0) {
            return 'F R U R\' U\' F\'';
        } else if (edgeCount === 2) {
            if (yellowEdges[0] && yellowEdges[2]) {
                return 'F R U R\' U\' F\'';
            } else {
                return 'R U R\' U R U2 R\'';
            }
        }
        
        return 'U';
    }
    
    solveYellowCorners(cube) {
        const moves = ['U', 'U\'', 'R', 'R\'', 'F', 'F\''];
        
        for (const move of moves) {
            const testCube = cube.clone();
            testCube.executeMove(move);
            if (this.isYellowCornersDone(testCube.faces)) {
                return move;
            }
        }
        
        return 'U';
    }
    
    solveFinalLayer(cube) {
        const moves = ['U', 'U\'', 'R', 'R\'', 'F', 'F\'', 'L', 'L\'', 'B', 'B\''];
        
        for (const move of moves) {
            const testCube = cube.clone();
            testCube.executeMove(move);
            if (testCube.isSolved()) {
                return move;
            }
        }
        
        const finalMoves = [
            'R U R\' U R U2 R\'',
            'R\' U\' R U\' R\' U2 R'
        ];
        
        for (const sequence of finalMoves) {
            const testCube = cube.clone();
            sequence.split(' ').forEach(m => testCube.executeMove(m));
            if (testCube.isSolved()) {
                return sequence.split(' ')[0];
            }
        }
        
        return 'U';
    }
    
    scramble(cube, steps = 50) {
        const scrambleMoves = [];
        let lastMove = '';
        
        for (let i = 0; i < steps; i++) {
            let move;
            do {
                move = this.moves[Math.floor(Math.random() * this.moves.length)];
            } while (move === this.oppositeMoves[lastMove]);
            
            cube.executeMove(move);
            scrambleMoves.push(move);
            lastMove = move;
        }
        
        return scrambleMoves;
    }
    
    precomputeSolution(cube, maxSteps = 100) {
        this.solutionQueue = [];
        const testCube = cube.clone();
        let steps = 0;
        
        while (!testCube.isSolved() && steps < maxSteps) {
            const move = this.getNextMove(testCube);
            if (!move) break;
            
            const expandedMoves = this.expandMoveSequence(move);
            expandedMoves.forEach(m => {
                testCube.executeMove(m);
                this.solutionQueue.push(m);
            });
            
            steps += expandedMoves.length;
        }
        
        return this.solutionQueue;
    }
    
    expandMoveSequence(move) {
        if (move.includes(' ')) {
            return move.split(' ');
        }
        return [move];
    }
    
    getNextFromQueue() {
        return this.solutionQueue.shift() || null;
    }
    
    peekNextFromQueue() {
        return this.solutionQueue[0] || null;
    }
    
    clearQueue() {
        this.solutionQueue = [];
    }
    
    getQueueLength() {
        return this.solutionQueue.length;
    }
}

export { CubeSolver };