import { BasketballApp } from './src/application/BasketballApp.js';
import { CourtCanvas } from './src/presentation/CourtCanvas.js';
import { UIHandler } from './src/presentation/UIHandler.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('basketballCourt');
    
    const app = new BasketballApp();
    const courtCanvas = new CourtCanvas(canvas);
    const uiHandler = new UIHandler(app, canvas);
    
    app.initialize();
    courtCanvas.drawCourt();
    uiHandler.updateDisplay();
    uiHandler.updateCanvas(courtCanvas);
    
    setInterval(() => {
        uiHandler.updateCanvas(courtCanvas);
    }, 100);
});