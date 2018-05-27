cc.Class({
	extends: cc.Component,

	properties: {
		squarePrefab: cc.Prefab,
		rows: 10,
		cols: 10,
		mines: 10,
		squareSize: 35,
		lblSeconds: cc.Label,
		lblWin: cc.Label,
		audioExplode: {
			default: null,
			url: cc.AudioClip
		},
		audioWin: {
			default: null,
			url: cc.AudioClip
		},
		audioClick: {
			default: null,
			url: cc.AudioClip
		},
		audioFlag: {
			default: null,
			url: cc.AudioClip
		},
		audioOpening: {
			default: null,
			url: cc.AudioClip
		},
	},

	start() {
		this.seconds = -1;
		this.initTouchEvent();
		this.newGame();
	},

	newGame() {
		this.lblWin.node.active = false;
		this.seconds = -1;
		this.showSeconds(0);
		this.removeEventListener();
		this.removeLastSquares();
		this.squaresRevealed = 0; //squares the user has uncovered.  The game ends when a mine is clicked or when ((rows * cols) - mines) == squaresRevealed
		this.minesFlagged = 0; //squares the user has flagged as a mine
		this.initialize();
	},

	initialize() {
		this.setBoardSize();
		this.addEventListener();
		this.instantiateSquares();
		this.generateMines();
	},

	setBoardSize() {
		var width = this.cols * this.squareSize;
		var height = this.rows * this.squareSize;
		this.node.width = width;
		this.node.height = height;
	},

	removeLastSquares() {
		if (!this.map) {
			return;
		}

		for (var i = 0; i < this.rows; i++) {
			for (var j = 0; j < this.cols; j++) {
				this.node.removeChild(this.map[i][j].node);
			}
		}
	},

	instantiateSquares() {
		this.map = new Array(this.rows);
		for (var i = 0; i < this.rows; i++) {
			this.map[i] = new Array(this.cols);
		}
		var squareSize = this.squareSize;
		var width = this.cols * squareSize;
		var height = this.rows * squareSize;
		for (var i = 0; i < this.rows; i++) {
			for (var j = 0; j < this.cols; j++) {
				var square = cc.instantiate(this.squarePrefab).getComponent('Square');
				this.node.addChild(square.node);
				square.board = this;
				square.init(i, j, squareSize);
				var x = j * squareSize - width / 2 + squareSize / 2;
				var y = i * squareSize - height / 2 + squareSize / 2;
				square.node.setPosition(cc.p(x, y));
				this.map[i][j] = square;
			}
		}
		this.squaresRevealed = 0;
	},

	generateMines() {
		var n = this.mines;
		do {
			var mineLocation = Math.floor(Math.random(5000) * ((this.rows * this.cols) - 1))
			var row = Math.floor(mineLocation / this.cols);
			var col = mineLocation % this.cols;
			if (!this.map[row][col].isMine) {
				this.map[row][col].isMine = true;
				n -= 1;
			}
		} while (n > 0);
	},

	regenerate(currentSquare) {
		var row = currentSquare.row;
		var col = currentSquare.col;

		while (currentSquare.getSurroundingMineCount() > 0 || currentSquare.isMine) {
			for (var i = 0; i < this.rows; i++) {
				for (var j = 0; j < this.cols; j++) {
					this.map[i][j].isMine = false;
				}
			}
			this.generateMines();
		}
	},

	squaresRemaining() {
		return ((this.rows * this.cols) - this.mines) - this.squaresRevealed;
	},

	initTouchEvent() {
		this.node.on(cc.Node.EventType.TOUCH_START, function(touch) {
			var currentSquare = this._convTouchSquare(touch);
			if (!currentSquare) {
				return;
			}
			this.touchDownSquare = currentSquare;
			this.scheduleOnce(this._waitingLongTouch, 0.4);
		}, this);

		this.node.on(cc.Node.EventType.TOUCH_END, function(touch) {
			do {
				if (!!this.isLongTouch) {
					break;
				}

				var currentSquare = this._convTouchSquare(touch);
				if (!currentSquare || !currentSquare.equal(this.touchDownSquare)) {
					break;
				}

				this.node.emit('short-touch', {currentSquare: currentSquare});
			} while (false);

			this.unschedule(this._waitingLongTouch);
			this.touchDownSquare = null;
			this.isLongTouch = false;
		}, this);

		this.node.on(cc.Node.EventType.TOUCH_MOVE, function(touch) {
			var currentSquare = this._convTouchSquare(touch);
			if (!currentSquare || !currentSquare.equal(this.touchDownSquare)) {
				this.unschedule(this._waitingLongTouch);
			}
		}, this);

		this.node.on(cc.Node.EventType.TOUCH_CANCEL, function(touch) {
			this.unschedule(this._waitingLongTouch);
			this.touchDownSquare = null;
			this.isLongTouch = false;
		}, this);
	},

	addEventListener() {
		this.node.on('long-touch', this._longTouch, this);
		this.node.on('short-touch', this._shortTouch, this);
	},

	removeEventListener() {
		this.node.off('long-touch', this._longTouch, this);
		this.node.off('short-touch', this._shortTouch, this);
	},

	_convTouchSquare(touch) {
		var newVec2 = this.node.convertTouchToNodeSpace(touch);
		var squareSize = this.squareSize;
		var row = Math.floor(newVec2.y / squareSize);
		var col = Math.floor(newVec2.x / squareSize);
		if (row >= this.rows || this.rows < 0 || col >= this.cols || this.cols < 0) {
			return null;
		}
		return this.map[row][col];
	},

	_waitingLongTouch() {
		this.isLongTouch = true;
		this.node.emit('long-touch', {currentSquare: this.touchDownSquare});
	},

	_longTouch(touch) {
		if (this.seconds < 0) {
			this.seconds = 0;
		}

		var currentSquare = touch.detail.currentSquare;
		if (!currentSquare.isRevealed) {
			currentSquare.markWithFlag();
		}
	},

	_shortTouch(touch) {
		if (this.seconds < 0) {
			this.seconds = 0;
		}

		this.playAudio('click');
		var currentSquare = touch.detail.currentSquare;
		if (!currentSquare.isRevealed) {
			currentSquare.uncoverSquare();
		} else {
			currentSquare.clearAround();
		}
	},

	loseGame(currentSquare) {
		this.playAudio('explode');
		this.seconds = -1;
		this.removeEventListener();
		this.uncoverAllMines(currentSquare);
	},

	winGame() {
		this.playAudio('win');
		this.seconds = -1;
		this.removeEventListener();
		this.uncoverAllMines(undefined);
		this.lblWin.node.active = true;
	},

	uncoverAllMines(squareTriggered) {
		if (!!squareTriggered) {
			squareTriggered.drawMine(true);
		}

		var rows = this.rows;
		var cols = this.cols;
		for (var i = 0; i < rows; i++) {
			for (var j = 0; j < cols; j++) {
				var currentSquare = this.map[i][j];
				if (currentSquare.isMine && !currentSquare.flaggedAsMine && !(squareTriggered && squareTriggered.row == currentSquare.row && squareTriggered.col == currentSquare.col)) {
					currentSquare.flaggedAsMine = true;
					if (!!squareTriggered) {
						currentSquare.drawMine();
					} else {
						currentSquare.drawFlag(true);
					}
				}
			}
		}
	},

	showSeconds(s) {
		var num = new Number(s);
		this.lblSeconds.string = num.toFixed(1) + 's';
	},

	playAudio(name) {
		if (name == 'win') {
			cc.audioEngine.playEffect(this.audioWin, false);
		} else if (name == 'explode') {
			cc.audioEngine.playEffect(this.audioExplode, false, 0.4);
		} else if (name == 'opening') {
			cc.audioEngine.playEffect(this.audioOpening, false, 0.1);
		} else if (name == 'click') {
			cc.audioEngine.playEffect(this.audioClick, false);
		} else if (name == 'flag') {
			cc.audioEngine.playEffect(this.audioFlag, false);
		}
	},

	update(dt) {
		if (this.seconds > -1) {
			this.seconds += dt;
			this.showSeconds(this.seconds);
		}
	}
});