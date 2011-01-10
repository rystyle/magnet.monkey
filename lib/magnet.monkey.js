var MagnetMonkey = {};

(function() {
		// constant
		var CELL_SIZE              =  80 / 2;
		var CELL_XCOUNT            =  12 * 2;
		var CELL_YCOUNT            =   7 * 2;
		var XMAX                   = CELL_XCOUNT - 1;
		var YMAX                   = CELL_YCOUNT - 1;
		var FIELD_ZINDEX           =   0;
		var SPRITE_ZINDEX          =   1;
		var FIELD_WIDTH            = CELL_SIZE * CELL_XCOUNT;
		var FIELD_HEIGHT           = CELL_SIZE * CELL_YCOUNT;
		var FIELD_COLOR            = "grey";
		var BORDER_SIZE            =   5;
		var BORDER_COLOR           = "red";
		var SCORE_HEIGHT           =  40;
		var SCORE_FONT_FAMILY      = "Impact, sans-serif";
		var SCORE_FONT_SIZE        = "24pt";
		var UPDATE_INTERVAL        =  50;
		var MAX_SCORE              = 999999999;
		var KEY_LEFT               =  37;
		var KEY_RIGHT              =  39;
		var KEY_UP                 =  38;
		var KEY_DOWN               =  40;
		var KEY_SPACE              =  32;
		var KEY_ENTER              =  13;
		var KEY_ESC                =  27;
		var KEY_COUNT              = 256;
		var READYSTATE_UNINI       =   0;
		var READYSTATE_LOADING     =   1;
		var READYSTATE_LOADED      =   2;
		var READYSTATE_INTERACTIVE =   3;
		var READYSTATE_COMPLETE    =   4;
		var STATUS_NOT_FOUND       = 404;
		var STATUS_NOT_MODIFIED    = 304;
		var STATUS_OK              = 200;

		// random
		function randFloat2(from, to) { return Math.random() * (to - from) + from; }
		function randFloat(to)        { return randFloat2(0, to);                  }
		function randInt2(from, to)   { return Math.floor(randFloat2(from, to));   }
		function randInt(to)          { return randInt2(0, to);                    }
		function randSign()           { return randInt(2) * 2 - 1;                 }

		// sprite
		function Sprite(div, zIndex) {
        var obj = this;
        var style;

        // display resource
        obj.img = document.createElement("img");
        div.appendChild(obj.img);

        obj.img.src    = "void.png";
        style          = obj.img.style;
        style.position = "absolute";
        style.zIndex   = zIndex;

        // refresh
        obj.updated = false;
        obj.viewX = 0;
        obj.viewY = 0;
        obj.onUpdate = function() {}
        obj.update = function(viewX, viewY) {
            if (obj.updated && viewX == obj.viewX && viewY == obj.viewY) return;
            obj.updated = true;
            obj.viewX = viewX;
            obj.viewY = viewY;

            var style = obj.img.style;
            style.left   = Math.floor((obj.x - viewX) * CELL_SIZE) + "px";
            style.top    = Math.floor((obj.y - viewY) * CELL_SIZE) + "px";
            style.width  = Math.floor(obj.xSize * CELL_SIZE) + "px";
            style.height = Math.floor(obj.ySize * CELL_SIZE) + "px";

            obj.img.src = obj.animImage[obj.animIndex];
        }

        // grid
        obj.setGrid = function(g) { obj.grid = g;    }
        obj.getGrid = function()  { return obj.grid; }
        obj.setGrid(0);

        // location
        obj.setXY = function(x, y) {
						obj.updated = false;
						if (obj.grid != 0)
								{
										obj.x = Math.floor(x * obj.grid + 0.5) / obj.grid;
										obj.y = Math.floor(y * obj.grid + 0.5) / obj.grid;
								}
						else
								{
										obj.x = x;
										obj.y = y;
								}
        }

        obj.getX = function() {return obj.x;}
        obj.getY = function() {return obj.y;}

        obj.setXY(0, 0);

        // size
        obj.setSize = function(xSize, ySize) {
						obj.updated = false;
						obj.xSize   = xSize;
						obj.ySize   = ySize;
        }

        obj.getXSize=function() {return obj.xSize;}
        obj.getYSize=function() {return obj.ySize;}

        obj.setSize(1, 1);

        // animation
        obj.initAnim = function(array) {
						obj.updated   = false;
						obj.animImage = array;
						obj.animIndex = 0;
						obj.animOver  = false;
        }

        obj.stepAnim = function() {
						obj.updated = false;
						obj.animIndex++;
						if (obj.animIndex >= obj.animImage.length) {
								obj.animIndex = 0;
								obj.animOver  = true;
						}
        }

        obj.isAnimOver = function() { return obj.animOver; }

        obj.initAnim(new Array("void.png"));

        // hit detction process
        obj.hit         = new Array(0, 0, 1, 1);
        obj.initHit     = function(array) {obj.hit = array;}
        obj.onHitSprite = function(spr)   {};
        obj.testHitSprite = function(spr) {
						var a  = obj.hit,      b  = spr.hit;
						var al = a[0] + obj.x, ar = a[2] + obj.x;
						var at = a[1] + obj.y, ab = a[3] + obj.y;
						var bl = b[0] + spr.x, br = b[2] + spr.x;
						var bt = b[1] + spr.y, bb = b[3] + spr.y;
						if (al < br && bl < ar && at < bb && bt < ab) {
								obj.onHitSprite(spr);
								return true;
						}
						return false;
        }

        // condition
        obj.state=0;
        obj.getState=function() {return obj.state;}
        obj.setState=function(state) {obj.state=state;}
		}

		// game main implementation
		function Game() {
        var obj = this;
        var style;
        var i;

        // base display resource
        obj.divBase = document.createElement("div");
        document.body.appendChild(obj.divBase);

        style                 = obj.divBase.style;
        style.position        = "absolute";
        style.backgroundColor = BORDER_COLOR;
        style.left            = 0 + "px";
        style.top             = 0 + "px";
        style.width           = FIELD_WIDTH + BORDER_SIZE * 2 + "px";
        style.height          = FIELD_HEIGHT + SCORE_HEIGHT + BORDER_SIZE * 3 + "px";

        // field display resource
        obj.divField = document.createElement("div");
        obj.divBase.appendChild(obj.divField);

        style                 = obj.divField.style;
        style.overflow        = "hidden";
        style.position        = "absolute";
        style.backgroundColor = FIELD_COLOR;
        style.left            = BORDER_SIZE  + "px";
        style.top             = BORDER_SIZE  + "px";
        style.width           = FIELD_WIDTH  + "px";
        style.height          = FIELD_HEIGHT + "px";

        // score display resource
        obj.divScore = document.createElement("div");
        obj.divBase.appendChild(obj.divScore);

        style                 = obj.divScore.style;
        style.overflow        = "hidden";
        style.position        = "absolute";
        style.backgroundColor = FIELD_COLOR;
        style.left            = BORDER_SIZE + "px";
        style.top             = FIELD_HEIGHT + BORDER_SIZE * 2 + "px";
        style.width           = FIELD_WIDTH / 2 + "px";
        style.height          = SCORE_HEIGHT + "px";
        style.fontFamily      = SCORE_FONT_FAMILY;
        style.fontSize        = SCORE_FONT_SIZE;

        // high score display resource
        obj.divHighScore = document.createElement("div");
        obj.divBase.appendChild(obj.divHighScore);

        style                 = obj.divHighScore.style;
        style.overflow        = "hidden";
        style.position        = "absolute";
        style.backgroundColor = FIELD_COLOR;
        style.left            = BORDER_SIZE + FIELD_WIDTH / 2 + "px";
        style.top             = FIELD_HEIGHT + BORDER_SIZE * 2 + "px";
        style.width           = FIELD_WIDTH / 2 + "px";
        style.height          = SCORE_HEIGHT + "px";
        style.fontFamily      = SCORE_FONT_FAMILY;
        style.fontSize        = SCORE_FONT_SIZE;

        // high score
        obj.getHighScore=function() {return obj.score;}
        obj.setHighScore=function(score) {
						obj.highScore = score;
						if (obj.highScore > MAX_SCORE) { obj.highScore=MAX_SCORE; }
						obj.divHighScore.innerHTML = "High Score: " + obj.highScore;
        }
        obj.setHighScore(0);

        // score
        obj.getScore=function() { return obj.score; }
        obj.setScore=function(score) {
						obj.score=score;
						if (obj.score > MAX_SCORE) { obj.score = MAX_SCORE; }
						obj.divScore.innerHTML = "Score: " + obj.score;
						if (obj.score > obj.highScore) { obj.setHighScore(obj.score);  }
						if (obj.score % 10 == 0)       { obj.rankingScore = obj.score; }
        }
        obj.addScore=function(score) {obj.setScore(obj.score+score);}
        obj.setScore(0);

        // screen clear
        obj.clear = function() {
						obj.divField.innerHTML = "";
						obj.sprite = new Array();
						obj.field  = new Array();
						obj.zIndex = 0;
        }
        obj.clear();

        // sprite
        obj.createSprite = function() { var s = new Sprite(obj.divField, obj.zIndex++); obj.sprite.push(s); return s; }

        // view
        obj.setViewXY = function(x, y) {
						obj.viewX = x;
						obj.viewY = y;
        }

        obj.getViewX = function() { return obj.viewX; }
        obj.getViewY = function() { return obj.viewY; }
        obj.setViewXY(0, 0);

        // keyboard
        obj.key = new Array();
        for (i=0; i < KEY_COUNT; i++) {obj.key[i] = false;}
        document.onkeydown = function(e) {if (e) {obj.key[e.which] = true; } else {obj.key[event.keyCode]=true; }}
        document.onkeyup   = function(e) {if (e) {obj.key[e.which] = false;} else {obj.key[event.keyCode]=false;}}
        obj.isKey          = function(code) {return obj.key[code];}

        // hit detection
        obj.testHitSprite = function(spr) {
						var hit = false;
						var i;
						for (i = 0; i < obj.sprite.length; i++) {if (spr != obj.sprite[i]) {if (spr.testHitSprite(obj.sprite[i])) {hit = true;}}}
						return hit;
        }

        // refresh
        obj.onUpdate = function() {}
        obj.update   = function() {
						var start = +new Date(),
						stop;
						obj.onUpdate();
						var i;
						for (i = 0; i < obj.field.length;  i++) { obj.field[i].onUpdate();                    }
						for (i = 0; i < obj.sprite.length; i++) { obj.sprite[i].onUpdate();                   }
						for (i = 0; i < obj.field.length;  i++) { obj.field[i].update(obj.viewX, obj.viewY);  }
						for (i = 0; i < obj.sprite.length; i++) { obj.sprite[i].update(obj.viewX, obj.viewY); }
						stop = +new Date();

						if (stop-start > 50) {
								window.console && console.log("game running slow");
						}
        }

        setInterval(obj.update, UPDATE_INTERVAL);
		}


		var PLAYER_SPEED =  0.2;
		var ENEMY_COUNT  = 10;
		var ENEMY_SPEED  =  0.1;
		var ENEMY_CHASE  =  0.04;
		var ENEMY_WAIT   =  0.02;
		var WEAPON_SPEED =  0.05;
		var WEAPON_COUNT =  4;

		var game;
		var player;
		var enemy;
		var weapon;

		var field;

		var playerWalkAnim;
		var enemyWalkAnim;
		var vanishAnim;
		var weaponAnim;

		var playerHit;
		var enemyHit;
		var weaponHit;

		var STATE_PLAYER_ALIVE = 0;
		var STATE_PLAYER_DEAD  = 1;
		var STATE_ENEMY_ALIVE  = 2;
		var STATE_ENEMY_DEAD   = 3;
		var STATE_WEAPON_ALIVE = 4;
		var STATE_WEAPON_DEAD  = 5;

		function Player() {
        var obj = this;

        obj.sprite = game.createSprite();
        obj.sprite.initAnim(playerWalkAnim);
        obj.sprite.initHit(playerHit);
        obj.sprite.setXY( XMAX / 2, YMAX / 2);
        obj.sprite.setState(STATE_PLAYER_ALIVE);
        obj.prevKey = true;

        obj.sprite.onUpdate=function() {
						switch (obj.sprite.getState()) {
						case STATE_PLAYER_ALIVE: obj.alive(); break;
						case STATE_PLAYER_DEAD:  obj.dead();  break;
						}
        }

        obj.alive=function() {
						var x = obj.sprite.getX(), y = obj.sprite.getY();

						if (game.isKey(KEY_LEFT) || game.isKey(KEY_RIGHT) || game.isKey(KEY_UP) || game.isKey(KEY_DOWN)) {
								for (i=0; i < weapon.length; i++) {weapon[i].cx = x; weapon[i].cy = y;}
						}

						if (game.isKey(KEY_LEFT))  x -= PLAYER_SPEED;
						if (game.isKey(KEY_RIGHT)) x += PLAYER_SPEED;
						if (game.isKey(KEY_UP))    y -= PLAYER_SPEED;
						if (game.isKey(KEY_DOWN))  y += PLAYER_SPEED;

						if (x < 0) x = 0; else if (x > XMAX) x = XMAX;
						if (y < 0) y = 0; else if (y > YMAX) y = YMAX;

						if (x != obj.sprite.getX() || y != obj.sprite.getY()) { obj.sprite.stepAnim(); }

						obj.sprite.setXY(x, y);

						if (!obj.prevKey && game.isKey(KEY_SPACE)) {
								for (i=0; i < weapon.length; i++) { if (weapon[i].sprite.getState() == STATE_WEAPON_DEAD) { weapon[i].init(x, y, 0, -1); break; } }
						}

						obj.prevKey = game.isKey(KEY_SPACE);
        }

        obj.dead = function() {
						obj.sprite.stepAnim();
						if (obj.sprite.isAnimOver()) {MagnetMonkey.init();}
        }
		}

		function Enemy() {
        var obj = this;
        obj.sprite = game.createSprite();
        obj.sprite.initHit(enemyHit);

        obj.init=function() {
						obj.sprite.initAnim(enemyWalkAnim);
						switch (randInt(4)) {
						case 0: obj.sprite.setXY(randFloat2(0, XMAX), -1); break;
						case 1: obj.sprite.setXY(randFloat2(0, XMAX), YMAX+1); break;
						case 2: obj.sprite.setXY(-1, randFloat2(0, YMAX)); break;
						case 3: obj.sprite.setXY(XMAX+1, randFloat2(0, YMAX)); break;
						}
						obj.sprite.setState(STATE_ENEMY_ALIVE);
						obj.chase=true;
        }
        obj.init();

        obj.sprite.onUpdate=function() {
						switch (obj.sprite.getState()) {
						case STATE_ENEMY_ALIVE: obj.alive(); break;
						case STATE_ENEMY_DEAD: obj.dead(); break;
						}
        }

        obj.alive=function() {
						var x = obj.sprite.getX(), y = obj.sprite.getY();
						var px = player.sprite.getX(), py = player.sprite.getY();

						if (obj.chase) {
								if (Math.abs(px-x)<ENEMY_SPEED) {x=px;} else {if (px<x) x-=ENEMY_SPEED; else x+=ENEMY_SPEED;}
								if (Math.abs(py-y)<ENEMY_SPEED) {y=py;} else {if (py<y) y-=ENEMY_SPEED; else y+=ENEMY_SPEED;}
								if (randFloat(1)<ENEMY_WAIT) obj.chase = false;} else {if (randFloat(1)<ENEMY_CHASE) obj.chase=true;}

						if (x!=obj.sprite.getX() || y!=obj.sprite.getY()) {
								obj.sprite.stepAnim();
						}
						obj.sprite.setXY(x, y);

						game.testHitSprite(obj.sprite);
        }

        obj.sprite.onHitSprite = function(spr) {
						switch (spr.getState()) {
						case STATE_PLAYER_ALIVE:
						spr.initAnim(vanishAnim);
						spr.setState(STATE_PLAYER_DEAD);
						break;
						case STATE_WEAPON_ALIVE:
						spr.damage += 1;
						if (spr.damage > 3) { spr.setXY(-1, -1); spr.setState(STATE_WEAPON_DEAD); }
						obj.sprite.initAnim(vanishAnim);
						obj.sprite.setState(STATE_ENEMY_DEAD);
						game.addScore(1);
						break;
						}
        }

        obj.dead = function() {
						obj.sprite.stepAnim();
						if (obj.sprite.isAnimOver()) { obj.init(); }
        }
		}

		function Weapon() {
        var obj = this;

        obj.sprite = game.createSprite();
        obj.sprite.initAnim(weaponAnim);
        obj.sprite.initHit(weaponHit);
        obj.sprite.setXY(-1, -1);

				obj.set = function(){
						obj.vx = 0;
						obj.vy = 0;
						obj.cx = 0;
						obj.cy = 0;
						obj.vr = 0.1;
						obj.r  = 0.8;
						obj.mr = 2;
						obj.omega = -0.3;

						if (randInt(2) == 1)
								{
										obj.mr = 2;
										obj.omega = -0.3;
								}
						else
								{
								obj.mr = 3;
								obj.omega = 0.3;
								}

						if   (randInt(2) == 1) {	obj.mr = obj.mr + randInt(4);	}
						else                   {	obj.mr = obj.mr + 0; 					}

						obj.theta = randFloat(6);
				}

				obj.set();

        obj.sprite.setState(STATE_WEAPON_DEAD);

        obj.init = function(x, y, dx, dy) {
						obj.sprite.setXY(x, y);
						obj.cx = x;
						obj.cy = y;
						obj.vx = 0.1;
						obj.vy = 0.1;
						obj.sprite.setState(STATE_WEAPON_ALIVE);
        }

        obj.sprite.onUpdate = function() {
						if (obj.sprite.getState() != STATE_WEAPON_ALIVE) return;

						obj.theta += obj.omega;

						if (obj.r < obj.mr) { obj.r += obj.vr / 4; } else { obj.r += obj.vr; }

						x = obj.cx + obj.r * Math.cos(obj.theta);
						y = obj.cy + obj.r * Math.sin(obj.theta);

						obj.sprite.setXY(x, y);
						obj.sprite.stepAnim();

						if (x < -1 || x > XMAX + 1 || y < -1 || y > YMAX + 1) {
								obj.sprite.setXY(-1, -1);
								obj.set();
								obj.sprite.setState(STATE_WEAPON_DEAD);
						}
        }
		}

		this.init = function() {
        var i;

        game.clear();
        game.setScore(0);

        player = new Player();
        enemy  = new Array(); for (i = 0; i < ENEMY_COUNT;  i++) { enemy[i]  = new Enemy();  }
        weapon = new Array(); for (i = 0; i < WEAPON_COUNT; i++) { weapon[i] = new Weapon(); }
		}

		this.run = function() {
        game           = new Game();

				var IMAGE_DIR = "lib/img/"

        playerWalkAnim = new Array(IMAGE_DIR + "monkey0.png",
                                   IMAGE_DIR + "monkey2.png",
                                   IMAGE_DIR + "monkey0.png",
                                   IMAGE_DIR + "monkey1.png",
                                   IMAGE_DIR + "monkey3.png",
                                   IMAGE_DIR + "monkey1.png");

        enemyWalkAnim  = new Array(IMAGE_DIR + "robot0.png",
                                   IMAGE_DIR + "robot2.png",
                                   IMAGE_DIR + "robot0.png",
                                   IMAGE_DIR + "robot1.png",
                                   IMAGE_DIR + "robot0.png",
                                   IMAGE_DIR + "robot1.png");

        vanishAnim     = new Array(IMAGE_DIR + "void.png",
                                   IMAGE_DIR + "vanish8.png",
                                   IMAGE_DIR + "vanish6.png",
                                   IMAGE_DIR + "vanish4.png",
                                   IMAGE_DIR + "vanish2.png",
                                   IMAGE_DIR + "vanish0.png",
                                   IMAGE_DIR + "vanish1.png",
                                   IMAGE_DIR + "vanish2.png",
                                   IMAGE_DIR + "vanish3.png",
                                   IMAGE_DIR + "vanish4.png",
                                   IMAGE_DIR + "vanish5.png",
                                   IMAGE_DIR + "vanish6.png",
                                   IMAGE_DIR + "vanish7.png",
                                   IMAGE_DIR + "vanish8.png",
                                   IMAGE_DIR + "void.png");

        weaponAnim     = new Array(IMAGE_DIR + "mwrench0.png",
                                   IMAGE_DIR + "mwrench1.png",
                                   IMAGE_DIR + "mwrench2.png",
                                   IMAGE_DIR + "mwrench3.png",
                                   IMAGE_DIR + "mwrench4.png",
                                   IMAGE_DIR + "mwrench5.png",
                                   IMAGE_DIR + "mwrench6.png");

        playerHit      = new Array(0.25, 0.25, 0.75, 0.75);
        enemyHit       = new Array(0.25, 0.25, 0.75, 0.75);
        weaponHit      = new Array( 0.1,  0.1,  0.9,  0.9);

        this.init();
		}
} ).apply(MagnetMonkey)
