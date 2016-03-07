function spaceHandler(){spacePress&&socket.emit("spacePressed",mav.client)}function Camera(e,t,a){this.x=0,this.y=0,this.width=t,this.height=a}function Client(e,t,a,i,n,s,c,o,l,r){this.name=e,this.plane=t,this.id=a,this.x=i,this.y=n,this.angle=c,this.speed=s,this.health=o,this.points=l,this.ammo=r}function Maverick(e,t,a,i,n){this.ctx=e,this.camera=t,this.client=a,this.players=i,this.bullets=n}function hurtPlayer(){socket.emit("hurtPlayer",mav.client)}console.log("Maverick 2D!"),$("#reload").hide();var socket=io();console.log(socket);var canvas=$("#canvas")[0],ctx=canvas.getContext("2d"),angle=0,players=[],bullets=[],healthPacks=[],leaderboard=[],plane,leftPress,rightPress,spacePress,upPress,downPress;$(document).on("keydown",function(e){players.length>0&&(68!==e.keyCode&&39!==e.keyCode||(rightPress=!0),65!==e.keyCode&&37!==e.keyCode||(leftPress=!0),38!==e.keyCode&&87!==e.keyCode||(upPress=!0),spacePress||32!==e.keyCode||(spacePress=!0,spaceHandler()))}),$(document).on("keyup",function(e){players.length>0&&(68!==e.keyCode&&39!==e.keyCode||(rightPress=!1),65!==e.keyCode&&37!==e.keyCode||(leftPress=!1),38!==e.keyCode&&87!==e.keyCode||(upPress=!1),32===e.keyCode&&(spacePress=!1,spaceHandler()))}),$("#reload").on("click",function(){socket.emit("respawn",mav.client),$("#menu").hide()});var spitfire=new Image;spitfire.src="/images/spitfire.png";var zero=new Image;zero.src="/images/zero.png";var mustang=new Image;mustang.src="/images/mustang.png";var lightning=new Image;lightning.src="/images/lightning.png";var messerschmitt=new Image;messerschmitt.src="/images/messerschmitt.png";var planes=[spitfire,zero,mustang,lightning,messerschmitt],bulletImg=new Image;bulletImg.src="/images/bullet.png";var tileMap=new Image;tileMap.src="/images/map-2.png";var healthImg=new Image;healthImg.src="/images/health.png";var map={cols:10,rows:10,tileSize:500};Camera.prototype.move=function(e,t){this.x=e,this.y=t},Maverick.prototype.updateCam=function(e){this.camLeftBound=this.client.x-canvas.width/2,this.camRightBound=this.client.x+canvas.width/2,this.camTopBound=this.client.y-canvas.height/2,this.camBottomBound=this.client.y+canvas.height/2,this.camera.move(this.client.x,this.client.y)},Maverick.prototype.keyPressHandler=function(){var e=this;leftPress&&socket.emit("leftPressed",e.client),rightPress&&socket.emit("rightPressed",e.client),upPress&&socket.emit("upPressed",e.client),upPress||socket.emit("downPressed",e.client)},Maverick.prototype.run=function(){this.tick();var e=this;setInterval(function(){e.keyPressHandler.call(e)},30)},Maverick.prototype.tick=function(e){window.requestAnimationFrame(this.tick.bind(this)),this.ctx.clearRect(0,0,1280,960),this.render()},Maverick.prototype.render=function(){this.ctx.canvas.width=window.innerWidth,this.ctx.canvas.height=window.innerHeight,this.updateCam(),this.drawMap(),this.drawHealthPacks(),this.drawBullets(),this.drawEnemies(),this.drawPlane(),this.drawLeaderboard(),this.drawLeaders(),this.drawAmmo()},Maverick.prototype.drawMap=function(){this.ctx.save(),this.ctx.drawImage(tileMap,0,0,5e3,5e3,-mav.camLeftBound,-mav.camTopBound,5e3,5e3),this.ctx.restore()},Maverick.prototype.drawPlane=function(){var e;e=this.client.health>6?"#2ecc71":this.client.health>3?"#f1c40f":"#e74c3c",this.ctx.save(),this.ctx.translate(canvas.width/2,canvas.height/2),this.ctx.textAlign="center",this.ctx.textBaseline="bottom",this.ctx.font="18px 'Lucida Grande'",this.ctx.fillStyle="blue",this.ctx.fillText(this.client.name,0,-90),this.ctx.fillStyle=e,this.ctx.fillRect(-50,-85,10*this.client.health,10),this.ctx.rotate(Math.PI/180*this.client.angle),this.ctx.drawImage(planes[this.client.plane],-60,-60,120,120),this.ctx.restore()},Maverick.prototype.drawEnemies=function(){var e=this;players.forEach(function(t){if(t.id!==e.client.id&&t.x<e.camRightBound+60&&t.x>e.camLeftBound-60&&t.y<e.camBottomBound+120&&t.y>e.camTopBound-60){var a;a=t.health>6?"#2ecc71":t.health>3?"#f1c40f":"#e74c3c",e.ctx.save(),e.ctx.translate(t.x-e.camLeftBound,t.y-e.camTopBound),e.ctx.textAlign="center",e.ctx.textBaseline="bottom",e.ctx.font="18px 'Lucida Grande'",e.ctx.fillStyle="#e74c3c",e.ctx.fillText(t.name,0,-90),e.ctx.fillStyle=a,e.ctx.fillRect(-50,-85,10*t.health,10),e.ctx.rotate(Math.PI/180*t.angle),e.ctx.drawImage(planes[t.plane],-60,-60,120,120),e.ctx.restore()}})},Maverick.prototype.drawBullets=function(){var e=this;bullets.length>=1&&bullets.forEach(function(t){t.x<e.camRightBound&&t.x>e.camLeftBound&&t.y<e.camBottomBound&&t.y>e.camTopBound&&(e.ctx.save(),e.ctx.translate(t.x-e.camLeftBound,t.y-e.camTopBound),e.ctx.rotate(Math.PI/180*t.angle),e.ctx.drawImage(bulletImg,-12,-12,24,24),e.ctx.restore())})},Maverick.prototype.drawHealthPacks=function(){var e=this;healthPacks.length>=1&&healthPacks.forEach(function(t){t.x<e.camRightBound&&t.x>e.camLeftBound&&t.y<e.camBottomBound&&t.y>e.camTopBound&&(e.ctx.save(),e.ctx.translate(t.x-e.camLeftBound,t.y-e.camTopBound),e.ctx.drawImage(healthImg,-24,-24,48,48),e.ctx.restore())})},Maverick.prototype.drawAmmo=function(){for(var e=this,t=canvas.height-96,a=24,i=mav.client.ammo;i>0;i--)e.ctx.drawImage(bulletImg,a,t,64,64),a+=24;mav.client.ammo<1&&(e.ctx.fillStyle="grey",e.ctx.font="36px 'Lucida Grande'",e.ctx.fillText("Reloading...",48,canvas.height-48))},Maverick.prototype.drawLeaderboard=function(){this.ctx.globalAlpha=.3,this.fillStyle="black",this.ctx.fillRect(20,20,300,200),this.ctx.globalAlpha=1},Maverick.prototype.drawLeaders=function(){var e=this,t=50;e.ctx.fillStyle="white",e.ctx.font="18px 'Lucida Grande'",e.ctx.fillText("Leaderboard:",105,50),e.ctx.fillStyle="black",leaderboard.forEach(function(a){t+=25,e.ctx.globalAlpha=1,e.ctx.fillStyle="white",e.ctx.font="18px 'Lucida Grande'",e.ctx.fillText("✈ "+a.name+": "+a.points+" pts",35,t),e.ctx.fillStyle="black"})},$("#start").on("click",function(){plane=$("#select").val();var e=new Client($("#name").val(),plane,socket.id);socket.emit("spawn",e)}),socket.on("joinGame",function(e){canvas.getContext("2d");console.log("Updated Settings:",e);var t=new Client(e.name,e.plane,e.id,e.x,e.y,e.speed,e.angle,e.health,e.points,e.ammo),a=new Camera(map,canvas.width,canvas.height);mav=new Maverick(canvas.getContext("2d"),a,t),$("#menu").hide(),mav.run()}),socket.on("rejoinGame",function(e){mav.client=e}),socket.on("movePlane",function(e){mav.client.x=e.x,mav.client.y=e.y,mav.client.speed=e.speed,mav.client.health=e.health,mav.client.angle=e.angle,mav.client.points=e.points,mav.client.ammo=e.ammo}),socket.on("moveBullets",function(e){bullets=e}),socket.on("spawnHealthPacks",function(e){healthPacks=e}),socket.on("updateHealthPacks",function(e){healthPacks=e}),socket.on("updateAllPlayers",function(e){players=e}),socket.on("updateAllLeaderboards",function(e){leaderboard=e}),socket.on("shotFired",function(e){console.log(e.name,"is shooting!")}),socket.on("playerDie",function(e){console.log(e.name,"was shot down!"),e.id===mav.client.id&&($("#inputs").hide(),$("#start").hide(),$("#controls").hide(),$("#select").hide(),$("#reload").show(),$("#menu").show())});