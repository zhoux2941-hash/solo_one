class Cube {
    constructor() {
        this.faces = {
            U: [['W','W','W'],['W','W','W'],['W','W','W']],
            D: [['Y','Y','Y'],['Y','Y','Y'],['Y','Y','Y']],
            L: [['O','O','O'],['O','O','O'],['O','O','O']],
            R: [['R','R','R'],['R','R','R'],['R','R','R']],
            F: [['G','G','G'],['G','G','G'],['G','G','G']],
            B: [['B','B','B'],['B','B','B'],['B','B','B']]
        };
        this.history = [];
        this.redoStack = [];
    }
    
    clone() {
        const newCube = new Cube();
        for (const face of Object.keys(this.faces)) {
            newCube.faces[face] = this.faces[face].map(row => [...row]);
        }
        return newCube;
    }
    
    rotateU(clockwise = true) {
        const temp = this.clone();
        if (clockwise) {
            this.faces.U = rotateFaceClockwise(temp.faces.U);
            const topRow = [...temp.faces.F[0], ...temp.faces.R[0], ...temp.faces.B[0], ...temp.faces.L[0]];
            const shifted = rotateArray(topRow, 3);
            this.faces.F[0] = shifted.slice(0, 3);
            this.faces.R[0] = shifted.slice(3, 6);
            this.faces.B[0] = shifted.slice(6, 9);
            this.faces.L[0] = shifted.slice(9, 12);
        } else {
            this.faces.U = rotateFaceCounterClockwise(temp.faces.U);
            const topRow = [...temp.faces.F[0], ...temp.faces.R[0], ...temp.faces.B[0], ...temp.faces.L[0]];
            const shifted = rotateArray(topRow, -3);
            this.faces.F[0] = shifted.slice(0, 3);
            this.faces.R[0] = shifted.slice(3, 6);
            this.faces.B[0] = shifted.slice(6, 9);
            this.faces.L[0] = shifted.slice(9, 12);
        }
    }
    
    rotateD(clockwise = true) {
        const temp = this.clone();
        if (clockwise) {
            this.faces.D = rotateFaceClockwise(temp.faces.D);
            const bottomRow = [...temp.faces.F[2], ...temp.faces.L[2], ...temp.faces.B[2], ...temp.faces.R[2]];
            const shifted = rotateArray(bottomRow, 3);
            this.faces.F[2] = shifted.slice(0, 3);
            this.faces.L[2] = shifted.slice(3, 6);
            this.faces.B[2] = shifted.slice(6, 9);
            this.faces.R[2] = shifted.slice(9, 12);
        } else {
            this.faces.D = rotateFaceCounterClockwise(temp.faces.D);
            const bottomRow = [...temp.faces.F[2], ...temp.faces.L[2], ...temp.faces.B[2], ...temp.faces.R[2]];
            const shifted = rotateArray(bottomRow, -3);
            this.faces.F[2] = shifted.slice(0, 3);
            this.faces.L[2] = shifted.slice(3, 6);
            this.faces.B[2] = shifted.slice(6, 9);
            this.faces.R[2] = shifted.slice(9, 12);
        }
    }
    
    rotateL(clockwise = true) {
        const temp = this.clone();
        if (clockwise) {
            this.faces.L = rotateFaceClockwise(temp.faces.L);
            const leftCol = [
                temp.faces.U[0][0], temp.faces.U[1][0], temp.faces.U[2][0],
                temp.faces.F[0][0], temp.faces.F[1][0], temp.faces.F[2][0],
                temp.faces.D[0][0], temp.faces.D[1][0], temp.faces.D[2][0],
                temp.faces.B[2][0], temp.faces.B[1][0], temp.faces.B[0][0]
            ];
            const shifted = rotateArray(leftCol, 3);
            this.faces.U[0][0] = shifted[0]; this.faces.U[1][0] = shifted[1]; this.faces.U[2][0] = shifted[2];
            this.faces.F[0][0] = shifted[3]; this.faces.F[1][0] = shifted[4]; this.faces.F[2][0] = shifted[5];
            this.faces.D[0][0] = shifted[6]; this.faces.D[1][0] = shifted[7]; this.faces.D[2][0] = shifted[8];
            this.faces.B[2][0] = shifted[9]; this.faces.B[1][0] = shifted[10]; this.faces.B[0][0] = shifted[11];
        } else {
            this.faces.L = rotateFaceCounterClockwise(temp.faces.L);
            const leftCol = [
                temp.faces.U[0][0], temp.faces.U[1][0], temp.faces.U[2][0],
                temp.faces.B[2][0], temp.faces.B[1][0], temp.faces.B[0][0],
                temp.faces.D[0][0], temp.faces.D[1][0], temp.faces.D[2][0],
                temp.faces.F[0][0], temp.faces.F[1][0], temp.faces.F[2][0]
            ];
            const shifted = rotateArray(leftCol, 3);
            this.faces.U[0][0] = shifted[0]; this.faces.U[1][0] = shifted[1]; this.faces.U[2][0] = shifted[2];
            this.faces.B[2][0] = shifted[3]; this.faces.B[1][0] = shifted[4]; this.faces.B[0][0] = shifted[5];
            this.faces.D[0][0] = shifted[6]; this.faces.D[1][0] = shifted[7]; this.faces.D[2][0] = shifted[8];
            this.faces.F[0][0] = shifted[9]; this.faces.F[1][0] = shifted[10]; this.faces.F[2][0] = shifted[11];
        }
    }
    
    rotateR(clockwise = true) {
        const temp = this.clone();
        if (clockwise) {
            this.faces.R = rotateFaceClockwise(temp.faces.R);
            const rightCol = [
                temp.faces.U[0][2], temp.faces.U[1][2], temp.faces.U[2][2],
                temp.faces.B[0][2], temp.faces.B[1][2], temp.faces.B[2][2],
                temp.faces.D[0][2], temp.faces.D[1][2], temp.faces.D[2][2],
                temp.faces.F[0][2], temp.faces.F[1][2], temp.faces.F[2][2]
            ];
            const shifted = rotateArray(rightCol, 3);
            this.faces.U[0][2] = shifted[0]; this.faces.U[1][2] = shifted[1]; this.faces.U[2][2] = shifted[2];
            this.faces.B[0][2] = shifted[3]; this.faces.B[1][2] = shifted[4]; this.faces.B[2][2] = shifted[5];
            this.faces.D[0][2] = shifted[6]; this.faces.D[1][2] = shifted[7]; this.faces.D[2][2] = shifted[8];
            this.faces.F[0][2] = shifted[9]; this.faces.F[1][2] = shifted[10]; this.faces.F[2][2] = shifted[11];
        } else {
            this.faces.R = rotateFaceCounterClockwise(temp.faces.R);
            const rightCol = [
                temp.faces.U[0][2], temp.faces.U[1][2], temp.faces.U[2][2],
                temp.faces.F[0][2], temp.faces.F[1][2], temp.faces.F[2][2],
                temp.faces.D[0][2], temp.faces.D[1][2], temp.faces.D[2][2],
                temp.faces.B[0][2], temp.faces.B[1][2], temp.faces.B[2][2]
            ];
            const shifted = rotateArray(rightCol, 3);
            this.faces.U[0][2] = shifted[0]; this.faces.U[1][2] = shifted[1]; this.faces.U[2][2] = shifted[2];
            this.faces.F[0][2] = shifted[3]; this.faces.F[1][2] = shifted[4]; this.faces.F[2][2] = shifted[5];
            this.faces.D[0][2] = shifted[6]; this.faces.D[1][2] = shifted[7]; this.faces.D[2][2] = shifted[8];
            this.faces.B[0][2] = shifted[9]; this.faces.B[1][2] = shifted[10]; this.faces.B[2][2] = shifted[11];
        }
    }
    
    rotateF(clockwise = true) {
        const temp = this.clone();
        if (clockwise) {
            this.faces.F = rotateFaceClockwise(temp.faces.F);
            const frontSurround = [
                temp.faces.U[2][0], temp.faces.U[2][1], temp.faces.U[2][2],
                temp.faces.R[0][0], temp.faces.R[1][0], temp.faces.R[2][0],
                [...temp.faces.D[0]].reverse(),
                temp.faces.L[2][2], temp.faces.L[1][2], temp.faces.L[0][2]
            ].flat();
            const shifted = rotateArray(frontSurround, 3);
            this.faces.U[2][0] = shifted[0]; this.faces.U[2][1] = shifted[1]; this.faces.U[2][2] = shifted[2];
            this.faces.R[0][0] = shifted[3]; this.faces.R[1][0] = shifted[4]; this.faces.R[2][0] = shifted[5];
            this.faces.D[0] = shifted.slice(6, 9).reverse();
            this.faces.L[2][2] = shifted[9]; this.faces.L[1][2] = shifted[10]; this.faces.L[0][2] = shifted[11];
        } else {
            this.faces.F = rotateFaceCounterClockwise(temp.faces.F);
            const frontSurround = [
                temp.faces.U[2][0], temp.faces.U[2][1], temp.faces.U[2][2],
                temp.faces.L[2][2], temp.faces.L[1][2], temp.faces.L[0][2],
                [...temp.faces.D[0]].reverse(),
                temp.faces.R[0][0], temp.faces.R[1][0], temp.faces.R[2][0]
            ].flat();
            const shifted = rotateArray(frontSurround, 3);
            this.faces.U[2][0] = shifted[0]; this.faces.U[2][1] = shifted[1]; this.faces.U[2][2] = shifted[2];
            this.faces.L[2][2] = shifted[3]; this.faces.L[1][2] = shifted[4]; this.faces.L[0][2] = shifted[5];
            this.faces.D[0] = shifted.slice(6, 9).reverse();
            this.faces.R[0][0] = shifted[9]; this.faces.R[1][0] = shifted[10]; this.faces.R[2][0] = shifted[11];
        }
    }
    
    rotateB(clockwise = true) {
        const temp = this.clone();
        if (clockwise) {
            this.faces.B = rotateFaceClockwise(temp.faces.B);
            const backSurround = [
                temp.faces.U[0][0], temp.faces.U[0][1], temp.faces.U[0][2],
                temp.faces.L[0][0], temp.faces.L[1][0], temp.faces.L[2][0],
                [...temp.faces.D[2]].reverse(),
                temp.faces.R[2][2], temp.faces.R[1][2], temp.faces.R[0][2]
            ].flat();
            const shifted = rotateArray(backSurround, 3);
            this.faces.U[0][0] = shifted[0]; this.faces.U[0][1] = shifted[1]; this.faces.U[0][2] = shifted[2];
            this.faces.L[0][0] = shifted[3]; this.faces.L[1][0] = shifted[4]; this.faces.L[2][0] = shifted[5];
            this.faces.D[2] = shifted.slice(6, 9).reverse();
            this.faces.R[2][2] = shifted[9]; this.faces.R[1][2] = shifted[10]; this.faces.R[0][2] = shifted[11];
        } else {
            this.faces.B = rotateFaceCounterClockwise(temp.faces.B);
            const backSurround = [
                temp.faces.U[0][0], temp.faces.U[0][1], temp.faces.U[0][2],
                temp.faces.R[2][2], temp.faces.R[1][2], temp.faces.R[0][2],
                [...temp.faces.D[2]].reverse(),
                temp.faces.L[0][0], temp.faces.L[1][0], temp.faces.L[2][0]
            ].flat();
            const shifted = rotateArray(backSurround, 3);
            this.faces.U[0][0] = shifted[0]; this.faces.U[0][1] = shifted[1]; this.faces.U[0][2] = shifted[2];
            this.faces.R[2][2] = shifted[3]; this.faces.R[1][2] = shifted[4]; this.faces.R[0][2] = shifted[5];
            this.faces.D[2] = shifted.slice(6, 9).reverse();
            this.faces.L[0][0] = shifted[9]; this.faces.L[1][0] = shifted[10]; this.faces.L[2][0] = shifted[11];
        }
    }
    
    executeMove(move) {
        const isClockwise = !move.includes("'");
        const face = move.replace("'", "");
        
        switch(face) {
            case 'U': this.rotateU(isClockwise); break;
            case 'D': this.rotateD(isClockwise); break;
            case 'L': this.rotateL(isClockwise); break;
            case 'R': this.rotateR(isClockwise); break;
            case 'F': this.rotateF(isClockwise); break;
            case 'B': this.rotateB(isClockwise); break;
        }
    }
    
    isSolved() {
        for (const face of Object.values(this.faces)) {
            const color = face[0][0];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (face[i][j] !== color) return false;
                }
            }
        }
        return true;
    }
    
    getStateString() {
        return Object.values(this.faces).map(face => face.flat().join('')).join('');
    }
}

function rotateFaceClockwise(face) {
    const newFace = [[], [], []];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            newFace[j][2 - i] = face[i][j];
        }
    }
    return newFace;
}

function rotateFaceCounterClockwise(face) {
    const newFace = [[], [], []];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            newFace[2 - j][i] = face[i][j];
        }
    }
    return newFace;
}

function rotateArray(arr, n) {
    n = n % arr.length;
    return [...arr.slice(-n), ...arr.slice(0, -n)];
}

export { Cube };