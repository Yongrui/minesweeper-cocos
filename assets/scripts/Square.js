cc.Class({
	extends: cc.Component,

	properties: {
		imgFlag: cc.Node,
		imgRedMine: cc.Node,
		imgBlackMine: cc.Node,
		texNumber: {
			default: [],
			type: cc.SpriteFrame
		},
	},

	init(row, col, squareSize) {
		this.shouldOpenSquare = null;
		this.isRevealed = false;
		this.flaggedAsMine = false;
		this.animationScale = 0;
		this.isMine = false;
		this.number = 0;
		this.row = row;
		this.col = col;
		this.node.width = squareSize;
		this.node.height = squareSize;
	},

	drawSquareNumber(n) {
		var sprite = this.getComponent('cc.Sprite')
		sprite.spriteFrame = this.texNumber[n];
	},

	drawFlag(visible) {
		this.imgFlag.active = visible;
	},

	drawMine(triggered) {
		if (!triggered) {
			this.imgBlackMine.active = true;
		}
		else {
			this.imgRedMine.active = true;
		}
	},

	getSurroundingMineCount() {
		var currentSquare = this;
		return this.visitSurrounding(function(currentSquare) {
			return currentSquare.isMine;
		})
	},

	getSurroundingFlaggedCount() {
		var currentSquare = this;
		return this.visitSurrounding(function(currentSquare) {
			return currentSquare.flaggedAsMine;
		})
	},

	getSurroundingUnrevealedCount() {
		var currentSquare = this;
		return this.visitSurrounding(function(currentSquare) {
			return !currentSquare.isRevealed;
		})
	},

	visitSurrounding(propertySelector) {
		var row = this.row;
		var col = this.col;
		var rows = this.board.rows;
		var cols = this.board.cols;

		//Corners
		if (row == 0 && col == 0) {
			return this.countBelow(propertySelector) + this.countRight(propertySelector) + this.countBelowRight(propertySelector);
		}
		if (row == 0 && col == cols - 1) {
			return this.countLeft(propertySelector) + this.countBelowLeft(propertySelector) + this.countBelow(propertySelector);
		}
		if (row == rows - 1 && col == 0) {
			return this.countRight(propertySelector) + this.countAboveRight(propertySelector) + this.countAbove(propertySelector);
		}
		if (row == rows - 1 && col == cols - 1) {
			return this.countLeft(propertySelector) + this.countAboveLeft(propertySelector) + this.countAbove(propertySelector);
		}

		//First and last row
		if (row == 0) {
			return this.countLeft(propertySelector) + this.countRight(propertySelector) + this.countBelowLeft(propertySelector) + this.countBelowRight(propertySelector) +
				this.countBelow(propertySelector);
		}
		if (row == rows - 1) {
			return this.countLeft(propertySelector) + this.countRight(propertySelector) + this.countAboveLeft(propertySelector) + this.countAboveRight(propertySelector) +
				this.countAbove(propertySelector);
		}

		//First and last column
		if (col == 0) {
			return this.countRight(propertySelector) + this.countAboveRight(propertySelector) + this.countAbove(propertySelector) + this.countBelow(propertySelector) +
				this.countBelowRight(propertySelector);

		}
		if (col == cols - 1) {
			return this.countLeft(propertySelector) + this.countAboveLeft(propertySelector) + this.countAbove(propertySelector) + this.countBelow(propertySelector) +
				this.countBelowLeft(propertySelector);
		}

		return this.countLeft(propertySelector) + this.countRight(propertySelector) + this.countAboveLeft(propertySelector) + this.countAboveRight(propertySelector) +
			this.countAbove(propertySelector) + this.countBelow(propertySelector) + this.countBelowLeft(propertySelector) + this.countBelowRight(propertySelector);
	},

	//Count methods
	countAbove(propertySelector) {
		return propertySelector(this.board.map[this.row - 1][this.col]) ? 1 : 0;
	},

	countAboveRight(propertySelector) {
		return propertySelector(this.board.map[this.row - 1][this.col + 1]) ? 1 : 0;
	},

	countAboveLeft(propertySelector) {
		return propertySelector(this.board.map[this.row - 1][this.col - 1]) ? 1 : 0;
	},

	countBelow(propertySelector) {
		return propertySelector(this.board.map[this.row + 1][this.col]) ? 1 : 0;
	},

	countBelowRight(propertySelector) {
		return propertySelector(this.board.map[this.row + 1][this.col + 1]) ? 1 : 0;
	},

	countBelowLeft(propertySelector) {
		return propertySelector(this.board.map[this.row + 1][this.col - 1]) ? 1 : 0;
	},

	countRight(propertySelector) {
		return propertySelector(this.board.map[this.row][this.col + 1]) ? 1 : 0;
	},

	countLeft(propertySelector) {
		return propertySelector(this.board.map[this.row][this.col - 1]) ? 1 : 0;
	},

	//Uncover* methods
	uncoverAbove() {
		return this.board.map[this.row - 1][this.col].uncoverSquare();
	},

	uncoverAboveRight() {
		return this.board.map[this.row - 1][this.col + 1].uncoverSquare();
	},

	uncoverAboveLeft() {
		return this.board.map[this.row - 1][this.col - 1].uncoverSquare();
	},

	uncoverBelow() {
		return this.board.map[this.row + 1][this.col].uncoverSquare();
	},

	uncoverBelowRight() {
		return this.board.map[this.row + 1][this.col + 1].uncoverSquare();
	},

	uncoverBelowLeft() {
		return this.board.map[this.row + 1][this.col - 1].uncoverSquare();
	},

	uncoverRight() {
		return this.board.map[this.row][this.col + 1].uncoverSquare();
	},

	uncoverLeft() {
		return this.board.map[this.row][this.col - 1].uncoverSquare();
	},

	doOpening() {
		var row = this.row;
		var col = this.col;
		var rows = this.board.rows;
		var cols = this.board.cols;

		//Corners
		if (row == 0 && col == 0) {
			this.uncoverBelow();
			this.uncoverRight();
			this.uncoverBelowRight();
			return;
		}
		if (row == 0 && col == cols - 1) {
			this.uncoverLeft();
			this.uncoverBelowLeft();
			this.uncoverBelow();
			return;
		}
		if (row == rows - 1 && col == 0) {
			this.uncoverRight();
			this.uncoverAboveRight();
			this.uncoverAbove();
			return;
		}
		if (row == rows - 1 && col == cols - 1) {
			this.uncoverLeft();
			this.uncoverAboveLeft();
			this.uncoverAbove();
			return;
		}

		//First and last row
		if (row == 0) {
			this.uncoverLeft();
			this.uncoverRight();
			this.uncoverBelowLeft();
			this.uncoverBelowRight();
			this.uncoverBelow();
			return;
		}
		if (row == rows - 1) {
			this.uncoverLeft();
			this.uncoverRight();
			this.uncoverAboveLeft();
			this.uncoverAboveRight();
			this.uncoverAbove();
			return;
		}

		//First and last column
		if (col == 0) {
			this.uncoverRight();
			this.uncoverAboveRight();
			this.uncoverAbove();
			this.uncoverBelow();
			this.uncoverBelowRight();
			return;
		}
		if (col == cols - 1) {
			this.uncoverLeft();
			this.uncoverAboveLeft();
			this.uncoverAbove();
			this.uncoverBelow();
			this.uncoverBelowLeft();
			return;
		}

		this.uncoverRight();
		this.uncoverAboveLeft();
		this.uncoverAboveRight();
		this.uncoverAbove();
		this.uncoverBelow();
		this.uncoverBelowRight();
		this.uncoverBelowLeft();
		this.uncoverLeft();
	},

	markWithFlag() {
		var board = this.board;

		if (this.isRevealed) return;

		if (!this.flaggedAsMine) {
			board.minesFlagged++;
			this.flaggedAsMine = true;
			this.drawFlag(true);
			board.playAudio('flag');
		}
		else {
			board.minesFlagged--;
			this.flaggedAsMine = false;
			this.drawFlag(false);
		}
	},

	uncoverSquare() {
		var currentSquare = this;
		var row = currentSquare.row;
		var col = currentSquare.col;
		var board = currentSquare.board;

		if (currentSquare.flaggedAsMine) return;
		if (currentSquare.isRevealed) return;

		if (board.squaresRevealed == 0) {
			if (currentSquare.getSurroundingMineCount() > 0 || currentSquare.isMine) {
				board.regenerate(currentSquare);
			}
			currentSquare = board.map[row][col];
		}

		if (currentSquare.isMine) {
			console.log("loseGame");
			board.loseGame(currentSquare);
			return;
		}

		var n = currentSquare.getSurroundingMineCount();
		currentSquare.isRevealed = true;
		board.squaresRevealed++;
		currentSquare.drawSquareNumber(n);

		if (n === 0) {
			// currentSquare.doOpening();
			board.playAudio('opening');
			this.shouldOpenSquare = currentSquare;
		}

		if (board.squaresRemaining() === 0) {
			console.log("winGame");
			board.winGame();
			return;
		}
	},

	clearAround() {
		var surroundingMines = this.getSurroundingMineCount();
		var surroundingFlagged = this.getSurroundingFlaggedCount();
		if (surroundingMines == surroundingFlagged && surroundingFlagged > 0) {
			var callback = this.uncoverSquare;
			this.visitSurrounding(function(currentSquare) {
				callback.call(currentSquare);
				return true;
			});
		}
	},

	equal(currentSquare) {
		return currentSquare.row === this.row && currentSquare.col === this.col;
	},

	update() {
		if (!!this.shouldOpenSquare) {
			this.shouldOpenSquare.doOpening()
			this.shouldOpenSquare = false;
		}
	}
});