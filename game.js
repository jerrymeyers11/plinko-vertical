// --- (Top of file is unchanged, exactly as you provided) ---
var Engine = Matter.Engine, Render = Matter.Render, Runner = Matter.Runner, Bodies = Matter.Bodies, Composite = Matter.Composite, Events = Matter.Events, Body = Matter.Body;
const BASE_WIDTH = 2160; const BASE_HEIGHT = 3840; const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT; const availableWidth = window.innerWidth; const availableHeight = window.innerHeight; const widthFromHeight = availableHeight * ASPECT_RATIO; const heightFromWidth = availableWidth / ASPECT_RATIO; let newCanvasWidth; if (heightFromWidth > availableHeight) { newCanvasWidth = widthFromHeight; } else { newCanvasWidth = availableWidth; } const NEW_CANVAS_WIDTH = newCanvasWidth; const NEW_CANVAS_HEIGHT = NEW_CANVAS_WIDTH / ASPECT_RATIO; const SCALE_FACTOR = NEW_CANVAS_WIDTH / BASE_WIDTH;
const PLAY_AREA_X = 250 * SCALE_FACTOR; const PLAY_AREA_Y = 700 * SCALE_FACTOR; const PLAY_AREA_WIDTH = 1660 * SCALE_FACTOR; const PLAY_AREA_HEIGHT = 2440 * SCALE_FACTOR;

// --- GAME SETTINGS (Updated with Phase 3) ---
const gameSettings = {
    phase1Values: [1000, 250, 500, 100, 750, 250, 750, 100, 500, 250],
    phase2BaseValues: [1000, 250, 500, 100, 750, 250, 750, 100, 500, 250],
    phase2NegativeValues: [-100, -250, -500, -750],
    phase2MinNegatives: 3,
    phase2MaxNegatives: 5,
    // --- NEW ---
    phase3BaseValues: [1000, 250, 500, 100, 750, 250, 750, 100, 500, 250],
    phase3BadIcons: ['❌', '💣'],
    phase3MinBadIcons: 2,
    phase3MaxBadIcons: 5,
};
// --- (The rest of the setup is unchanged, exactly as you provided) ---
var engine = Engine.create(); var world = engine.world; engine.timing.timeScale = SCALE_FACTOR; world.gravity.y = 3.5; var render = Render.create({ element: document.getElementById('canvas-container'), engine: engine, options: { width: NEW_CANVAS_WIDTH, height: NEW_CANVAS_HEIGHT, wireframes: false, background: 'transparent' } }); Render.run(render); var runner = Runner.create(); Runner.run(runner, engine);
let puck = null; let isPuckInPlay = false; let isTurnInProgress = false; let puckHasLanded = false; let turnScore = 0; let roundCounter = 0; let gamePhase = 1; let slotValues = [];
const scoreDisplay = document.getElementById('score-display'); 
const scoreContainer = document.getElementById('score-container');

// Position score container using scaled values
scoreContainer.style.top = (145 * SCALE_FACTOR) + 'px';
scoreContainer.style.left = (1580 * SCALE_FACTOR) + 'px';
const labelsContainer = document.getElementById('labels-container');
const modal = document.getElementById('modal'); const modalMessage = document.getElementById('modal-message'); const modalButton = document.getElementById('modal-button');
const pegs = []; const rows = 16; const spacing = PLAY_AREA_WIDTH / 9; const pegRadius = spacing * 0.1; const startYOffset = PLAY_AREA_Y; const leftEdgePoints = []; const rightEdgePoints = []; const lastRowPegXs = []; const puckRadius = spacing * 0.35; for (let i = 0; i < rows; i++) { const numPegs = (i % 2 === 0) ? 9 : 10; const y = startYOffset + (i * spacing); const rowWidth = (numPegs - 1) * spacing; const startX = PLAY_AREA_X + (PLAY_AREA_WIDTH - rowWidth) / 2; leftEdgePoints.push({ x: startX, y: y }); rightEdgePoints.push({ x: startX + rowWidth, y: y }); for (let j = 0; j < numPegs; j++) { const x = startX + j * spacing; const peg = Bodies.circle(x, y, pegRadius, { isStatic: true, restitution: 0.5, friction: 0.1, render: { fillStyle: '#333' } }); pegs.push(peg); if (i === rows - 1) { lastRowPegXs.push(x); } } } Composite.add(world, pegs); const lastPegY = leftEdgePoints[leftEdgePoints.length - 1].y; const dividerHeight = spacing; const slotsY = lastPegY + (spacing * 2); const outerWallY = slotsY - dividerHeight / 2; const wallOffset = spacing; const wallThickness = pegRadius; const wallSegments = []; const finalPointY = lastPegY + spacing; const finalRowWidth = (9 - 1) * spacing; const finalStartX = PLAY_AREA_X + (PLAY_AREA_WIDTH - finalRowWidth) / 2; leftEdgePoints.push({ x: finalStartX, y: finalPointY }); rightEdgePoints.push({ x: finalStartX + finalRowWidth, y: finalPointY }); function createWallFromPoints(points, side) { for (let i = 0; i < points.length - 1; i++) { const p1 = points[i]; const p2 = points[i+1]; const offset = (side === 'left') ? -wallOffset : wallOffset; const midX = (p1.x + p2.x) / 2 + offset; const midY = (p1.y + p2.y) / 2; const deltaX = p2.x - p1.x; const deltaY = p2.y - p1.y; const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY); const angle = Math.atan2(deltaY, deltaX); const segment = Bodies.rectangle(midX, midY, length, wallThickness, { isStatic: true, angle: angle, render: { visible: false } }); wallSegments.push(segment); } } createWallFromPoints(leftEdgePoints, 'left'); createWallFromPoints(rightEdgePoints, 'right'); Composite.add(world, wallSegments);
const extendedWallHeight = PLAY_AREA_Y; // Height to extend upward
const leftTopWall = Bodies.rectangle(
    leftEdgePoints[0].x - wallOffset, 
    PLAY_AREA_Y / 2, 
    wallThickness, 
    extendedWallHeight,
    { isStatic: true, render: { visible: false } }
);

const rightTopWall = Bodies.rectangle(
    rightEdgePoints[0].x + wallOffset, 
    PLAY_AREA_Y / 2, 
    wallThickness, 
    extendedWallHeight,
    { isStatic: true, render: { visible: false } }
);

Composite.add(world, [leftTopWall, rightTopWall]);
const prizeSlots = []; const numPrizeSlots = 10; const leftOuterWallX = lastRowPegXs[0] - spacing / 2; const rightOuterWallX = lastRowPegXs[lastRowPegXs.length - 1] + spacing / 2; const slotsAreaWidth = rightOuterWallX - leftOuterWallX; const slotWidth = slotsAreaWidth / numPrizeSlots; const slotsStartX = leftOuterWallX;
for (let i = 1; i < numPrizeSlots; i++) { const x = slotsStartX + (i * slotWidth); const divider = Bodies.rectangle(x, outerWallY, wallThickness, dividerHeight, { isStatic: true, render: { fillStyle: '#555' } }); prizeSlots.push(divider); }
const leftOuterWall = Bodies.rectangle(slotsStartX, outerWallY, wallThickness, dividerHeight, { isStatic: true, render: { fillStyle: '#555' } }); const rightOuterWall = Bodies.rectangle(slotsStartX + slotsAreaWidth, outerWallY, wallThickness, dividerHeight, { isStatic: true, render: { fillStyle: '#555' } }); prizeSlots.push(leftOuterWall, rightOuterWall);
for (let i = 0; i < numPrizeSlots; i++) { const x = slotsStartX + (i * slotWidth) + (slotWidth / 2); const sensor = Bodies.rectangle(x, slotsY, slotWidth, 10 * SCALE_FACTOR, { isStatic: true, isSensor: true, render: { visible: false }, label: 'slot-' + i, friction: 1, restitution: 0 }); prizeSlots.push(sensor); } Composite.add(world, prizeSlots);

// --- HELPER FUNCTIONS ---
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function generateSlotValues() {
    if (gamePhase === 3) {
        let newValues = [...gameSettings.phase3BaseValues];
        const numBadIcons = getRandomInt(gameSettings.phase3MinBadIcons, gameSettings.phase3MaxBadIcons);
        let badIconsToAdd = [];
        for (let i = 0; i < numBadIcons; i++) { const icon = gameSettings.phase3BadIcons[getRandomInt(0, gameSettings.phase3BadIcons.length - 1)]; badIconsToAdd.push(icon); }
        for (let i = 0; i < numBadIcons; i++) { newValues[i] = badIconsToAdd[i]; }
        slotValues = newValues;
    } else if (gamePhase === 2) {
        let newValues = [...gameSettings.phase2BaseValues];
        const numNegatives = getRandomInt(gameSettings.phase2MinNegatives, gameSettings.phase2MaxNegatives);
        let negativesToAdd = [...gameSettings.phase2NegativeValues];
        shuffleArray(negativesToAdd);
        for (let i = 0; i < numNegatives; i++) { newValues[i] = negativesToAdd[i]; }
        slotValues = newValues;
    } else {
        slotValues = [...gameSettings.phase1Values];
    }
    shuffleArray(slotValues);
}
function updateAndDisplaySlots() {
    labelsContainer.innerHTML = ''; labelsContainer.style.left = `${slotsStartX}px`; labelsContainer.style.width = `${slotsAreaWidth}px`; labelsContainer.style.bottom = `${NEW_CANVAS_HEIGHT - slotsY - (-10 * SCALE_FACTOR)}px`;
    slotValues.forEach(value => {
        const labelDiv = document.createElement('div'); labelDiv.classList.add('slot-label');
        const textSpan = document.createElement('span'); textSpan.textContent = value;
        if (value < 0 || value === '❌' || value === '💣') { textSpan.style.color = '#d32f2f'; textSpan.style.fontSize = `${spacing * 0.324}px`; }
        else { textSpan.style.fontSize = `${spacing * 0.324}px`; }
        labelDiv.style.width = `${slotWidth}px`; labelDiv.appendChild(textSpan); labelsContainer.appendChild(labelDiv);
    });
}
function showBigScreenModal(message) { modalMessage.textContent = message; modalButton.style.display = 'none'; modal.classList.remove('hidden'); }
function hideBigScreenModal() { modal.classList.add('hidden'); }
let animationFrameId = null; let animationStartTime = 0;
function animatePuck() { const elapsed = Date.now() - animationStartTime; const xRange = PLAY_AREA_WIDTH - (puckRadius * 2); const newX = PLAY_AREA_X + puckRadius + (xRange / 2) * (1 + Math.sin(elapsed / 1000)); if (puck) { Body.setPosition(puck, { x: newX, y: puck.position.y }); animationFrameId = requestAnimationFrame(animatePuck); } }

// --- GAME FUNCTIONS (Your working versions, with Phase 3 logic carefully added) ---
function startGame() { isTurnInProgress = true; roundCounter = 1; gamePhase = 1; turnScore = 0; sendUpdateToController({ score: 0 }); generateSlotValues(); updateAndDisplaySlots(); preparePuckDrop(); }
function preparePuckDrop() {
    if (puck) { Composite.remove(world, puck); }
    isPuckInPlay = false; 
    puckHasLanded = false;

    sendUpdateToController({ 
        showStart: false, 
        showDrop: true, 
        showContinue: false 
    });
    
    // FIXED: Only send the 3 original parameters during puck drop
    sendUpdateToController({ 
        showStart: false, 
        showDrop: true, 
        showContinue: false 
    });
    
    const nativePuckSize = 45;
    const puckSpriteScale = (puckRadius * 2) / nativePuckSize;
    const puckStartY = 580 * SCALE_FACTOR;
    puck = Bodies.circle(PLAY_AREA_X + PLAY_AREA_WIDTH / 2, puckStartY, puckRadius, {
        isStatic: true, restitution: 0.8, friction: 0.03, frictionAir: 0.01,
        render: { sprite: { texture: 'puck.png', xScale: puckSpriteScale, yScale: puckSpriteScale } },
        label: 'puck'
    });
    Composite.add(world, puck);
    animationStartTime = Date.now();
    animatePuck();
}
function dropPuck() { 
    if (!puck || !isTurnInProgress) return; 
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; } 
    isPuckInPlay = true; 
    Body.setStatic(puck, false); 
    // FIXED: Only send the 3 original parameters
    sendUpdateToController({ 
        showStart: false, 
        showDrop: false, 
        showContinue: false 
    }); 
}
function prepareNextRound() { roundCounter++; if (roundCounter >= 6 && roundCounter <= 10) { gamePhase = 2; } else if (roundCounter >= 11) { gamePhase = 3; } generateSlotValues(); updateAndDisplaySlots(); }
function handleScore(value) {
    // Handle phase 3 special values
    if (value === '❌') { 
        gameOver('safeExit'); 
        return; 
    }
    if (value === '💣') { 
        turnScore = 0; 
        gameOver('wipeout'); 
        return; 
    }
    
    // Add to score
    turnScore += value;
    sendUpdateToController({ score: turnScore });
    
    // Show appropriate buttons based on round and phase
    if (roundCounter === 5) {
        showBigScreenModal("Beware! Red values will be subtracted from your score.");
        sendUpdateToController({ showContinue: true });
    } else if (roundCounter === 10) {
        showBigScreenModal("HIGH STAKES! Avoid ❌ and 💣. ❌ ends the game but saves your score. 💣 wipes your score and ends the game!");
        sendUpdateToController({ showContinue: true }); // Changed from showRiskIt/showBank
    } else if (gamePhase === 3) {
        // Phase 3: After landing, show continue to preview next round
        sendUpdateToController({ showContinue: true });
    } else {
        sendUpdateToController({ showContinue: true });
    }
}
function gameOver(reason) {
    isTurnInProgress = false; let message = '';
    if (reason === 'bank') { message = `Game Over! You banked ${turnScore} points!`; }
    else if (reason === 'safeExit') { message = `Game Over! You hit ❌ and banked ${turnScore} points!`; }
    else { message = `WIPEOUT! You hit 💣 and lost everything!`; }
    showBigScreenModal(message);
    sendUpdateToController({ showModal: true, modalMessage: message, modalButtonText: "Play Again?", score: turnScore });
}
function resetGame() {
    isTurnInProgress = false;
    turnScore = 0; gamePhase = 1; roundCounter = 0;
    if (puck) { Composite.remove(world, puck); puck = null; }
    sendUpdateToController({ score: 0, showStart: true });
    labelsContainer.innerHTML = '';
}

// --- SOCKET.IO ---
const socket = io(); let roomId = ''; let serverIp = 'localhost';
socket.on('connect', () => { 
    console.log('GAME: Socket connected at', new Date().toISOString()); 
    socket.emit('createRoom'); 
});

// Connection monitoring for game screen
socket.on('disconnect', (reason) => {
    console.log('GAME: Disconnected at', new Date().toISOString(), 'reason:', reason);
});

socket.on('reconnect', (attemptNumber) => {
    console.log('GAME: Reconnected at', new Date().toISOString(), 'after', attemptNumber, 'attempts');
    // Re-create room
    socket.emit('createRoom');
});

socket.on('reconnect_error', (error) => {
    console.log('GAME: Reconnection failed at', new Date().toISOString(), 'error:', error);
});
socket.on('serverIp', (ip) => { serverIp = ip; });
socket.on('roomCreated', (id) => { 
    roomId = id; 
    const qrcodeElement = document.getElementById('qrcode'); 
    qrcodeElement.innerHTML = ""; 
    // Updated for production - will use your Railway domain
    const controllerUrl = `${window.location.origin}/controller.html?room=${roomId}`; 
    new QRCode(qrcodeElement, { text: controllerUrl, width: 256, height: 256 }); 
    
    // Add room code below QR for testing
    const roomCodeDiv = document.createElement('div');
    roomCodeDiv.style.marginTop = '10px';
    roomCodeDiv.style.fontSize = '24px';
    roomCodeDiv.style.fontWeight = 'bold';
    roomCodeDiv.style.color = '#333';
    roomCodeDiv.textContent = `Room Code: ${roomId}`;
    qrcodeElement.appendChild(roomCodeDiv);
});
socket.on('controllerConnected', () => { const qrContainer = document.getElementById('qr-container'); if (qrContainer) qrContainer.style.display = 'none'; sendUpdateToController({ showStart: true }); });
socket.on('command', (command) => {
    console.log('GAME: Received command at', new Date().toISOString(), 'command:', command);
    if (command === 'start') { startGame(); }
    if (command === 'drop') { dropPuck(); }
    if (command === 'continue') {
        if (!modal.classList.contains('hidden')) { 
            hideBigScreenModal(); 
        }
        // After round 10, transition to phase 3 decision
        if (roundCounter === 10) {
            // Transition to phase 3 - generate new slots and show risk/bank buttons
            prepareNextRound();  // This generates new slot values
            sendUpdateToController({ 
                showStart: false,
                showDrop: false, 
                showContinue: false,
                showRiskIt: true, 
                showBank: true 
            });
        } else if (gamePhase === 3) {
            // Phase 3: Generate new slots, show risk/bank decision
            prepareNextRound();  // Generates new slot values and displays them
            sendUpdateToController({ 
                showStart: false,
                showDrop: false, 
                showContinue: false,
                showRiskIt: true, 
                showBank: true 
            });  
        } else {
            prepareNextRound();
            preparePuckDrop();
        }
    }
    if (command === 'riskIt') {
        preparePuckDrop();
    }
    if (command === 'bank') {
        gameOver('bank');
    }
    // ADDED: Handle modal continue for "Play Again"
    if (command === 'modalContinue') {
        hideBigScreenModal();
        if (!isTurnInProgress) {
            resetGame();
            startGame();
        }
    }
});
function sendUpdateToController(data) { 
    console.log("GAME: Sending update at", new Date().toISOString(), "to room", roomId, "data:", data);
    if (scoreDisplay && data.score !== undefined) { scoreDisplay.textContent = `Score: ${data.score}`; }
    socket.emit('gameUpdate', { roomId, ...data }); 
    console.log("GAME: Update sent successfully");
}
modalButton.addEventListener('click', () => { hideBigScreenModal(); });

// --- Physics Events (Unchanged and working) ---
Events.on(engine, 'collisionStart', (event) => { if (puckHasLanded) return; const pairs = event.pairs; for (let i = 0; i < pairs.length; i++) { const pair = pairs[i]; let puckBody = null; let slotSensor = null; if (pair.bodyA.label === 'puck' && pair.bodyB.label.startsWith('slot-')) { puckBody = pair.bodyA; slotSensor = pair.bodyB; } else if (pair.bodyB.label === 'puck' && pair.bodyA.label.startsWith('slot-')) { puckBody = pair.bodyB; slotSensor = pair.bodyA; } if (puckBody && slotSensor) { puckHasLanded = true; isPuckInPlay = false; const slotIndex = parseInt(slotSensor.label.split('-')[1]); const value = slotValues[slotIndex]; handleScore(value); return; } } });