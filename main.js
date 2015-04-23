var piksy = [];
var nextId = 0;
var relX, relY;
var gameLoop;

function start() {
    var gameSpeed;
    var lastUpdate = Date.now();
    gameLoop = setInterval(function () {
        var now = Date.now();
        var deltatime = now - lastUpdate;
        deltatime /= 1000;
        lastUpdate = now;
        gameSpeed = parseFloat(document.getElementById("gamespeed").value);
        if (deltatime < 1) {
            deltatime *= gameSpeed;
            document.getElementById("info").innerHTML = "";
            var canvas = document.getElementById("canvas");
            var ctx = canvas.getContext("2d");
            ctx.fillStyle="#31B404";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            var j;
            piksy.sort(function(a,b){
                if(a.py>b.py){return 1}
                if(a.py<b.py){return -1}
                return 0;
            });
            for (j = 0; j < piksy.length; j++) {
                if (piksy[j].thinkPattern == "none") piksy[j].update(deltatime);
            }
            for (j = 0; j < piksy.length; j++) {
                if (piksy[j].thinkPattern == "plant") piksy[j].update(deltatime);
            }
            for (j = 0; j < piksy.length; j++) {
                if (piksy[j].thinkPattern == "animal") piksy[j].update(deltatime);
            } //update in order, to display correctly
            document.getElementById("info").innerHTML = "Alive: " + piksy.length + "<br>DeltaT: " + (deltatime / gameSpeed).toFixed(4) + "<br> Adjusted DT: " + (deltatime).toFixed(4);
        }
    }, 0);
    piksy.push(new _Green(500, 500));
    piksy.push(new _Fruity(700, 100));
    water.initiate();
    setTimeout(function () {
        piksy.push(new _Black(100, 100));
    }, 2000);
    setTimeout(function () {
        piksy.push(new _Black(100, 500));
    }, 3000);
}
var water = {
    initiate: function () {
        for (var i = 0; i < 32; i++) {
            piksy.push(new _Blue(600 + i * 4, i * 20));
        }
    }
};

function _Piks(x, y) {
    this.vx = 1;
    this.vy = -1;
    this.speed = 40;
    this.px = x;
    this.py = y;
    this.color = "#888";
    this.radius = 10;
    this.adjustedRadius = this.radius;
    this.thinkPattern = "none";
    this.life = 1000;
    this.type = -1;
    this.stayInBounds = function () {
        var canvas = document.getElementById("canvas");
        if (this.px + this.radius > canvas.width) {
            if (this.vx > 0) this.vx = -this.vx;
            var deltaX = (this.px + this.radius) - canvas.width;
            this.px -= deltaX;
        } else if (this.px - this.radius < 0) {
            if (this.vx < 0) this.vx = -this.vx;
            if (this.px < 0) this.px = -this.px;
        }
        if (this.py + this.radius > canvas.height) {
            if (this.vy > 0) this.vy = -this.vy;
            var deltaY = (this.py + this.radius) - canvas.height;
            this.py -= deltaY;
        } else if (this.py - this.radius < 0) {
            if (this.vy < 0) this.vy = -this.vy;
            if (this.py < 0) this.py = -this.py;
        }
    };
    this.update = function (dt) {
        if (this.vx !== 0 || this.vy !== 0) {
            this.px += (this.vx * dt * this.speed);
            this.py += (this.vy * dt * this.speed);
            this.stayInBounds();
        }
        this.draw();
        if (this.thinkPattern == "animal") {
            this.think(dt);
        } else if (this.thinkPattern == "plant") {
            this.grow(dt);
        }
    };
    this.draw = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.px, this.py, this.adjustedRadius, 0, 2 * Math.PI, false);
        ctx.clip();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.px - this.adjustedRadius, this.py - this.adjustedRadius, this.adjustedRadius * 2, this.adjustedRadius * 2);
        ctx.restore();
    };
    this.think = function (dt) {
        this.counter += dt;
        this.fertilitycounter -= dt;
        if (this.counter >= this.cooldown) {
            this.counter -= this.cooldown;
            this.life -= this.cooldown;
            if (this.life <= 0) this.die();
            if (this.fullness > this.fertilitymode && this.fertilitycounter <= 0) {
                var target = this.closest(0);
                if (target == -1) {
                    this.consume();
                } else {
                    if (this.distanceFrom(target) <= this.actionrange) {
                        this.mate(target);
                    } else {
                        this.moveToward(piksy[target].px, piksy[target].py);
                    }
                }
            } else {
                this.consume();
            }
        }
    };
    this.mate = function (target) {
        drawLine(this.px + 8, this.py + 8, piksy[target].px + 8, piksy[target].py + 8, "rgb(200,0,0)", 6);
        this.fertilitycounter = this.fertilityrate;
        piksy[target].fertilitycounter = piksy[target].fertilityrate;
        this.fullness -= this.fertilitymode;
        piksy[target].fullness -= piksy[target].fertilitymode;
        var x = parseInt((this.px + piksy[target].px) / 2);
        var y = parseInt((this.py + piksy[target].py) / 2);
        switch (this.type) {
        case 0:
            piksy.push(new _Black(x, y));
            break;
        case 1:
            piksy.push(new _Red(x, y));
            break;
        case 2:
            piksy.push(new _Green(x, y));
            break;
        case 3:
            piksy.push(new _Blue(x, y));
            break;
        case 3:
            piksy.push(new _Fruity(x, y));
            break;
        }
    };
    this.consume = function () {
        var target = this.closest("plant");
        if (target != -1 && this.fullness < this.full) {
            if (this.distanceFrom(target) <= this.actionrange) {
                this.bite(target);
            } else {
                this.moveToward(piksy[target].px, piksy[target].py);
                this.fast();
            }
        } else {
            this.fast();
        }
    };
    this.bite = function (target) {
        drawLine(this.px, this.py, piksy[target].px, piksy[target].py, "rgb(6,6,6)", 1);
        if (piksy[target].thinkPattern == "plant") {
            if (piksy[target].getBit()) {
                this.fullness++;
            } else {
                this.fast();
            }
        } else if (piksy[target].thinkPattern == "animal") {
            piksy.splice(target, 1);
            this.fullness++;
        }
    };
    this.fast = function () {
        console.log("fasting");
        this.hungercounter++;
        if (this.hungercounter >= this.hungerrate) {
            this.fullness--;
            this.hungercounter -= this.hungerrate;
        }
        if (this.fullness <= -50) this.die();
    };
    this.grow = function (dt) {
        this.counter += dt;
        this.adjustedRadius = this.radius + this.growthstage;
        if (this.counter >= this.cooldown) {
            if (this.immunity > 0) this.immunity -= this.cooldown;
            if (this.immunity < 0) this.immunity = 0;
            this.counter -= this.cooldown;
            if (this.closest(3) != -1) {
                this.color = "#0a0";
                if ((this.growthstage < this.maxgrowth && this.distanceFrom(this.closest(3)) < this.optirange) || this.growthstage < (this.maxgrowth + this.maxgrowth * this.optirange / this.distanceFrom(this.closest(3))) / 2) {
                    var szansa = Math.random() * 100;
                    if (szansa >= (100 - this.growthchance) && sunlightTaken(this.px, this.py) < this.sunlightGrow) {
                        if (this.distanceFrom(this.closest(3)) > this.optirange) {
                            //additional check when distance from water source is greater than optimal
                            szansa = Math.random();
                            if (szansa <= (this.optirange / this.distanceFrom(this.closest(3)))) {
                                this.growthstage++;
                            }
                        } else {
                            this.growthstage++;
                        }
                    }
                    if (this.growthstage >= this.saplingmode) {
                        this.spread();
                    }
                }
            } else {
                this.color = "#aa0";
            }
        }
    };
    this.spread = function () {
        var szansa = Math.random() * 100;
        if (szansa >= (100 - this.spreadchance)) {
            var x = 0;
            var y = 0;
            while (x <= 0 || y <= 0 || x > document.getElementById("canvas").width || y > document.getElementById("canvas").height) {
                x = this.px + Math.random() * this.spreadrange * 2 - this.spreadrange;
                y = this.py + Math.random() * this.spreadrange * 2 - this.spreadrange;
            }
            if (sunlightTaken(x, y) < this.sunlightSpread && freeSpot(x, y)) {
                switch (this.type) {
                case 0:
                    piksy.push(new _Black(x, y));
                    break;
                case 1:
                    piksy.push(new _Red(x, y));
                    break;
                case 2:
                    piksy.push(new _Green(x, y));
                    break;
                case 3:
                    piksy.push(new _Blue(x, y));
                    break;
                case 4:
                    piksy.push(new _Fruity(x, y));
                    break;
                }
                this.growthstage -= this.saplingcost;
            }
        }
    };
    this.moveToward = function (tx, ty) {
        var deltaX = tx - this.px;
        var deltaY = ty - this.py;
        var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        this.vx = deltaX / distance;
        this.vy = deltaY / distance;
    };
    this.closest = function (type) {
        var wynik, najmniejsza;
        najmniejsza = this.range;
        wynik = -1;
        for (var j = 0; j < piksy.length; j++) {
            if (piksy[j].id != this.id && (piksy[j].type == type || piksy[j].thinkPattern == type)) {
                if ((type !== 0 || (piksy[j].fullness >= piksy[j].fertilitymode && piksy[j].fertilitycounter <= 0) && (type != "plant" || piksy[j].immunity === 0))) {
                    //dodatkowe warunki dla roslin i partnerow
                    if (this.distanceFrom(j) < najmniejsza) {
                        najmniejsza = this.distanceFrom(j);
                        wynik = j;
                    }
                }
            }
        }
        return wynik;
    };
    this.distanceFrom = function (target) {
        if (target >= 0) {
            var deltaX = piksy[target].px - this.px;
            var deltaY = piksy[target].py - this.py;
            return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        } else return 10000;
    };
    this.getBit = function () {
        if (this.immunity === 0) {
            this.growthstage--;
            if (this.growthstage === 0) {
                this.die();
            } else {
                this.immunity = this.immunityperiod;
            }
            return 1;
        } else {
            return 0;
        }
    };
    this.die = function () {
        this.DYING = 1;
        for (var g = 0; g < piksy.length; g++) {
            if (piksy[g].DYING) {
                piksy.splice(g, 1);
            }
        }
    };
}
_Black.prototype = new _Piks();
_Black.prototype.constructor = _Black;

function _Black(x, y) {
    this.id = nextId;
    this.displayID = nextId;
    nextId++;
    this.px = x;
    this.py = y;
    this.vx = 1;
    this.vy = 0;
    this.speed = 50;
    this.color = "#000";
    this.thinkPattern = "animal";
    this.radius = 4;
    this.adjustedRadius = this.radius;
    this.cooldown = 0.3; //path check
    this.range = 150;
    this.actionrange = 40;
    this.fullness = 0; //the 'tank' of food
    this.full = 150; //how much is too much
    this.hungercounter = 0; //counting how many consecutive cycles are not eating
    this.hungerrate = 20; //at this many cycles, lose fullness stack
    this.fertilitymode = 100; //how much fullness it needs to mate
    this.fertilityrate = 120; //cooldown between matings
    this.fertilitycounter = 120; //cooldown counter, at 0 or less able to reproduce, goes down 1/s
    this.counter = 0;
    this.life = 600;
    this.type = 0;
}
_Red.prototype = new _Piks();
_Red.prototype.constructor = _Red;

function _Red(x, y) {
    this.id = nextId;
    this.displayID = nextId;
    nextId++;
    this.px = x;
    this.py = y;
    this.vx = 1;
    this.vy = 1;
    this.speed = 120;
    this.color = "#b00";
    this.thinkPattern = "animal";
    this.radius = 12;
    this.adjustedRadius = this.radius;
    this.cooldown = 0.25; //path check
    this.range = 100;
    this.actionrange = 20;
    this.fullness = 0; //the 'tank' of food
    this.full = 100; //how much is too much
    this.hungercounter = 0; //counting how many consecutive cycles are not eating
    this.hungerrate = 20; //at this many cycles, lose fullness stack
    this.fertilitymode = 50; //how much fullness it needs to mate
    this.fertilityrate = 100; //cooldown between matings
    this.fertilitycounter = 0; //cooldown counter
    this.type = 1;
}
_Green.prototype = new _Piks();
_Green.prototype.constructor = _Green;

function _Green(x, y) {
    this.id = nextId;
    this.displayID = nextId;
    nextId++;
    this.px = x;
    this.py = y;
    this.vx = 0;
    this.vy = 0;
    this.color = "#0a0";
    this.image = new Image();
    this.image.src = "pine.png";
    this.thinkPattern = "plant";
    this.radius = 6;
    this.adjustedRadius = this.radius;
    this.sunlightGrow = 200;
    this.sunlightSpread = 120;
    this.cooldown = 2; //growth speed in seconds
    this.growthstage = 2; //starting stage
    this.maxgrowth = 26; //largest possible size
    this.growthchance = 70; //% of cycles it grows in
    this.saplingmode = 7; //when it starts to drop sprouts
    this.saplingcost = 5; //growth stages lost per sprout dropped
    this.spreadchance = 30; //% of cycles it spreads in
    this.spreadrange = 30; //how far an apple falls from the tree (not far)
    this.range = 300; //search range for water source
    this.optirange = 75; //maximum effectivenes (of water) below this distance
    this.actionrange = 50; //range in which it affects new sprouts trying to grow around
    this.immunity = 0;
    this.immunityperiod = 6; //seconds until it becomes edible after being bitten
    this.counter = 0;
    this.type = 2;
    this.draw = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.drawImage(this.image, 0, 0, 128, 128, this.px - this.adjustedRadius, this.py - this.adjustedRadius*2, this.adjustedRadius * 2, this.adjustedRadius * 2);
    };
}
_Blue.prototype = new _Piks();
_Blue.prototype.constructor = _Blue;

function _Blue(x, y) {
    this.id = nextId;
    this.displayID = nextId;
    nextId++;
    this.px = x;
    this.py = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 50;
    this.color = "#2E64FE";
    this.thinkPattern = "none";
    this.radius = 24;
    this.adjustedRadius = this.radius;
    this.cooldown = 5;
    this.range = 100;
    this.actionrange = 50;
    this.type = 3;
}
_Fruity.prototype = new _Piks();
_Fruity.prototype.constructor = _Fruity;

function _Fruity(x, y) {
    this.id = nextId;
    this.displayID = nextId;
    nextId++;
    this.px = x;
    this.py = y;
    this.vx = 0;
    this.vy = 0;
    this.color = "#b0b";
    this.image = new Image();
    this.image.src = "fruit_tree.png";
    this.thinkPattern = "plant";
    this.radius = 7;
    this.adjustedRadius = this.radius;
    this.sunlightGrow = 100;
    this.sunlightSpread = 80;
    this.cooldown = 2; //growth speed in seconds
    this.growthstage = 2; //starting stage
    this.maxgrowth = 15; //largest possible size
    this.growthchance = 90; //% of cycles it grows in
    this.saplingmode = 7; //when it starts to drop sprouts
    this.saplingcost = 4; //growth stages lost per sprout dropped
    this.spreadchance = 30; //% of cycles it spreads in
    this.spreadrange = 50; //how far an apple falls from the tree (not far)
    this.range = 200; //search range for water source
    this.optirange = 50; //maximum effectivenes (of water) below this distance
    this.actionrange = 50; //range in which it affects new sprouts trying to grow around
    this.immunity = 0;
    this.immunityperiod = 4; //seconds until it becomes edible after being bitten
    this.counter = 0;
    this.type = 4;
    this.draw = function () {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.drawImage(this.image, 0, 0, 128, 128, this.px - this.adjustedRadius, this.py - this.adjustedRadius*2, this.adjustedRadius * 2, this.adjustedRadius * 2);
    };
}

function drawLine(sx, sy, ex, ey, style, line) {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.lineWidth = line;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = style;
    ctx.stroke();
    ctx.closePath();
}

function freeSpot(x, y) {
    for (var i = 0; i < piksy.length; i++) {
        var deltaX = piksy[i].px - x;
        var deltaY = piksy[i].py - y;
        var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance < piksy[i].adjustedRadius) {
            return 0;
        }
    }
    return 1;
}

function highlight() {
    var x = relX;
    var y = relY;
    var piks = -1;
    for (var k = 0; k <= 3; k++) {
        for (var i = 0; i < piksy.length && piks == -1; i++) {
            if (piksy[i].type == k) {
                var deltaX = piksy[i].px - x;
                var deltaY = piksy[i].py - y;
                var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                if (distance < piksy[i].adjustedRadius) {
                    piks = i;
                }
            }
        }
    }
    if (piks != -1) {
        piks = piksy[piks];
        document.getElementById("stats").innerHTML = piks.id;
        if (piks.color != "#000000") {
            document.getElementById("stats").color = "#000000";
        }
    }
}

function mouseMove(event) {
    var x = event.clientX;
    var y = event.clientY;
    relX = parseInt(x) - document.getElementById("canvas").getBoundingClientRect().left;
    relY = parseInt(y) - document.getElementById("canvas").getBoundingClientRect().top;
}

function sunlightTaken(x, y) {
    var takenSunlight = 0;
    for (var i = 0; i < piksy.length; i++) {
        var obj = piksy[i];
        if (obj.thinkPattern == "plant" && obj.px > x - obj.actionrange && obj.px < x + obj.actionrange && obj.py > y - obj.actionrange && obj.py < y + obj.actionrange) {
            takenSunlight += (obj.radius + obj.growthstage);
        }
    }
    return takenSunlight;
}

function getPiksById(id) {
    for (var i = 0; i < piksy.length; i++) {
        if (piksy[i].id == id) return piksy[i];
    }
    return -1;
}