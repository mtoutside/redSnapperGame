let sketch = function(s) {
    window.s = s;
    let flock;
    let player;
    let enemy = [];
    let count = 0;
    const wrapper = document.querySelector('.menu__wrapper');
    const title = document.querySelector('.titlearea');
    const gl = snow_modules_opengl_web_GL.gl;


    s.preload = function() {
        window.fluidFieldScale = {w: gpu_fluid_main.fluid.velocityRenderTarget.width / window.innerWidth,
            h: gpu_fluid_main.fluid.velocityRenderTarget.height / window.innerHeight }; // flow field is of size 324 * 233

        let swapFragShader = async function swapFragShader (shader, shaderLoc) {
            let resp = await fetch(shaderLoc);
            shader._fragSource = await resp.text();
            console.log(shader._fragSource);
            shader.create();
        };
        swapFragShader(gpu_fluid_main.fluid.applyForcesShader, "/shaders/glsl/mouseforce.frag.glsl");

        let swapVertShader = async function swapFragShader (shader, shaderLoc, beforeCreate) {
            let resp = await fetch(shaderLoc);
            shader._vertSource = await resp.text();
            if (beforeCreate) beforeCreate(shader);
            shader.create();
        };
        swapVertShader(gpu_fluid_main.renderParticlesShader, "/shaders/glsl/renderparticleshader.vert");

        // サウンドファイル
        bgm = s.loadSound('/assets/sounds/bgm.mp3');
        eat = s.loadSound('/assets/sounds/eat.mp3');
        end = s.loadSound('/assets/sounds/end.mp3');

        //フォントファイル
        myFont = s.loadFont('/assets/fonts/PressStart2P.ttf');
    }

    s.setup = function() {
        s.createCanvas(s.windowWidth, s.windowHeight);

        flock = new Flock();
        window.flock = flock;
        for (let i = 0; i < 40; i++) {
            let b = new Boid(s.width / 2,s.height / 2);
            flock.addBoid(b);
        }

        player = new Player();
        enemy.push(new Enemy());

        bgm.setVolume(0.3); //音量調整
        bgm.loop();
    };


    s.windowResized = function() {
        s.resizeCanvas(s.windowWidth, s.windowHeight);
    }

    setInterval(function() {
        if(enemy.length < 20) {
            enemy.push(new Enemy());
        }
    }, 20 * 1000);

    setInterval(function() {
        if(flock.boids.length < 150) {
            let areaX = s.random(0, s.width);
            let areaY = s.random(0, s.height);
            for (let i = 0; i < 20; i++) {
                let b = new Boid(s.random(areaX - 60, areaX + 60), s.random(areaY - 30, areaY + 30));
                flock.addBoid(b);
            }
        }
    }, 20 * 1000);

    s.draw = function() {

        if(gameOver) {
            s.noLoop();
            bgm.stop();
        }
        s.clear();
        flock.run();

        for(let i in enemy) {
            enemy[i].render();

            // 敵とプレイヤーの当たり判定
            if(enemy[i].hits(player)) {
                enemy = [];
                flock.boids = [];
                gameOver = true;
                isRunning = false;
                end.play();

                // 結果画面生成
                endText = s.createP('GAME OVER');
                scoreText = s.createP(`Score: ${count}`);
                endText.class('title');
                scoreText.class('score');
                endText.parent(title);
                scoreText.parent(title);
                menu.classList.toggle('none');
                howto.classList.toggle('none');
                break;

            }

            enemy[i].arrive(player.position.x, player.position.y);
            enemy[i].separate(enemy);
            enemy[i].update();
            enemy[i].edges();
        }

        player.render();
        player.move();
        player.turn();
        player.update();
        player.edges();

        // 左上のスコア表示
        s.textSize(30);
        s.textFont(myFont);
        s.fill(242, 58, 12);
        s.text(`Score:${count}`, 10, 50);

    };


    s.keyReleased = function() {
        player.setRotation(0);
        player.boosting(false);
    }

    /**
     * player
     *
     * @returns {null}
     */
	Player = function() {
		this.position = s.createVector(s.random(s.width), s.height / s.random(1, 5));
		this.r = 15;
		this.heading = 0;
		this.rotation = 0;
		this.vel = s.createVector(0, 0);
		this.isBoosting = false;
        this.theta = 0;
        this.color = { filet: s.color(242, 166, 118), body: s.color(242, 58, 12) };

        this.move = function() {
            if(s.keyIsDown(s.RIGHT_ARROW)) {
                player.setRotation(0.1);
            } else if(s.keyIsDown(s.LEFT_ARROW)) {
                player.setRotation(-0.1);
            } else if(s.keyIsDown(s.UP_ARROW)) {
                player.boosting(true);
            }
        }

		this.boosting = function(b) {
			this.isBoosting = b;
		}

		this.update = function() {
			if(this.isBoosting) {
				this.boost();
			}
            
            this.theta += s.PI / 100;
			this.position.add(this.vel);
			this.vel.mult(0.95);
		}

		this.boost = function() {
			let force = p5.Vector.fromAngle(this.heading);
			force.mult(0.5);
			this.vel.add(force);
		}

		this.hits = function(boids) {
			let d = s.dist(this.position.x, this.position.y, boids.position.x, boids.position.y);
			if(d < this.r + boids.r) {
				return true;
			} else {
				return false;
			}
		}

		this.render = function() {
			s.push();
            s.noStroke();
			s.translate(this.position.x, this.position.y);
			s.rotate(this.heading + s.PI / 2);
            s.translate(0, -12); //回転軸を体の真ん中に

            // 左右のヒレ
            for(let i = -1; i <= 1; i +=2) {
                s.push();
                s.fill(this.color.filet);
                s.translate(0, 10);
                s.rotate((s.PI / 12) * s.sin(this.theta * 2) * i);

                s.beginShape();
                s.vertex(0, 0);
                s.vertex(12 * i, 4);
                s.vertex(10 * i, 10);
                s.vertex(0, 4);
                s.endShape();
                s.pop();
            }

            // しっぽ
            s.push();
            s.fill(this.color.filet);
            s.translate(0, 25);
            s.rotate((s.PI / 12) * s.sin(this.theta * 2));
            s.beginShape();
            s.vertex(0, 0);
            s.bezierVertex(0, 0, 5, 5, 3, 15);
            s.bezierVertex(3, 15, 0, 8, 0, 8);
            s.bezierVertex(0, 8, 0, 8, -3, 15);
            s.bezierVertex(-3, 15, -5, 5, 0, 0);
            s.endShape();
            s.pop();

            //胴体
            s.beginShape();
            s.fill(this.color.body);
            s.vertex(0, 30);
            s.bezierVertex(0, 30, -10, 10, 0, 0);
            s.bezierVertex(0, 0, 10, 10, 0, 30);
            s.endShape();
            s.pop();
        }

        this.edges = function() {
            if (this.position.x < -this.r)  this.position.x = s.width + this.r;
            if (this.position.y < -this.r)  this.position.y = s.height + this.r;
            if (this.position.x > s.width + this.r) this.position.x = -this.r;
            if (this.position.y > s.height + this.r) this.position.y = -this.r;
        }

        this.setRotation = function(a) {
            this.rotation = a;
        }

        this.turn = function() {
            this.heading += this.rotation;
        }
    }

    /**
     * Enemy
     *
     * @returns {null}
     */
	Enemy = function() {
		this.position = s.createVector(s.random(s.width), s.random(s.height));
		this.r = 8;
		this.velocity = s.createVector(0, 0);
        this.theta = 0;
        this.heading = s.radians(90);
        this.color = { filet: s.color(133, 255, 14), body: s.color(144, 169, 122) };
        this.acceleration = s.createVector(0, 0);
        this.maxspeed = s.random(4, 8);
        this.maxforce = 0.4;

        this.applyForce = function(force) {
            this.acceleration.add(force);
        };

        this.update = function() {
            this.velocity.add(this.acceleration);
            this.velocity.limit(this.maxspeed);
            this.position.add(this.velocity);
            this.acceleration.mult(0);
            this.theta += s.PI / 100;
        };

        this.seek = function(target) {
            let desired = p5.Vector.sub(target,this.position);
            this.heading = s.atan2(desired.y, desired.x) + s.radians(90);
            desired.normalize();
            desired.mult(this.maxspeed);
            let steer = p5.Vector.sub(desired,this.velocity);
            steer.limit(this.maxforce);
            return steer;
        };

        // Arrive
        this.arrive = function(x, y) {
            let target = s.createVector(x, y);
            let neighbordist = s.max(s.width, s.height);

            let d = p5.Vector.dist(this.position,target);
            let steer = s.createVector(0, 0);

            if ((d > 0) && (d < neighbordist)) {
                steer = this.seek(target);
            }
            steer.mult(3);
            steer.limit(this.maxforce);
            this.applyForce(steer);
        }

        this.hits = function(player) {
            let d = s.dist(this.position.x, this.position.y, player.position.x, player.position.y);
            if(d < this.r + player.r) {
                return true;
            } else {
                return false;
            }
        }

        // Separation
        this.separate = function(enemy) {
            let desiredseparation = 25.0;
            let steer = s.createVector(0, 0);
            let count = 0;
            for (let i = 0; i < enemy.length; i++) {
                let d = p5.Vector.dist(this.position,enemy[i].position);
                if ((d > 0) && (d < desiredseparation)) {
                    let diff = p5.Vector.sub(this.position, enemy[i].position);
                    diff.normalize();
                    diff.div(d);
                    steer.add(diff);
                    count++;
                }
            }
            if (count > 0) {
                steer.div(count);
            }
            if (steer.mag() > 0) {
                steer.normalize();
                steer.mult(this.maxspeed);
                steer.sub(this.velocity);
                steer.limit(this.maxforce);
            }
            steer.mult(1.5);
            steer.limit(this.maxforce);
            this.applyForce(steer);
        };

        this.render = function() {
            s.push();
            s.noStroke();
            s.translate(this.position.x, this.position.y);
            s.rotate(this.heading);
            s.translate(0, -12); //回転軸を体の真ん中に

            // 左右のヒレ
            for(let i = -1; i <= 1; i +=2) {
                s.push();
                s.fill(this.color.filet);
                s.translate(0, 10);
                s.rotate((s.PI / 12) * s.sin(this.theta * 2) * i);

                s.beginShape();
                s.vertex(0, 0);
                s.vertex(12 * i, 4);
                s.vertex(10 * i, 10);
                s.vertex(0, 4);
                s.endShape();
                s.pop();
            }

            // しっぽ
            s.push();
            s.fill(this.color.filet);
            s.translate(0, 25);
            s.rotate((s.PI / 12) * s.sin(this.theta * 2));
            s.beginShape();
            s.vertex(0, 0);
            s.bezierVertex(0, 0, 5, 5, 3, 15);
            s.bezierVertex(3, 15, 0, 8, 0, 8);
            s.bezierVertex(0, 8, 0, 8, -3, 15);
            s.bezierVertex(-3, 15, -5, 5, 0, 0);
            s.endShape();
            s.pop();

            //胴体
            s.beginShape();
            s.fill(this.color.body);
            s.vertex(0, 30);
            s.bezierVertex(0, 30, -10, 10, 0, 0);
            s.bezierVertex(0, 0, 10, 10, 0, 30);
            s.endShape();
            s.pop();

        }

        this.edges = function() {
            if (this.position.x < -this.r)  this.position.x = s.width + this.r;
            if (this.position.y < -this.r)  this.position.y = s.height + this.r;
            if (this.position.x > s.width + this.r) this.position.x = -this.r;
            if (this.position.y > s.height + this.r) this.position.y = -this.r;
        }
    }

    // The Nature of Code
    // Daniel Shiffman
    // http://natureofcode.com

    // Flock object
    // Does very little, simply manages the array of all the boids

    Flock = function() {
        // An array for all the boids
        this.boids = []; // Initialize the array
    };

    Flock.prototype.run = function() {
        for (let i = this.boids.length - 1; i >= 0;  i--) {
            this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually

            //小魚に衝突した時
            if(player.hits(this.boids[i])) {
                eat.play();
                this.boids.splice(i, 1);
                count++;
            }
        }
    };


    Flock.prototype.addBoid = function(b) {
        this.boids.push(b);
    };

    // 速度場のピクセルを読み取る
    readVelocityAt = function (x, y) {
        let pixel = new Float32Array(4); //1pxの情報を格納する配列 RGBAだから4.
        let velocityFBO = gpu_fluid_main.fluid.velocityRenderTarget.readFrameBufferObject;
        gl.bindFramebuffer(gl.FRAMEBUFFER, velocityFBO);   //velocityFBOをcurrentに
        gl.readPixels(Math.floor(fluidFieldScale.w * x),
            Math.floor(fluidFieldScale.h * y),
            1,1,gl.RGBA, gl.FLOAT, pixel); //pixelに読み込む
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);          //FBOを戻す
        return s.createVector( pixel[0], pixel[1] );
    };

    Boid = function(x, y) {
        this.acceleration = s.createVector(0, 0);
        this.velocity = s.createVector(s.random(-1, 1), s.random(-1, 1));
        this.position = s.createVector(x, y);
        this.r = s.random(2.5, 5.0);
        this.maxspeed = 4;    // Maximum speed
        this.maxforce = 0.2; // Maximum steering force
    };

    Boid.prototype.run = function(boids) {
        this.flock(boids);
        this.avoid(player.position.x, player.position.y);
        for(let i = enemy.length -1; i >= 0; i--) {
            this.avoid(enemy[i].position.x, enemy[i].position.y);
        }
        this.follow();
        this.update();
        this.borders();
        this.render();
    };

    Boid.prototype.applyForce = function(force) {
        // We could add mass here if we want A = F / M
        this.acceleration.add(force);
    };

    // We accumulate a new acceleration each time based on three rules
    Boid.prototype.flock = function(boids) {
        let sep = this.separate(boids);   // Separation
        let ali = this.align(boids);      // Alignment
        let coh = this.cohesion(boids);   // Cohesion
        // Arbitrarily weight these forces
        sep.mult(1.5);
        ali.mult(1.0);
        coh.mult(0.8);
        // Add the force vectors to acceleration
        this.applyForce(sep);
        this.applyForce(ali);
        this.applyForce(coh);

    };

    // 速度場の流れに従う
    Boid.prototype.follow = function() {
        let desired = readVelocityAt(Math.floor(window.innerWidth - this.position.x), Math.floor(window.innerHeight - this.position.y));
        desired.normalize();
        desired.mult(this.maxspeed);

        let steer = p5.Vector.sub(desired, this.velocity);
        steer.mult(1.5);
        steer.limit(this.maxforce);
        this.applyForce(steer);
    }

    // Method to update location
    Boid.prototype.update = function() {
	// Update velocity
	this.velocity.add(this.acceleration);
	// Limit speed
        this.velocity.limit(this.maxspeed);
	this.position.add(this.velocity);
	// Reset accelertion to 0 each cycle
	this.acceleration.mult(0);
    };

    // A method that calculates and applies a steering force towards a target
    // STEER = DESIRED MINUS VELOCITY
    Boid.prototype.seek = function(target) {
        let desired = p5.Vector.sub(target,this.position);  // A vector pointing from the location to the target
        // Normalize desired and scale to maximum speed
        desired.normalize();
        desired.mult(this.maxspeed);
        // Steering = Desired minus Velocity
        let steer = p5.Vector.sub(desired,this.velocity);
        steer.limit(this.maxforce);  // Limit to maximum steering force
        return steer;
    };

    Boid.prototype.render = function() {
        // Draw a triangle rotated in the direction of velocity
        let theta = this.velocity.heading() + s.radians(90);
        s.noStroke();
        s.fill(170, 120, 155);
        s.push();
        s.translate(this.position.x, this.position.y);
        s.rotate(theta);
        s.beginShape();
        s.curveVertex(0, -1.5 * this.r * 1.0);
        s.curveVertex(0.5 * this.r * 1.5, 0);
        s.curveVertex(0, 2.5 * this.r * 1.5);
        s.curveVertex(-0.5 * this.r * 1.5, 0);
        s.curveVertex(0, -1.5 * this.r * 1.0);
        s.curveVertex(0.5 * this.r * 1.5, 0);
        s.curveVertex(0, 2.5 * this.r * 1.5);
        s.endShape(s.CLOSE);
        s.pop();
    };

    // Wraparound
    Boid.prototype.borders = function() {
        if (this.position.x < -this.r)  this.position.x = s.width + this.r;
        if (this.position.y < -this.r)  this.position.y = s.height + this.r;
        if (this.position.x > s.width + this.r) this.position.x = -this.r;
        if (this.position.y > s.height + this.r) this.position.y = -this.r;
    };

    // Separation
    // Method checks for nearby boids and steers away
    Boid.prototype.separate = function(boids) {
        let desiredseparation = 25.0;
        let steer = s.createVector(0, 0);
        let count = 0;
        // For every boid in the system, check if it's too close
        for (let i = 0; i < boids.length; i++) {
            let d = p5.Vector.dist(this.position,boids[i].position);
            // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
            if ((d > 0) && (d < desiredseparation)) {
                // Calculate vector pointing away from neighbor
                let diff = p5.Vector.sub(this.position, boids[i].position);
                diff.normalize();
                diff.div(d);        // Weight by distance
                steer.add(diff);
                count++;            // Keep track of how many
            }
        }
        // Average -- divide by how many
        if (count > 0) {
            steer.div(count);
        }

        // As long as the vector is greater than 0
        if (steer.mag() > 0) {
            // Implement Reynolds: Steering = Desired - Velocity
            steer.normalize();
            steer.mult(this.maxspeed);
            steer.sub(this.velocity);
            steer.limit(this.maxforce);
        }
        return steer;
    };

    // Alignment
    // For every nearby boid in the system, calculate the average velocity
    Boid.prototype.align = function(boids) {
        let neighbordist = 50;
        let sum = s.createVector(0,0);
        let count = 0;
        for (let i = 0; i < boids.length; i++) {
            let d = p5.Vector.dist(this.position,boids[i].position);
            if ((d > 0) && (d < neighbordist)) {
                sum.add(boids[i].velocity);
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            sum.normalize();
            sum.mult(this.maxspeed);
            let steer = p5.Vector.sub(sum, this.velocity);
            steer.limit(this.maxforce);
            return steer;
        } else {
            return s.createVector(0, 0);
        }
    };

    // Cohesion
    // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
    Boid.prototype.cohesion = function(boids) {
        let neighbordist = 50;
        let sum = s.createVector(0, 0);   // Start with empty vector to accumulate all locations
        let count = 0;
        for (let i = 0; i < boids.length; i++) {
            let d = p5.Vector.dist(this.position,boids[i].position);
            if ((d > 0) && (d < neighbordist)) {
                // sum.add(s.mouseX, s.mouseY);  // Chaseing mouse
                sum.add(boids[i].position); // Add location
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            return this.seek(sum);  // Steer towards the location
        } else {
            return s.createVector(0, 0);
        }
    };

    // Avoid
    // Avoiding from target
    Boid.prototype.avoid = function(x, y) {
        let target = s.createVector(x, y);
        let neighbordist = 250;

        let d = p5.Vector.dist(this.position,target);
        let steer = s.createVector(0, 0);

        if ((d > 0) && (d < neighbordist)) {
            steer = this.seek(target);
            steer.mult(-1);
        }
        steer.mult(3);
        steer.limit(this.maxforce);
        this.applyForce(steer);
    }
};
