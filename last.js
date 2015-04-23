var piksy=[];
var nextId=0;
var relX, relY;
function start(){
    var gameSpeed;
	var lastUpdate = Date.now();
	setInterval(function(){
		var now = Date.now();
		var deltatime = now - lastUpdate;
	    deltatime/=1000;
		lastUpdate = now;
        gameSpeed=parseFloat(document.getElementById("gamespeed").value);
        if(deltatime<1){
            deltatime*=gameSpeed;
            document.getElementById("info").innerHTML="";
            var canvas=document.getElementById("canvas");
            var ctx=canvas.getContext("2d");
            ctx.clearRect (0,0,canvas.width,canvas.height );
            var j;
            for(j=0;j<piksy.length;j++){
                if(piksy[j].type==3)piksy[j].update(deltatime);
            }
            for(j=0;j<piksy.length;j++){
                if(piksy[j].type==1)piksy[j].update(deltatime);
            }
            for(j=0;j<piksy.length;j++){
                if(piksy[j].type===2)piksy[j].update(deltatime);
            }
            for(j=0;j<piksy.length;j++){
                if(piksy[j].type===0)piksy[j].update(deltatime);
            }       //update order: water, plants, prey, predator
            document.getElementById("info").innerHTML="Alive: "+piksy.length+"<br>DeltaT: "+(deltatime/gameSpeed).toFixed(4)+"<br> Adjusted DT: "+(deltatime).toFixed(4);
        }
	},0);
    piksy.push(new _Green(600, 300));
    piksy.push(new _Green(600, 500));
    water.initiate();
    setTimeout(function(){piksy.push(new _Black(100, 200));}, 1000);
    setTimeout(function(){piksy.push(new _Black(100, 200));}, 5000);
}
var water = {
    initiate : function(){
        for(var i=0; i<32; i++){
            piksy.push(new _Blue(600+i*4, i*20));
        }
        piksy.push(new _Blue(300, 500));
        piksy.push(new _Blue(300, 510));
        piksy.push(new _Blue(310, 500));
        piksy.push(new _Blue(305, 510));
        piksy.push(new _Blue(305, 515));
        piksy.push(new _Blue(315, 510));
    }
};
function _Black(x, y){
    this.vx=1;
    this.vy=0;
    this.speed=80;
    this.px=x;
    this.py=y;
    this.predator=1;
    this.color="#000";
    this.radius=8;
    this.cooldown=0.25;      //path check
    this.range=100;
    this.actionrange=20;
    this.fullness=0;
    this.hungercounter=0;
    this.hungerrate=20;
    this.fertilitymode=50;
    this.fertilityrate=50;
    this.fertilitycounter=0;
    this.counter=0;
    this.stayInBounds = function(){
        var canvas = document.getElementById("canvas");
        if(this.px + this.radius> canvas.width){
            if(this.vx>0)this.vx = -this.vx;
            var deltaX =  (this.px + this.radius) - canvas.width;
            this.px-=deltaX;
        } else if(this.px - this.radius<0){
            if(this.vx<0)this.vx = -this.vx;
            if(this.px<0)this.px = -this.px;
        }
        if(this.py + this.radius> canvas.height){
            if(this.vy>0)this.vy = -this.vy;
            var deltaY =  (this.py + this.radius) - canvas.height;
            this.py-=deltaY;
        } else if(this.py - this.radius<0){
            if(this.vy<0)this.vy = -this.vy;
            if(this.py<0)this.py = -this.py;
        }
    };
    this.update=function(dt){
        this.px+=(this.vx*dt*this.speed);
        this.py+=(this.vy*dt*this.speed);
        this.stayInBounds();
        this.draw();
        if(this.fertilitycounter>0)this.fertilitycounter--;
        this.seek(dt);
    };
    this.mate=function(target){
        drawLine(this.px+8, this.py+8, piksy[target].px+8, piksy[target].py+8, "rgb(255,0,0)", 7);
        this.fertilitycounter=this.fertilityrate;
        piksy[target].fertilitycounter=piksy[target].fertilityrate;
        this.fullness-=this.fertilitymode;
        piksy[target].fullness-=piksy[target].fertilitymode;
        var x = parseInt((this.px+piksy[target].px)/2);
        var y = parseInt((this.py+piksy[target].py)/2);
        piksy.push(new _Black(x, y));
        piksy[piksy.length-1].fertilitycounter=2000;
    };
    this.bite=function(target){
        drawLine(this.px, this.py, piksy[target].px, piksy[target].py, "rgb(6,6,6)", 3);
        if(piksy[target].type==2){
            if(piksy[target].getBitten()){
                this.fullness++;
            } else {
                this.fast();
            }
        }else if(piksy[target].type==1){
            piksy.splice(target,1);
            this.fullness++;
        }
    };
    this.die=function(){
        this.DYING=1;
        for(var g=0; g<piksy.length;g++){
            if(piksy[g].DYING){
                piksy.splice(g,1);
            }
        }
    };
    this.closest = function(type){
        var wynik, najmniejsza;
        najmniejsza=this.range;
        wynik=-1;
        for(var j=0; j<piksy.length; j++){
            if(piksy[j].id!=this.id && piksy[j].type==type){
                if((type!==0 || (piksy[j].fullness>=piksy[j].fertilitymode && piksy[j].fertilitycounter===0) && (type!=2 || piksy[j].immunity===0))){
                    //dodatkowe warunki dla roslin i partnerow
                    if (this.distanceFrom(j)<najmniejsza){
                        najmniejsza=this.distanceFrom(j);
                        wynik=j;
                    }
                }
            }
        }
        return wynik;
    };
    this.seek=function(dt){
        this.counter+=dt;
        if(this.counter>=this.cooldown){
            this.counter-=this.cooldown;
            if(this.fullness>this.fertilitymode){
                var target = this.closest(0);
                if(target==-1){
                    this.consume();
                } else {
                    if(this.distanceFrom(target)<=this.actionrange){
                        this.mate(target);
                    } else {
                        this.moveToward(piksy[target].px, piksy[target].py);
                    }
                }
            } else {
                this.consume();
            }
        }
        //document.getElementById("info").innerHTML+=this.id + ": "+ this.fullness + "<br>";
    };
    this.distanceFrom = function(target){
        if(target>=0){
            var deltaX = piksy[target].px - this.px;
            var deltaY = piksy[target].py - this.py;
            return Math.sqrt(deltaX*deltaX + deltaY*deltaY);
        } else return 10000;
    };
    this.consume=function(){
        var distance1 = this.distanceFrom(this.closest(1));
        var distance2 = this.distanceFrom(this.closest(2));
        //var distance3 = this.distanceFrom(this.closest(3));
        //var distanceT = Math.min(distance1, distance2, distance3);
        var distanceT = Math.min(distance1, distance2);
        var target;
        if(distanceT==distance1)target=this.closest(1);
        else if(distanceT==distance2)target=this.closest(2);
        //else if(distanceT==distance3)target=this.closest(3);
        if(target!=-1) {
            if(this.distanceFrom(target)<=this.actionrange){
                this.bite(target);
            } else {
                this.moveToward(piksy[target].px, piksy[target].py);
                this.fast();
            }
        } else {
            this.fast();
        }
    };
    this.fast = function(){
            this.hungercounter++;
            if(this.hungercounter>=this.hungerrate){
                this.fullness--;
                this.hungercounter-=this.hungerrate;
            }
            if(this.fullness<=-50)this.die();
    };
    this.moveToward = function(tx, ty){
        var deltaX = tx - this.px;
        var deltaY = ty - this.py;
        var distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
        this.vx = deltaX / distance;
        this.vy = deltaY / distance;
    };
    this.type=0;
    this.id=nextId;
    nextId++;
    this.draw = function(){
        var canvas=document.getElementById("canvas");
        var ctx=canvas.getContext("2d");
        //ctx.fillStyle=this.color;
        //ctx.fillRect(this.px,this.py,this.radius,this.radius);
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.px, this.py, this.radius, 0, 2 * Math.PI, false);
        ctx.clip();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.px - this.radius, this.py - this.radius, this.radius * 2, this.radius * 2);
        ctx.restore(); 
    };
}
function _Red(x, y){
    this.vx=1;    //vector
    this.vy=1;
    this.speed=100;
    this.px=x;   //position
    this.py=y;
    this.color="#F00";
    this.radius=12;
    this.cooldown=2;        //path check
    this.range=100;
    this.actionrange=20;
    this.stayInBounds = function(){
        var canvas = document.getElementById("canvas");
        if(this.px + this.radius> canvas.width){
            if(this.vx>0)this.vx = -this.vx;
            var deltaX =  (this.px + this.radius) - canvas.width;
            this.px-=deltaX;
        } else if(this.px - this.radius<0){
            if(this.vx<0)this.vx = -this.vx;
            if(this.px<0)this.px = -this.px;
        }
        if(this.py + this.radius> canvas.height){
            if(this.vy>0)this.vy = -this.vy;
            var deltaY =  (this.py + this.radius) - canvas.height;
            this.py-=deltaY;
        } else if(this.py - this.radius<0){
            if(this.vy<0)this.vy = -this.vy;
            if(this.py<0)this.py = -this.py;
        }
    };
    this.update=function(dt){
        this.px+=(this.vx*dt*this.speed);
        this.py+=(this.vy*dt*this.speed);
        this.stayInBounds();
        this.draw();
    };
    this.type=1;
    this.id=nextId;
    nextId++;
    this.draw = function(){
        var canvas=document.getElementById("canvas");
        var ctx=canvas.getContext("2d");
        //ctx.fillStyle=this.color;
        //ctx.fillRect(this.px,this.py,this.radius,this.radius);
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.px, this.py, this.radius, 0, 2 * Math.PI, false);
        ctx.clip();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.px - this.radius, this.py - this.radius, this.radius * 2, this.radius * 2);
        ctx.restore(); 
    };
}
function _Green(x, y){
    this.px=x;
    this.py=y;
    this.color="#0a0";
    this.radius=6;
    this.cooldown=2;     //growth speed in seconds
    this.growthstage=2;     //starting stage
    this.maxgrowth=15;      //largest possible size
    this.growthchance=50;   //% of cycles it grows in
    this.saplingmode=7;     //when it starts to drop sprouts
    this.saplingcost=5;     //growth stages lost per sprout dropped
    this.spreadchance=25;   //% of cycles it spreads in
    this.spreadrange=30;    //how far an apple falls from the tree (not far)
    this.range=300;         //search range for water source
    this.optirange=60;     //maximum effectivenes (of water) below this distance
    this.actionrange=50;    //range in which it affects new sprouts trying to grow around
    this.immunity=0;
    this.immunityperiod=3;  //seconds until it becomes edible after being bitten
    this.counter=0;
    this.type=2;
    this.id=nextId;
    nextId++;
    this.update=function(dt){
        this.counter+=dt;
        if(this.immunity>0)this.immunity-=dt;
        if(this.immunity<0)this.immunity=0;
        if(this.counter>=this.cooldown){
            this.counter-=this.cooldown;
            if(this.closest(3)!=-1){
                this.color="#0a0";
                if(this.growthstage<this.maxgrowth)this.grow();
                if(this.growthstage>=this.saplingmode){
                    this.spread();
                }
            }else{
                this.color="#aa0";
            }
        }
        this.draw();
    };
    this.closest = function(type){
        var wynik, najmniejsza;
        najmniejsza=this.range;
        wynik=-1;
        for(var j=0; j<piksy.length; j++){
            if(piksy[j].id!=this.id && piksy[j].type==type){
                if((type!==0 || (piksy[j].fullness>=piksy[j].fertilitymode && piksy[j].fertilitycounter===0) && (type!=2 || piksy[j].immunity===0))){
                    //dodatkowe warunki dla roslin i partnerow
                    if (this.distanceFrom(j)<najmniejsza){
                        najmniejsza=this.distanceFrom(j);
                        wynik=j;
                    }
                }
            }
        }
        return wynik;
    };
    this.distanceFrom = function(target){
        if(target>=0){
            var deltaX = piksy[target].px - this.px;
            var deltaY = piksy[target].py - this.py;
            return Math.sqrt(deltaX*deltaX + deltaY*deltaY);
        } else return 10000;
    };
    this.grow = function(){
        var szansa = Math.random()*100;
        if(szansa>=(100-this.growthchance) && sunlightTaken(this.px, this.py)<4000){
            if(this.distanceFrom(this.closest(3))>this.optirange){
                //additional check when distance from water source is greater than optimal
                szansa=Math.random();
                if(szansa<=(this.optirange/this.distanceFrom(this.closest(3)))){
                    this.growthstage++;
                }
            }else{
                this.growthstage++;
            }
        }
    };
    this.spread = function(){
        var szansa = Math.random()*100;
        if(szansa>=(100-this.spreadchance)){
            var x = 0;
            var y = 0;
            while(x<=0 || y<=0 || x>document.getElementById("canvas").width || y>document.getElementById("canvas").height){
                x = this.px + Math.random()*this.spreadrange*2 - this.spreadrange;
                y = this.py + Math.random()*this.spreadrange*2 - this.spreadrange;
            }
            if(sunlightTaken(x, y)<2000 && freeSpot(x, y)){
                piksy.push(new _Green(x, y));
                this.growthstage-=this.saplingcost;
            }
        }
    };
    this.getBitten = function(){
        if(this.immunity===0){
            this.growthstage--;
            if(this.growthstage===0){
                this.die();
            } else{
                this.immunity=this.immunityperiod;
            }
            return 1;
        }else {
            return 0;
        }
    };
    this.die=function(){
        this.DYING=1;
        for(var g=0; g<piksy.length;g++){
            if(piksy[g].DYING){
                piksy.splice(g,1);
            }
        }
    };
    this.draw = function(){
        var adjustedRadius = this.radius+this.growthstage;
        var canvas=document.getElementById("canvas");
        var ctx=canvas.getContext("2d");
        //ctx.fillStyle=this.color;
        //ctx.fillRect(this.px,this.py,this.radius,this.radius);
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.px, this.py, adjustedRadius, 0, 2 * Math.PI, false);
        ctx.clip();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.px - adjustedRadius, this.py - adjustedRadius, adjustedRadius * 2, adjustedRadius * 2);
        ctx.restore(); 
    };
}
function _Blue(x, y){
    this.vx=0;
    this.vy=0;
    this.speed=50;
    this.px=x;
    this.py=y;
    this.color="#2E64FE";
    this.radius=24;
    this.cooldown=5;        //collision check
    this.range=100;
    this.actionrange=50;
    this.stayInBounds = function(){
        var canvas = document.getElementById("canvas");
        if(this.py>canvas.height){
            this.px=x;
            this.py=y;
        }
    };
    this.update=function(dt){
        if(this.vx!==0 || this.vy!==0){
            this.px+=(this.vx*dt*this.speed);
            this.py+=(this.vy*dt*this.speed);
            this.stayInBounds();
        }
        this.draw();
    };
    this.type=3;
    this.id=nextId;
    nextId++;
    this.draw = function(){
        var canvas=document.getElementById("canvas");
        var ctx=canvas.getContext("2d");
        //ctx.fillStyle=this.color;
        //ctx.fillRect(this.px,this.py,this.radius,this.radius);
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.px, this.py, this.radius, 0, 2 * Math.PI, false);
        ctx.clip();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.px - this.radius, this.py - this.radius, this.radius * 2, this.radius * 2);
        ctx.restore(); 
    };
}
function drawLine(sx, sy, ex, ey, style, line){
    var canvas=document.getElementById("canvas");
    var ctx=canvas.getContext("2d");	
    ctx.lineWidth=line;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle=style;
    ctx.stroke();
    ctx.closePath();
}
function freeSpot(x, y){
    for(var i=0; i<piksy.length; i++){
        var deltaX = piksy[i].px - x;
        var deltaY = piksy[i].py - y;
        var distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
        if(distance<piksy[i].radius || (piksy[i].type==2 && distance<(piksy[i].radius+piksy[i].growthstage))){
            return 0;
        }
    }
    return 1;
}
function highlight(){
    var x = relX;
    var y = relY;
    var piks=-1;
    for(var k=0; k<=3; k++){
        for(var i=0; i<piksy.length && piks==-1; i++){
            if(piksy[i].type==k){
                var deltaX = piksy[i].px - x;
                var deltaY = piksy[i].py - y;
                var distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
                if(distance<piksy[i].radius || (k==2 && distance<(piksy[i].radius+piksy[i].growthstage))){
                    piks=i;
                }
            }
        }
    }
    if(piks!=-1){
        piks=piksy[piks];
        document.getElementById("stats").innerHTML=piks.id;
        if(piks.color!="#000000"){
            document.getElementById("stats").color="#000000";
        }
    }
}
function mouseMove(event){
    var x = event.clientX;
    var y = event.clientY;
	relX=parseInt(x)-document.getElementById("canvas").getBoundingClientRect().left;
	relY=parseInt(y)-document.getElementById("canvas").getBoundingClientRect().top;
}
function sunlightTaken(x, y){
    var takenSunlight=0;
    for(var i=0; i<piksy.length; i++){
        var obj=piksy[i];
        if(obj.type==2 && obj.px>x-obj.actionrange && obj.px<x+obj.actionrange && obj.py>y-obj.actionrange && obj.py<y+obj.actionrange){
            takenSunlight+=(obj.radius+obj.growthstage)*(obj.radius+obj.growthstage);
        }
    }
    return takenSunlight;
}