window.PhaserGlobal = { disableWebAudio: true };
// Create a Phaser game instance
var game = new Phaser.Game(
	600, //sets the width of the game canvas
	700,//sets the height of the game vanvas
	Phaser.CANVAS,//phaser auto detects which rendering method is best to run, but I have set it to CANVAS for better compatability with Chrome.
	'container',//the HTML div ID where the game will be placed
	main,
	true
);

//initialize global variables

var paper, 			//the background image
	date,			//the current day
	lastVisit,		//the last day the game was played
	timeAway,		//tells the user the time away from the game
	welcomeText,	//the text that is displayed when the player returns
	onBoarding = 1,		//boolean variable describing whether a player needs onboarding or not
	cursors,		//game control
	enter,			//enter key held as a variable
	space,			//spacebar held as a variable
	music, 			//background music
	score = 0,		//score of player
	player,			//user's ship
	health = 100,	//user's health
	lives = 3,		//lives of player
    enemies1,		//enemy type 1
	en1num = 16,	//number of enemies
	livingEnemies = [], //array for firing of enemy weapons
	enemyBullets,	//enemy shots
	firingTimer = 0,//timer for enemy to shoot
	limit,			//the limited range of movement strafing enemies have
	killCount = 0,		//the number of enemies killed
	shots,			//shots fired in game, this is an object group
	shotsFired = 0,		//number of shots fired
	accuracy = 0,		//hit percentage
	speed = 6,		//speed the ship moves at
	scoreText,		//variable that holds a string which will be shown on screen
	lifeText,		//variable which holds a string which will be shown on screen
	hitText,		//text of accuracy
	killText,		//text of kill count
	highScore1,		//text of HS1
	highScore2,		//text of HS2
	highScore3,		//text of HS3
	hScore1,		//highest score
	hScoreAc1,		//highest score accuracy 1
	hScoreDate1,	//date of first highest score
	hScore2,		//second highest score
	hScoreAc2,		//highest score accuracy 2
	hScoreDate2,	//date of second highest score
	hScore3,		//third highest score
	hScoreAc3,		//highest score accuracy 3
	hScoreDate3;	//date of third highest score


////////////////////////////////////////////////////////
///////////////////Play Game State//////////////////////
////////////////////////////////////////////////////////


var play = {
	init: function(){
		cursors = game.input.keyboard.createCursorKeys();
		space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		enter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);

	},
	preload: function(){
		//stores the path of the visual assets
		var dir = 'static/img/assets/';
		//loads the background image
		game.load.image('bg', dir + 'Background.png');
		//loads post its for score and life tracking
		game.load.image('postIt', dir + 'postIt.png');
		game.load.image('ship', dir + 'playerShip1_red.png');	//stores the vehicle as a variable
		game.load.image('ammo', dir + 'laser01.png');
		game.load.image('ammo2', dir + 'laser02.png');
		//stores the enemy ship as a variable
		game.load.image('en1', dir + 'enemy_01.png');
		//stores the image for the explsion debris
		game.load.image('diamond', dir + 'diamond.png');
		//loads the song to play during the game
		game.load.audio('tunes1', 'static/audio/GamePlay.mp3');
	},
	create: function(){
		game.physics.startSystem(Phaser.Physics.ARCADE);
		//adds a background image - loading the college ruled 'bg' from the preload function
		paper = game.add.tileSprite(0,0,600,700,'bg');
		//loads a post it in the top left to use as a place to view the score
		scoreCard = game.add.tileSprite(0,-150,239,253, 'postIt');
		//loads a post it  in the top right to use as a place to view lives left
		livesCard = game.add.tileSprite(360,-150,239,253, 'postIt');
		//add the score as a text element
		scoreText = game.add.text(50, 15, 'Score: 0', {font: 'Gloria Hallelujah', fontSize: '25px', fill: '#000' });
		//add the lives left as a text element
		lifeText = game.add.text(430, 15, 'Lives: 3', {font: 'Gloria Hallelujah', fontSize: '25px', fill: '#000' });
		
		//loads the audio file from earlier to a variable
		music = play.add.audio('tunes1');
		//plays the music
		music.play();
		
		//create the player's ship
		player = game.add.sprite(game.world.centerX, game.world.centerY*1.5, 'ship');
		// Set the anchorpoint to the middle
		player.anchor.setTo(0.4, .25);
		//enable the physics on the ship
		game.physics.arcade.enable([player]);
		//keep the ship on the screen
		player.body.collideWorldBounds = true;
		
		//spawns several enemies to combat
		enemies1 = game.add.group();
		enemies1.enableBody = true;
		enemies1.physicsBodyType = Phaser.Physics.ARCADE;

		//makes the enemies
		createEnemies1(en1num);
		
		// Create the group using the group factory, a streamlined feature which allows for easy object creation
		shots = game.add.group(); 	
			//https://phaser.io/docs/2.4.4/Phaser.GameObjectFactory.html#group

		// enabling the 'body' of the object allows physics to be applied to the object.
		shots.enableBody = true;	

		//https://phaser.io/docs/2.6.2/Phaser.Physics.Arcade.Body.html

		// This applies limited physics to the objects.
		shots.physicsBodyType = Phaser.Physics.ARCADE;	

		//https://phaser.io/docs/2.4.4/Phaser.Physics.Arcade.html

		//sets the number of objects to create and which fisual resource to use for them.
		shots.createMultiple(20, 'ammo'); 
		//this will reset the shot if it goes outside of the screen. We make fewer objects for the program to track this way.
		shots.callAll('events.onOutOfBounds.add', 'events.onOutOfBounds', resetShots);
		// Same as above, set the anchor of every sprite to 0.5, 1.0
		shots.callAll('anchor.setTo', 'anchor', 0.5, 1);
		// This will set 'checkWorldBounds' to true on all sprites in the group
		shots.setAll('checkWorldBounds', true);
	
		enemyBullets = game.add.group();
		enemyBullets.enableBody = true;
		enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
		enemyBullets.createMultiple(30, 'ammo2');
		enemyBullets.setAll('anchor.x', 0.5);
		enemyBullets.setAll('anchor.y', .5);
		enemyBullets.setAll('outOfBoundsKill', true);
		enemyBullets.setAll('checkWorldBounds', true);
		
		//adds a particle emitter to the game mode. This will allow the game to create 'explosions'
		//initializes the emitter
		emitter = game.add.emitter(0, 0, 1000); 
		//loads the image to use for each particle
		emitter.makeParticles('diamond'); 
		//sets the speed that the particles 'fall' at
		
		menu = game.add.tileSprite(175,175,239,253, 'postIt');
		menu.visible = false;
		
		//add text that says game over
		overText = game.add.text(game.width/4 +20,200, 'Game Over', {font: 'Gloria Hallelujah', fontSize: '54px', fill: '#f00' });
		overText.visible = false;
		
		hitText = game.add.text(120,335, 'Accuracy: ' + accuracy, {font: 'Gloria Hallelujah', fontSize: '25px', fill: '#000' });
		//rotate the text to make it look aligned to the post it
		hitText.angle = 9;
		hitText.visible = false;
		
		restartText = game.add.text(250,220, 'Restart', {font: 'Gloria Hallelujah', fontSize: '27px', fill: '#000' });
		//rotate the text to make it look aligned to the post it
		restartText.angle = 9;
		//make the text interactive
		restartText.inputEnabled = true;
		//make the text change color on hover
		restartText.events.onInputOver.add(over, this);
    	restartText.events.onInputOut.add(out, this);
		restartText.events.onInputDown.add(restart, this);
		restartText.visible = false;
		
		resumeText = game.add.text(250,260, 'Resume', {font: 'Gloria Hallelujah', fontSize: '27px', fill: '#000' });
		//rotate the text to make it look aligned to the post it
		resumeText.angle = 9;
		//make the text interactive
		resumeText.inputEnabled = true;
		//make the text change color on hover
		resumeText.events.onInputOver.add(over, this);
    	resumeText.events.onInputOut.add(out, this);
		resumeText.events.onInputDown.add(unpause,this);
		resumeText.visible = false;
		
		mainText = game.add.text(230,300, 'Main Menu', {font: 'Gloria Hallelujah', fontSize: '27px', fill: '#000' });
		//rotate the text to make it look aligned to the post it
		mainText.angle = 9;
		//make the text interactive
		mainText.inputEnabled = true;
		//make the text change color on hover
		mainText.events.onInputOver.add(over, this);
    	mainText.events.onInputOut.add(out, this);
		mainText.events.onInputDown.add(toMain,this);
		mainText.visible = false;
		
			},
	update: function(){
	//scroll the background
	paper.tilePosition.y += 2;
	
	if (player.alive === true) {
        //  Reset the player, then check for movement keys
        if (cursors.left.isDown)
        {
            player.body.velocity.x -= 20;
        }
        if (cursors.right.isDown)
        {
            player.body.velocity.x += 20;
        }
		if (cursors.up.isDown)
		{
			player.body.velocity.y -= 20;	
		}
		if (cursors.down.isDown)
		{
			player.body.velocity.y += 20;	
		}
		//fire the weapon
		//check if the firing key is down or up
		if (space.justDown) {
			fireShot();
		}
		
		if (game.time.now > firingTimer) {
			enemyFires();
		}
		
		}//close player alive
		if (enter.isDown){
			if(game.paused === false){
				//freezes game update
				game.paused = true;
				//reveals the menu from above
				menu.visible = true;
				restartText.visible = true;
				resumeText.visible = true;
				mainText.visible = true;
			}
		}
			
	//ONLY FIRES IF BOTH OBJECTS HAVE VELOCITY
	//creates a collision check
	//checks to see if the player has hit an enemy
	game.physics.arcade.overlap(shots,enemies1,hitEnemy1,null,this);

	//checks to see if the player has run into a ship
	game.physics.arcade.overlap(player,enemies1,collision,null,this);
	
	//checks to see if the player has been hit by debris
	game.physics.arcade.overlap(player,enemyBullets,gotHit,null,this);
		
	if (player.alive === false) {
		if (lives > 0) {
			respawn();
		}
		if (lives < 1) {
			lives = 0;
			gameOver();
		}
	}
		
	if (en1num < 1){ 			//right now this is checking to see if the number of enemies is equal to zero.
		en1num = 16;				//if it is left like this, it will mess with the respawn when the game is paused/unpaused
		createEnemies1(en1num);	//I might need to introduce a new spawn method or a third variable.
	}
	if (lives < 1) {
		lives = 0;
		lifeText.text = 'Lives: ' + lives;	//updtates number of lives remaining
		gameOver();
	}
	}
};
	
////////////////////////////////////////////////////////
///////////////////Main Menu State//////////////////////
////////////////////////////////////////////////////////
	
var main = {
	init: function(){
		
	},
	preload: function(){
		//stores the path of the visual assets
		var dir = 'static/img/assets/';
		//loads the background image
		game.load.image('bg', dir + 'background.png');
		game.load.image('postIt', dir +'postIt.png');
	},
	create: function(){
		//adds a background image - loading the college ruled 'bg' from the preload function
		paper = game.add.tileSprite(0,0,600,700,'bg');
		//loads a post it in the top left to use as a place to view the score
		menu = game.add.tileSprite(game.width/2,game.height/2,239,253, 'postIt');
		//adds text line for title
		titleText = game.add.text(50, 180, 'Margin Fighter', {font: 'Gloria Hallelujah', fontSize: '60px', fill: '#000' });
		//adds a text line for edition of game
		infoText = game.add.text(50, game.height/4 + 80, 'Beta Edition', {font: 'Gloria Hallelujah', fontSize: '16px', fill: '#000' });
		//adds a text line for date since last play
		dateText = game.add.text(50, game.height/4 + 110, welcomeText, {font: 'Gloria Hallelujah', fontSize: '16px', fill: '#000' });
		//New Game
		//new Game Text
		newGameText = game.add.text(350, 400, 'New Game', {font: 'Gloria Hallelujah', fontSize: '27px', fill: '#000' });
		//rotate the text to make it look aligned to the post it
		newGameText.angle = 9;
		//make the text interactive
		newGameText.inputEnabled = true;
		//make the text change color on hover
		newGameText.events.onInputOver.add(over, this);
    	newGameText.events.onInputOut.add(out, this);
		//start a new game when clicked
		newGameText.events.onInputDown.add(newGame);
		//High Scores
		highScoreText = game.add.text(350, 440, 'High Scores', {font: 'Gloria Hallelujah', fontSize: '27px', fill: '#000' });
		//rotate the text to make it look aligned to the post it
		highScoreText.angle = 9;
				//make the text interactive
		highScoreText.inputEnabled = true;
		//make the text change color on hover
		highScoreText.events.onInputOver.add(over, this);
    	highScoreText.events.onInputOut.add(out, this);
		highScoreText.events.onInputDown.add(viewScores);
	},
	update: function(){
		
	},
};

////////////////////////////////////////////////////////
///////////////////High Score State/////////////////////
////////////////////////////////////////////////////////
	
var scores = {
	init: function(){
		
	},
	preload: function(){
				//stores the path of the visual assets
		var dir = 'static/img/assets/';
		//loads the background image
		game.load.image('bg', dir + 'background.png');
		game.load.image('postIt', dir +'postIt.png');
	},
	create: function(){
		//adds a background image - loading the college ruled 'bg' from the preload function
		paper = game.add.tileSprite(0,0,600,700,'bg');
		//loads a post it in the top left to use as a place to view the score
		menu = game.add.tileSprite(game.width/2,game.height/2,239,253, 'postIt');
		//adds text line for title
		titleText = game.add.text(50, 10, 'High Scores', {font: 'Gloria Hallelujah', fontSize: '60px', fill: '#000' });
		
		titles = game.add.text(100, 90, 'Score' +'   '+ 'Accuracy', {font: 'Gloria Hallelujah', fontSize: '30px', fill: '#000' });
		
		highScore1 = game.add.text(100, 130,localStorage.getItem("highScore") + "         "+ localStorage.getItem('accuracy') + '%', {font: 'Gloria Hallelujah', fontSize: '20px', fill: '#000' });
		
		//new Game Text
		newGameText = game.add.text(350, 400, 'Main Menu', {font: 'Gloria Hallelujah', fontSize: '27px', fill: '#000' });
		//rotate the text to make it look aligned to the post it
		newGameText.angle = 9;
		//make the text interactive
		newGameText.inputEnabled = true;
		//make the text change color on hover
		newGameText.events.onInputOver.add(over, this);
    	newGameText.events.onInputOut.add(out, this);
		//start a new game when clicked
		newGameText.events.onInputDown.add(mainMenu);
		//High Scores
	},
	update: function(){

	},
};

////////////////////////////////////////////////////////
///////////////////On Boarding State//////////////////////
////////////////////////////////////////////////////////
	
var instruction = {
	init: function(){	
		
		space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		onBoarding = 0;
	},
	preload: function(){
		//stores the path of the visual assets
		var dir = 'static/img/assets/';
		//loads the background image
		game.load.image('bg', dir + 'background.png');
		game.load.image('kb', dir + 'Keyboard.png');
	},
	create: function(){
		//adds a background image - loading the college ruled 'bg' from the preload function
		paper = game.add.tileSprite(0,0,600,700,'bg');
		//adds a background image - loading the college ruled 'bg' from the preload function
		kb = game.add.tileSprite(100,100,400,171,'kb');
		//adds text to explain the screen
		titleText = game.add.text(50, 10, 'How to play', {font: 'Gloria Hallelujah', fontSize: '60px', fill: '#000' });
		instuctionText = game.add.text(110, 270, 'Press Space to fire', {font: 'Gloria Hallelujah', fontSize: '30px', fill: '#000' });
		instuctionText2 = game.add.text(110, 320, 'Use Arrows to move', {font: 'Gloria Hallelujah', fontSize: '30px', fill: '#000' });
		instuctionText3 = game.add.text(110, 370, 'Press Enter to pause', {font: 'Gloria Hallelujah', fontSize: '30px', fill: '#000' });
		instuctionText4 = game.add.text(110, 640, 'Use the space bar to start the game!', {font: 'Gloria Hallelujah', fontSize: '15px', fill: '#000' });
	},
	update: function(){
			if (space.justDown) {
			newGame();
			}
	},
};


////////////////////////////////////////////////////////
///////////////////   Functions   //////////////////////
////////////////////////////////////////////////////////


function over(item) {
    item.fill = "#808080";
};

function out(item) {
    item.fill = "#000000";
};

function newGame(){
	if (onBoarding < 1) { 
		game.state.start('play');
	}
	if (onBoarding > 0) {
		game.state.start('instruction');
	}
	
};
function viewScores(){
	game.state.start('scores');
};
function mainMenu(){
	game.state.start('main');
}

function createEnemies1(m){
	
	var n = m/4;
	
	//for loop which will create a galaga style grid of enemies
	for( var y = 0; y < n; y++){
		for (var x = 0; x < n; x++){
			var e = enemies1.create(x*125, 60+y*90, 'en1'); //creates an iteration of the enemies1 group
			e.anchor.setTo(.5,.5); //sets the anchor point of the sprite/object in the center
		}//close for loop
	}//close for loop which creates enemies
	
	//divides the map into even spaces for ship placement based off the number of enemies.
	limit = game.width / n;
	
	//sets the initial x,y coordinates of the enemies1 group
	enemies1.x = 75;
	enemies1.y = 75;
	
	//this is a tween which will move the enemies from side to side.
	var tween = game.add.tween(enemies1).to
	({x:limit},	//the sprite initial x will move between the initial X value and 175. Above, this was set to 50, so the enemies have a lateral movement of 100px.
	 1000, 		//sets the speed of movement
	 Phaser.Easing.Linear.None,true,0,1000,true); //eases the animation tween at the rate of 1000.
	
}//closes the createEnemies1 loop

function fireShot() {
	// Get the first laser that's inactive, by passing 'false' as a parameter
	var shot = shots.getFirstExists(false);
	if (shot) {
		// If there are rounds that have yet to be fired, set them to the starting position
		shot.reset(player.x, player.y - 20);
		// Adds velocity to the round, sending it "ahead" at a rate which Phaser.io calles 'arbirtray'
		shot.body.velocity.y = -800;
	}//close shot loop
shotsFired += 1;
}//close fireShot

//this removes the shot from the game so that it doesn't travel off into 'infinity'
function resetShots(shot) {
	shot.kill();
	score -= 25;
	if (score < 0)	{
		score = 0;
	}
	scoreText.text = 'Score: ' + score;
}//close resetShots

function enemyFires () {

    //  Grab the first bullet we can from the pool
    enemyBullet = enemyBullets.getFirstExists(false);
	//sets the length of the array of living enemies
    livingEnemies.length=0;
	//runs the function for every living enemy
    enemies1.forEachAlive(function(enemies1){
        // put every living enemy in an array
        livingEnemies.push(enemies1);
    });
	//checks if there are bullets to fire and enemies to fire them
    if (enemyBullet && livingEnemies.length > 0)
    {
        //picks a shooter at random by creating a random integer
        var random=game.rnd.integerInRange(0,livingEnemies.length-1);

        // randomly select one of them
        var shooter=livingEnemies[random];
        // And fire the bullet from this enemy
        enemyBullet.reset(shooter.body.x, shooter.body.y);
		enemyBullet.body.velocity.y = 800;
        firingTimer = game.time.now + 2000;
    }

}

function hitEnemy1(shot,enemies1){
	shot.kill();						//removes the shot from the canvas and group
	enemies1.kill();					//removes the enemy from the canvas and group				
	particleBurst(enemies1,this);		//releases an "explosion"
	score += 100;						//increases score
	scoreText.text = 'Score: ' + score;	//updates score text
	killCount += 1;						//updates kill count
	en1num -= 1;
}
function collision(player,enemies1){
	player.kill();						//removes the player from the canvas and group
	enemies1.kill();					//removes the enemy from the canvas and group	
	score -= 800;						//player loses 800 of their points on death
	if (score < 0)	{
		score = 0;
	}
	lives -= 1;
	en1num -= 1;
	lifeText.text = 'Lives: ' + lives;	//updtates number of lives remaining
	scoreText.text = 'Score: ' + score;	//updates score text
	particleBurst(enemies1,this);		//releases an "explosion"
	particleBurst(player,this);			//player explodes
}

function gotHit(player,enemyBullets){
	player.kill();						//removes the player from the canvas and group
	enemyBullets.kill();						//removes the enemy from the canvas and group	
	score -= 800;						//player loses 800 of their points on death
	if (score < 0)	{
		score = 0;
	}
	lives -= 1;
	lifeText.text = 'Lives: ' + lives;	//updtates number of lives remaining
	scoreText.text = 'Score: ' + score;	//updates score text		
	particleBurst(player,this);			//player explodes
}


//makes an explosion, linked to the hitEnemy function
function particleBurst(target) {

    //  Position the emitter where the mouse/touch event was
    emitter.x = target.x + target.width/2;
    emitter.y = target.y + target.height/2;

    //  The first parameter sets the effect to "explode" which means all particles are emitted at once
    //  The second gives each particle a 2000ms lifespan
    //  The third is ignored when using burst/explode mode
    //  The final parameter (10) is how many particles will be emitted in this single burst
    emitter.start(true, 500, null, 16);
	//sets the speed at which the particles will move away from the point of the explosion
	emitter.minParticleSpeed.setTo(800,800);
	emitter.maxParticleSpeed.setTo(-800,-800);
	emitter.bounce.setTo(1,1);
}

//resets the player after death
function respawn() {
	player.reset(game.world.centerX, game.world.centerY*1.5);
}

function unpause() {
	//freezes game update
	game.paused = false;
	//reveals the menu from above
	menu.visible = false;
	restartText.visible = false;
	resumeText.visible = false;
	mainText.visible = false;
}

function toMain() {
	game.paused = false;
	game.state.start('main');
	//stops the music from playing
	music.destroy();
}

function restart() {
	game.paused = false;
	music.destroy();
	lives = 3;
	en1num = 16;
	game.state.start('play');
	enemies1.reset();
}

function gameOver() {
	accuracy = killCount/shotsFired;
	accuracy = accuracy*100;
	accuracy = Math.round(accuracy);
	hitText.text = 'Accuracy: ' + accuracy +'%';
	music.destroy();
	enemies1.kill();
	overText.visible = true;
	menu.visible = true;
	menu.y = 280;
	menu.x = 320;
	hitText.visible = true;
	restartText.visible = true;
		restartText.x = 385;
		restartText.y = 310;
	mainText.visible = true;
		mainText.x = 385;
		mainText.y = 360;
	scoreText.x = 120;
	scoreText.y = 300;
	scoreText.angle = 9;
	scoreCard.x = 80;
	scoreCard.y = 280;
	livesCard.visible = false;
	lifeText.visible = false;
	
	highScore(score,accuracy);
}

function highScore(score, accuracy) {
	var x,y;
	
	x = localStorage.getItem("highScore");
	y = Number(x);
	
	if (score > y){
	hScore1 = score.toString();
	hScoreAc1 = accuracy.toString();
	
	localStorage.setItem("highScore", hScore1);
	localStorage.setItem("accuracy", hScoreAc1);
	}
	}

function onBoard() {
	var x,y,z;
	
	x = localStorage.getItem("lastPlay");
	y = new Date();
	z = (y - 86,400,000);
	
	date = y;
	
	
	if (x < z){
		onBoarding = 1;
		welcomeText = "Welcome";
	}
	else {
		onBoarding = 0;
		welcomeText = "Welcome back!";
	}
	}

////////////////////////////////////////////////////////
///////////////////  Game States  //////////////////////
////////////////////////////////////////////////////////

game.state.add('scores', scores);
game.state.add('play', play);
game.state.add('main', main);
game.state.add('instruction', instruction);

game.state.start('main');
