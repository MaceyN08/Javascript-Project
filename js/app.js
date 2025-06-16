class EnhancedBattleship {
            constructor() {
                this.boardSize = 10;
                this.ships = [
                    { name: 'Carrier', size: 5, symbol: '🚢' },
                    { name: 'Battleship', size: 4, symbol: '🛥️' },
                    { name: 'Cruiser', size: 3, symbol: '⛵' },
                    { name: 'Submarine', size: 3, symbol: '🚤' },
                    { name: 'Destroyer', size: 2, symbol: '🛶' }
                ];
                
                this.playerBoard = Array(10).fill().map(() => Array(10).fill(0));
                this.enemyBoard = Array(10).fill().map(() => Array(10).fill(0));
                this.enemyShips = Array(10).fill().map(() => Array(10).fill(0));
                
                this.gameStats = {
                    shots: 0,
                    hits: 0,
                    sunk: 0,
                    sonarScans: 2,
                    airStrikes: 1
                };
                
                this.gameOver = false;
                this.sonarMode = false;
                this.airStrikeMode = false;
                
                this.initGame();
            }
            
            initGame() {
                this.createBoards();
                this.placePlayerShips();
                this.placeEnemyShips();
                this.updateStats();
                this.updateMessage("Game ready! Click on enemy waters to fire!");
            }
            
            createBoards() {
                const playerBoardEl = document.getElementById('playerBoard');
                const enemyBoardEl = document.getElementById('enemyBoard');
                
                playerBoardEl.innerHTML = '';
                enemyBoardEl.innerHTML = '';
                
                for (let i = 0; i < 100; i++) {
                    const playerCell = this.createCell(i, 'player');
                    const enemyCell = this.createCell(i, 'enemy');
                    
                    playerBoardEl.appendChild(playerCell);
                    enemyBoardEl.appendChild(enemyCell);
                }
            }
            
            createCell(index, type) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.index = index;
                cell.dataset.type = type;
                
                if (type === 'enemy') {
                    cell.addEventListener('click', (e) => this.handleEnemyClick(e));
                }
                
                return cell;
            }
            
            placePlayerShips() {
                for (const ship of this.ships) {
                    this.placeShipRandomly(this.playerBoard, ship.size);
                }
                this.updatePlayerBoard();
            }
            
            placeEnemyShips() {
                for (const ship of this.ships) {
                    this.placeShipRandomly(this.enemyShips, ship.size);
                }
            }
            
            placeShipRandomly(board, size) {
                let placed = false;
                let attempts = 0;
                
                while (!placed && attempts < 100) {
                    const horizontal = Math.random() < 0.5;
                    const row = Math.floor(Math.random() * 10);
                    const col = Math.floor(Math.random() * 10);
                    
                    if (this.canPlaceShip(board, row, col, size, horizontal)) {
                        this.placeShip(board, row, col, size, horizontal);
                        placed = true;
                    }
                    attempts++;
                }
            }
            
            canPlaceShip(board, row, col, size, horizontal) {
                for (let i = 0; i < size; i++) {
                    const r = horizontal ? row : row + i;
                    const c = horizontal ? col + i : col;
                    
                    if (r >= 10 || c >= 10 || board[r][c] !== 0) {
                        return false;
                    }
                }
                return true;
            }
            
            placeShip(board, row, col, size, horizontal) {
                for (let i = 0; i < size; i++) {
                    const r = horizontal ? row : row + i;
                    const c = horizontal ? col + i : col;
                    board[r][c] = size;
                }
            }
            
            updatePlayerBoard() {
                const cells = document.querySelectorAll('[data-type="player"]');
                cells.forEach((cell, index) => {
                    const row = Math.floor(index / 10);
                    const col = index % 10;
                    
                    if (this.playerBoard[row][col] > 0) {
                        cell.classList.add('ship');
                    }
                });
            }
            
            handleEnemyClick(e) {
                if (this.gameOver) return;
                
                const cell = e.target;
                const index = parseInt(cell.dataset.index);
                const row = Math.floor(index / 10);
                const col = index % 10;
                
                if (this.enemyBoard[row][col] !== 0) return; // Already fired here
                
                if (this.sonarMode) {
                    this.performSonarScan(row, col);
                    return;
                }
                
                if (this.airStrikeMode) {
                    this.performAirStrike(row, col);
                    return;
                }
                
                this.fireShot(row, col);
            }
            
            fireShot(row, col) {
                this.gameStats.shots++;
                
                const hit = this.enemyShips[row][col] > 0;
                
                if (hit) {
                    this.enemyBoard[row][col] = 2; // Hit
                    this.gameStats.hits++;
                    
                    const cell = document.querySelector(`[data-type="enemy"][data-index="${row * 10 + col}"]`);
                    cell.classList.add('hit');
                    
                    if (this.isShipSunk(row, col)) {
                        this.markShipAsSunk(row, col);
                        this.gameStats.sunk++;
                        this.updateMessage(`Direct hit! Enemy ship destroyed! 💥`);
                        
                        if (this.gameStats.sunk === 5) {
                            this.endGame(true);
                        }
                    } else {
                        this.updateMessage(`Direct hit! Keep firing! 🎯`);
                    }
                } else {
                    this.enemyBoard[row][col] = 1; // Miss
                    const cell = document.querySelector(`[data-type="enemy"][data-index="${row * 10 + col}"]`);
                    cell.classList.add('miss');
                    this.updateMessage(`Miss! Try again! 🌊`);
                }
                
                this.updateStats();
            }
            
            isShipSunk(row, col) {
                const shipSize = this.enemyShips[row][col];
                const directions = [[-1,0], [1,0], [0,-1], [0,1]];
                
                // Find all parts of this ship
                const shipParts = [[row, col]];
                const visited = new Set();
                visited.add(`${row},${col}`);
                
                const queue = [[row, col]];
                
                while (queue.length > 0) {
                    const [r, c] = queue.shift();
                    
                    for (const [dr, dc] of directions) {
                        const nr = r + dr;
                        const nc = c + dc;
                        const key = `${nr},${nc}`;
                        
                        if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && 
                            !visited.has(key) && 
                            this.enemyShips[nr][nc] === shipSize) {
                            visited.add(key);
                            shipParts.push([nr, nc]);
                            queue.push([nr, nc]);
                        }
                    }
                }
                
                // Check if all parts are hit
                return shipParts.every(([r, c]) => this.enemyBoard[r][c] === 2);
            }
            
            markShipAsSunk(row, col) {
                const shipSize = this.enemyShips[row][col];
                const directions = [[-1,0], [1,0], [0,-1], [0,1]];
                
                const shipParts = [[row, col]];
                const visited = new Set();
                visited.add(`${row},${col}`);
                
                const queue = [[row, col]];
                
                while (queue.length > 0) {
                    const [r, c] = queue.shift();
                    
                    for (const [dr, dc] of directions) {
                        const nr = r + dr;
                        const nc = c + dc;
                        const key = `${nr},${nc}`;
                        
                        if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && 
                            !visited.has(key) && 
                            this.enemyShips[nr][nc] === shipSize) {
                            visited.add(key);
                            shipParts.push([nr, nc]);
                            queue.push([nr, nc]);
                        }
                    }
                }
                
                // Mark all parts as sunk
                shipParts.forEach(([r, c]) => {
                    const cell = document.querySelector(`[data-type="enemy"][data-index="${r * 10 + c}"]`);
                    cell.classList.remove('hit');
                    cell.classList.add('sunk');
                });
            }
            
            useSonar() {
                if (this.gameStats.sonarScans <= 0 || this.gameOver) return;
                
                this.sonarMode = true;
                this.updateMessage("Sonar activated! Click an area to scan for enemy ships! ⚡");
                document.getElementById('sonarBtn').style.opacity = '0.5';
            }
            
            performSonarScan(row, col) {
                this.sonarMode = false;
                this.gameStats.sonarScans--;
                
                // Scan 3x3 area around clicked cell
                let shipsFound = 0;
                
                for (let r = Math.max(0, row - 1); r <= Math.min(9, row + 1); r++) {
                    for (let c = Math.max(0, col - 1); c <= Math.min(9, col + 1); c++) {
                        if (this.enemyShips[r][c] > 0 && this.enemyBoard[r][c] === 0) {
                            const cell = document.querySelector(`[data-type="enemy"][data-index="${r * 10 + c}"]`);
                            cell.classList.add('sonar');
                            shipsFound++;
                            
                            // Remove sonar effect after 3 seconds
                            setTimeout(() => {
                                cell.classList.remove('sonar');
                            }, 3000);
                        }
                    }
                }
                
                this.updateMessage(`Sonar scan complete! ${shipsFound} ship parts detected in the area! 🎯`);
                document.getElementById('sonarBtn').style.opacity = this.gameStats.sonarScans > 0 ? '1' : '0.3';
                this.updateStats();
            }
            
            useAirStrike() {
                if (this.gameStats.airStrikes <= 0 || this.gameOver) return;
                
                this.airStrikeMode = true;
                this.updateMessage("Air strike ready! Click to target a 3x3 area! 💥");
                document.getElementById('airStrikeBtn').style.opacity = '0.5';
            }
            
            performAirStrike(row, col) {
                this.airStrikeMode = false;
                this.gameStats.airStrikes--;
                this.gameStats.shots++;
                
                let hits = 0;
                
                // Strike 3x3 area
                for (let r = Math.max(0, row - 1); r <= Math.min(9, row + 1); r++) {
                    for (let c = Math.max(0, col - 1); c <= Math.min(9, col + 1); c++) {
                        if (this.enemyBoard[r][c] === 0) { // Not fired here before
                            const hit = this.enemyShips[r][c] > 0;
                            const cell = document.querySelector(`[data-type="enemy"][data-index="${r * 10 + c}"]`);
                            
                            if (hit) {
                                this.enemyBoard[r][c] = 2;
                                cell.classList.add('hit');
                                hits++;
                                this.gameStats.hits++;
                                
                                if (this.isShipSunk(r, c)) {
                                    this.markShipAsSunk(r, c);
                                    this.gameStats.sunk++;
                                }
                            } else {
                                this.enemyBoard[r][c] = 1;
                                cell.classList.add('miss');
                            }
                        }
                    }
                }
                
                this.updateMessage(`Air strike complete! ${hits} hits confirmed! 🚀`);
                document.getElementById('airStrikeBtn').style.opacity = '0.3';
                
                if (this.gameStats.sunk === 5) {
                    this.endGame(true);
                }
                
                this.updateStats();
            }
            
            updateStats() {
                document.getElementById('shots').textContent = this.gameStats.shots;
                document.getElementById('hits').textContent = this.gameStats.hits;
                document.getElementById('sunk').textContent = this.gameStats.sunk;
                document.getElementById('sonarCount').textContent = this.gameStats.sonarScans;
                document.getElementById('airStrikeCount').textContent = this.gameStats.airStrikes;
                
                const accuracy = this.gameStats.shots > 0 ? 
                    Math.round((this.gameStats.hits / this.gameStats.shots) * 100) : 0;
                document.getElementById('accuracy').textContent = accuracy + '%';
            }
            
            updateMessage(msg) {
                document.getElementById('message').textContent = msg;
            }
            
            endGame(won) {
                this.gameOver = true;
                
                if (won) {
                    this.updateMessage(`🎉 Victory! You've sunk all enemy ships! 
                        Final stats: ${this.gameStats.shots} shots, ${this.gameStats.hits} hits, 
                        ${Math.round((this.gameStats.hits / this.gameStats.shots) * 100)}% accuracy!`);
                } else {
                    this.updateMessage("💀 Defeat! Your fleet has been destroyed!");
                }
            }
        }
        
        let game;
        
        function newGame() {
            game = new EnhancedBattleship();
            document.getElementById('sonarBtn').style.opacity = '1';
            document.getElementById('airStrikeBtn').style.opacity = '1';
        }
        
        function useSonar() {
            if (game) game.useSonar();
        }
        
        function useAirStrike() {
            if (game) game.useAirStrike();
        }
        
        function showRules() {
            alert(`🎮 Enhanced Battleship Rules:

🎯 OBJECTIVE: Sink all 5 enemy ships before they sink yours!

🚢 SHIPS:
• Carrier (5 spaces) 🚢
• Battleship (4 spaces) 🛥️  
• Cruiser (3 spaces) ⛵
• Submarine (3 spaces) 🚤
• Destroyer (2 spaces) 🛶

⚡ SPECIAL ABILITIES:
• Sonar Scan (2 uses): Reveals ship locations in a 3x3 area
• Air Strike (1 use): Attacks entire 3x3 area at once

🎲 HOW TO PLAY:
1. Click on enemy waters to fire
2. Red = Hit, Gray = Miss, Purple = Sunk
3. Use special abilities strategically
4. Sink all ships to win!

Good luck, Admiral! ⚓`);
        }
        
        // Start the game
        newGame();