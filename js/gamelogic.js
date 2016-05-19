
// Global Variables

var _DEBUG = true;
var _DEBUG_BoundingBox = false;

var canvasW = 800;
var canvasH = 600;


// Debug output.
function print(message)
{
	if (_DEBUG)
	{
		console.log(">>>", message);
	}
}

// Utility functions.
function toggleFullscreen()
{
	var i = document.getElementById("surface");

	// go full-screen
	if (i.requestFullscreen) {
		i.requestFullscreen();
	} else if (i.webkitRequestFullscreen) {
		i.webkitRequestFullscreen();
	} else if (i.mozRequestFullScreen) {
		i.mozRequestFullScreen();
	} else if (i.msRequestFullscreen) {
		i.msRequestFullscreen();
	}
}

// Data Models

class RectList
{
	constructor()
	{
		this.list = [];
	}
	addRect(x, y, w, h)
	{
	}
	getRect(index)
	{
		if (this.list[index] != undefined)
		{
			return this.list[index];
		}
		else
		{
			return false;
		}
	}
	getRectAt(x, y)
	{
		for (var i = 0; i < this.list.length; i++)
		{
			var r = this.list[i];
			if (x >= r.x && x <= r.x + r.w
				&& y >= r.y && y <= r.y + r.h)
			{
				return r;
			}
		}
		return false;
	}
}

class SpriteFrame
{
	constructor(name, srcX, srcY, width, height, frameTicks)
	{
		var frameTicks = frameTicks;
		if (frameTicks == undefined) { frameTicks = 2; }
		this.srcX = srcX;
		this.srcY = srcY;
		this.width = width;
		this.height = height;
		this.frameTicks = frameTicks;
		this.name = name;
	}

	getFrameTicks()
	{
		return this.frameTicks;
	}
	getX()
	{
		return this.srcX;
	}
	getY()
	{
		return this.srcY;
	}
	getWidth()
	{
		return this.width;
	}
	getHeight()
	{
		return this.height;
	}
	getName()
	{
		return this.name;
	}

	setFrameTicks(frameTicks)
	{
		this.frameTicks = frameTicks;
		return true;
	}
}
class SpriteList
{
	constructor(name)
	{
		this.name = name;
		this.list = [];
	}
	getFrame(frameId)
	{
		if (frameId > this.list.length || frameId < 0)
		{
			return false;
		}
		return this.list[frameId];
	}
	nextFrame(frameId)
	{
		frameId++;
		if (frameId >= this.list.length)
		{
			return 0;
		}
		else if (frameId < 0)
		{
			return this.list.length - 1;
		}
		return frameId;
	}
	getFrameByName(name)
	{
		for (var i=0; i < this.list.length; i++)
		{
			if (name == this.list[i].name)
			{
				return this.list[i];
			}
		}
		return false;
	}
	addFrame(spriteFrame)
	{
		this.list.push(spriteFrame);
		return true;
	}
}

class SpriteDef
{
	constructor(name)
	{
		this.name = name;
		this.animId = undefined;
		this.frameId = 0;
		this.tickCount = 0;
		this.paused = true;

		this.animations = {};
	}

	addAnim(animId, spriteFrames)
	{
		if (this.animations[animId] != undefined)
		{
			// Animation by that name already exists.
			return false;
		}
		this.animations[animId] = spriteFrames;
		return true;
	}
	getAnim(animId)
	{
		if (this.animations[animId] != undefined)
		{
			return this.animations[animId];
		}
		return false;
	}
	getCurrentFrame()
	{
		return this.getAnim(this.animId).getFrame(this.frameId);
	}
	playAnim(animId)
	{		
		this.paused = false;
		if (this.animations[animId] != undefined && this.animId != animId)
		{
			this.animId = animId;
			this.tickCount = 0;
		}
		else
		{
			// No animation with that Id found in the list.
			return false;
		}
		return true;
	}
	unpauseAnim()
	{
		this.paused = false;
	}
	pauseAnim()
	{
		this.paused = true;
	}
	update()
	{
		if (this.paused)
		{
			return;
		}
		var currentAnim = this.animations[this.animId];
		var currentFrame = currentAnim.getFrame(this.frameId);

		if (this.tickCount >= currentFrame.getFrameTicks())
		{
			this.tickCount = 0;
			this.frameId = currentAnim.nextFrame(this.frameId);
		}
		else
		{
			this.tickCount++;
		}
	}
}

class ImageResource
{
	constructor(name, filename)
	{
		print(filename + ' loaded.');
		this.name = name;
		this.filename = filename;
		this.imgDOM = new Image();
		this.imgDOM.error = false;
		this.imgDOM.src = filename;
		var me = this;
		this.imgDOM.onerror = function()
		{
			me.imgDOM.error = true;			
		}
	}
	draw(x, y, w, h)
	{
		
	}
	
}
class ImageResources
{
	constructor()
	{
		this.resource_list = {};
	}
	addResource(resource)
	{
		if (this.resource_list[resource.name] == undefined)
		{
			this.resource_list[resource.name] = resource;
			return true;
		}
		return false;
	}
	getResource(name)
	{
		if (this.resource_list[name] == undefined)
		{
			return false;
		}
		else
		{
			return this.resource_list[name];
		}
	}
}
// Data Views

class Sprite
{
	constructor(name, x, y, controller, sprite_def, resource_name)
	{
		this.setXY(x, y);
		this.sprite_def = sprite_def;
		this.name = name;
		this.controller = controller;
		this.isMoving = false;
		this.construction_progress = 0.0;
		this.construction_completion = 10.0;
		this.constructed = true;

		if (this.controller != undefined)
		{
			this.ctx = this.controller.ctx;
			this.sheetUnits = this.controller.image_resources.getResource(resource_name);
		}
		
		this.keyStatus = [];
		
		this.dir = 0;
		this.accel = 0;
		
		this.yoffset = 0;
		
		this.max_hp = 10;
		this.hp = this.max_hp;
	}
	getType()
	{
		return 'Sprite';
	}
	getX()
	{
		return this.x;
	}
	getY()
	{
		return this.y;
	}
	setX(x)
	{
		this.x = x;
	}
	setY(y)
	{
		this.y = y;
	}
	setXY(x, y)
	{
		this.x = x;
		this.y = y;
	}
	getW()
	{
		var frame = this.sprite_def.getCurrentFrame();
		return frame.getWidth();
	}
	getH()
	{
		var frame = this.sprite_def.getCurrentFrame();
		return frame.getHeight();
	}
	move(x, y)
	{
		var ox = this.x;
		var oy = this.y;
		
		this.x += x;
		this.y += y;
		
		var c = engine.collideSprites(this);

		if (c && (c.getType() == "SpriteBuilding" || c.getType() == "ElectricityBuilding"))
		{
			this.setXY(ox, oy);
		}
	}
	
	keyUpdate()
	{
		if (engine.selSprite == this)
		{
		
			// Watch for Keyup Status on command keys.
			if (this.keyStatus[71] && !this.controller.isKeyPressed(71))
			{
				var c = engine.collideSprites(this);
				if(c && c.name == "Transport")
				{
					// Embarking
					c.seats.push(engine.removeSprite(this));
					engine.selSprite = c;
					this.keyStatus[71] = false;
				}
			}
		
			// Update Keydown/up Status
			
			// G Key
			this.keyStatus[71] = this.controller.isKeyPressed(71);
			
		
			this.isMoving = false;
			if (this.controller.isKeyPressed(68))
			{
				// Move Right
				this.move(1, 0);
				this.playAnim('Moving East');
				this.isMoving = true;
			}
			if (this.controller.isKeyPressed(65))
			{
				// Move Left
				this.move(-1, 0);
				this.playAnim('Moving West');
				this.isMoving = true;
			}
			if (this.controller.isKeyPressed(83))
			{
				// Move Down
				this.move(0, 1);
				this.playAnim('Moving South');
				this.isMoving = true;
			}
			if (this.controller.isKeyPressed(87))
			{
				// Move Up
				this.move(0, -1);
				this.playAnim('Moving North');
				this.isMoving = true;
			}
			if (this.controller.isKeyPressed(87) && this.controller.isKeyPressed(65))
			{
				// Move Right & Left
				this.playAnim('Moving Northwest');
			}
			if (this.controller.isKeyPressed(87) && this.controller.isKeyPressed(68))
			{
				// Move Up & Right
				this.playAnim('Moving Northeast');
			}
			if (this.controller.isKeyPressed(83) && this.controller.isKeyPressed(65))
			{
				// Move Down & Left
				this.playAnim('Moving Southwest');
			}
			if (this.controller.isKeyPressed(83) && this.controller.isKeyPressed(68))
			{
				// Move Down & Right
				this.playAnim('Moving Southeast');
			}
		}

	}
	
	playAnim(animId)
	{
		if (this.sprite_def)
		{
			this.sprite_def.playAnim(animId);
		}
	}
	pauseAnim()
	{
		this.sprite_def.pauseAnim();
	}
	unpauseAnim()
	{
		this.sprite_def.unpauseAnim();
	}
	draw()
	{
		if (!this.sheetUnits.imgDOM)
		{
			print('Sprite class draw error: imgDOM object is undefined.');
			return;
		}
		var frame = this.sprite_def.getCurrentFrame();
		var sx = frame.getX();
		var sy = frame.getY();
		var w = frame.getWidth();
		var h = frame.getHeight();
		var dx = this.getX();
		var dy = this.getY();

		this.ctx.setLineDash([]);
		this.ctx.globalAlpha = 0.3;
		this.ctx.fillStyle = "#090909";
		this.ctx.beginPath();
		this.ctx.arc(this.x + this.getW() / 2 + (this.getW() * 0.05), this.y + this.getH() / 2 + (this.getH() * 0.33), this.getW() * 0.20, 0, 2 * Math.PI);
		this.ctx.fill();
		this.ctx.globalAlpha = 1;

		this.ctx.drawImage(this.sheetUnits.imgDOM, sx, sy, w, h, dx, dy - this.yoffset, w, h);

		if (engine.selSprite == this)
		{

			var ctx = this.ctx;
			ctx.font = "bold 18px Share Tech Mono";
			ctx.fillStyle = "#89ae8e";
			ctx.fillText("Commands", 600, 45);

			
			ctx.font = "bold 12px Share Tech Mono";
			if (this.getType() == "SpriteVehicle")
			{
				if (this.piloted)
				{
					ctx.fillStyle = "#89ae8e";
					ctx.fillText("Piloted (" + this.seats.length + " crew)", 600, 65);
				}
				else
				{
					ctx.fillStyle = "#f10000";
					ctx.fillText("Not piloted!", 600, 65);
					ctx.fillText("(EVA crew can board)", 600, 78);
				}
			}
			ctx.fillStyle = "#89ae8e";

			ctx.fillText("W A S D - Turn/Move", 600, 91);
			ctx.fillText("G - Embark Crewmember", 600, 104);

		}
		
		this.ctx.setLineDash([]);
		var healthY = this.getH() * 0.75;
		var healthPct = this.hp / this.max_hp;
		this.ctx.strokeStyle = "#89ae8e";
		this.ctx.fillStyle = "#f10000";

		this.ctx.fillRect(this.x, this.y + 5 + healthY, 4, healthY * healthPct * -1);
		this.ctx.strokeRect(this.x, this.y + 5, 4, healthY);
		
		if (_DEBUG && _DEBUG_BoundingBox)
		{
			var ctx = this.ctx;
			
			ctx.strokeStyle = ctx.fillStyle;
			
			ctx.strokeRect(this.x, this.y, this.getW(), this.getH());
		}
	}
	
	update()
	{
		this.sprite_def.update();
		
		this.keyUpdate();
		
		var ox = this.x;
		var oy = this.y;
		
		if (this.accel > 0)
		{
			var sp = this.accel;
			var y = 1;
			if (this.dir >= 0 && this.dir < 1)
			{
				this.x += sp * y;
			}
			if (this.dir >= 1 && this.dir < 2)
			{
				this.x += sp * y * 0.65;
				this.y += sp * y * 0.65;
			}
			if (this.dir >= 2 && this.dir < 3)
			{
				this.y += sp * y;
			}
			if (this.dir >= 3 && this.dir < 4)
			{
				this.x -= sp * y * 0.65;
				this.y += sp * y * 0.65;
			}
			if (this.dir >= 4 && this.dir < 5)
			{
				this.x -= sp * y;
			}
			if (this.dir >= 5 && this.dir < 6)
			{
				this.x -= sp * y * 0.65;
				this.y -= sp * y * 0.65;
			}
			if (this.dir >= 6 && this.dir < 7)
			{
				this.y -= sp * y;
			}
			if (this.dir >= 7 && this.dir < 8)
			{
				this.x += sp * y * 0.65;
				this.y -= sp * y * 0.65;
			}
			
			if (this.yoffset < 0)
			{
				this.yoffset = 0;
				this.hp -= -0.1;
			}
			else if (this.yoffset == 0)
			{
				this.accel -= 0.33;
			}
			else if (this.yoffset > 0)
			{
				this.yoffset -= 0.15;
			}
		}
		else if (this.accel < 0)
		{
			this.accel = 0;
		}
		
		if (engine.collideSprites(this))
		{
			this.hp -= this.accel * 0.33;
			this.accel = 0;
		}
		
		if (this.hp <= 0)
		{
			this.death();
		}
		
		this.draw();
	}
	
	death()
	{
		// TODO: Play Death Animation, then remove sprite when it completes running.
		engine.removeSprites(this);
	}
	
	onClick(e)
	{
		return this;
	}
}

class SpriteBuilding extends Sprite
{
	constructor(name, x, y, controller, sprite_def, resource_name)
	{
		super(name, x, y, controller, sprite_def, resource_name);
		this.sprite_def.playAnim('Working');
		this.powered = false;
		this.constructed = false;
		this.Ond = true;
	
	}
	getType()
	{
		return 'SpriteBuilding';
	}
	keyUpdate()
	{
	}
	getProduction()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		//return [{name: '', qty: 20}];
		return false;	
	}
	getConsumption()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		//return [{name: '', qty: 20}];
		return false;	
	}
	getBuildCost()
	{
		return [
				{name: 'credits', qty: 100}
			];
	}
	update()
	{
		this.sprite_def.update();

		this.keyUpdate();

		if (this.construction_progress < this.construction_completion)
		{
			this.construction_progress += 0.01;
		}
		else
		{
			this.constructed = true;
		}
				
		if (!this.isMoving)
		{
			this.pauseAnim();
		}
		
		this.draw();
	
	}
	draw()
	{
		if (!this.sheetUnits.imgDOM)
		{
			print('Sprite class draw error: imgDOM object is undefined.');
			return;
		}
		var frame = this.sprite_def.getCurrentFrame();
		var sx = frame.getX();
		var sy = frame.getY();
		var w = frame.getWidth();
		var h = frame.getHeight();
		var dx = this.getX();
		var dy = this.getY();
		this.ctx.drawImage(this.sheetUnits.imgDOM, sx, sy, w, h, dx, dy, w, h);
	}

}

class SolarBuilding extends SpriteBuilding
{
	constructor(name, x, y, c, s, r)
	{
		super(name, x, y, c, s, r);
		this.powered = true;
	}
	getProduction()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'electricity', qty: 5}];
		}
		else
		{
			return false;
		}
	}
	getBuildCost()
	{
		return [
				{name: 'credits', qty: 75}
				,{name: 'metals', qty: 25}
			];
	}
	update()
	{
		super.update();
		this.powered = true;
	}

}

class BatteryBuilding extends SpriteBuilding
{
	getProduction()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'electric_storage', qty: 500}];
		}
		else
		{
			return false;
		}
	}
	getType()
	{
		return "ElectricityBuilding";
	}
	constructor(name, x, y, c, s, r)
	{
		super(name, x, y, c, s, r);
		this.powered = true;
	}
	update()
	{
		super.update();
		this.powered = true;
	}
	getBuildCost()
	{
		return [
				{name: 'credits', qty: 100}
				,{name: 'metals', qty: 50}
			];
	}

}
class GasBuilding extends SpriteBuilding
{
	getConsumption()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'electricity', qty: 5}];
		}
		else
		{
			return false;
		}
	}
	getProduction()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [
				{name: 'oxygen', qty: 1}
				,{name: 'hydrogen', qty: 1}
			];
		}
		else
		{
			return false;
		}
	}
	getBuildCost()
	{
		return [
				{name: 'credits', qty: 150}
				,{name: 'metals', qty: 50}
			];
	}
}				
class MetalsBuilding extends SpriteBuilding
{
	getConsumption()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'electricity', qty: 5}];
		}
		else
		{
			return false;
		}
	}
	getProduction()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'metals', qty: 1}];
		}
		else
		{
			return false;
		}
	}
	getBuildCost()
	{
		return [
				{name: 'credits', qty: 150}
				,{name: 'metals', qty: 50}
			];
	}
}				
class Habitat1Building extends SpriteBuilding
{
	getConsumption()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'electricity', qty: 2.5}];
		}
		else
		{
			return false;
		}
	}
	getBuildCost()
	{
		return [
				{name: 'credits', qty: 250}
				,{name: 'metals', qty: 125}
			];
	}
	getProduction()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [
				{name: 'food_storage', qty: 10}
				,{name: 'food_storage', qty: 10}
			];
		}
		else
		{
			return false;
		}
	}

}
class Habitat2Building extends SpriteBuilding
{
	getConsumption()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'electricity', qty: 25}];
		}
		else
		{
			return false;
		}
	}
	getBuildCost()
	{
		return [
				{name: 'credits', qty: 500}
				,{name: 'metals', qty: 250}
			];
	}
	getProduction()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [
				{name: 'food_storage', qty: 30}
				,{name: 'food_storage', qty: 30}
			];
		}
		else
		{
			return false;
		}
	}


}				
class Farm1Building extends SpriteBuilding
{
	getConsumption()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'electricity', qty: 5}];
		}
		else
		{
			return false;
		}
	}
	getBuildCost()
	{
		return [
				{name: 'credits', qty: 250}
				,{name: 'metals', qty: 100}
			];
	}

	getProduction()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'food', qty: 1}];
		}
		else
		{
			return false;
		}
	}
}				
class LaunchPadBuilding extends SpriteBuilding
{
	getConsumption()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'electricity', qty: 1}];
		}
		else
		{
			return false;
		}
	}

}				class NuclearBuilding extends SpriteBuilding
{
	getProduction()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'electricity', qty: 50}];
		}
		else
		{
			return false;
		}
	}
	getType()
	{
		return "ElectricityBuilding";
	}
	constructor(name, x, y, c, s, r)
	{
		super(name, x, y, c, s, r);
		this.powered = true;
	}
	getBuildCost()
	{
		return [
				{name: 'credits', qty: 250}
				,{name: 'metals', qty: 50}
			];
	}
	update()
	{
		super.update();
		this.powered = true;
	}
}
class FactoryBuilding extends SpriteBuilding
{
	constructor(name, x, y, c, s, r)
	{
		super(name, x, y, c, s, r);
		this.producing = false;
		
		this.queue = [];
		this.build_amt = 0;
		this.build_total = 100;
	}
	getConsumption()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed && this.producing)
		{
			return [{name: 'electricity', qty: 25}];
		}
		else if (this.constructed && !this.producing)
		{
			return [{name: 'electricity', qty: 2.5}];
		}
		else
		{
			return false;
		}
	}
	getProduction()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			switch(this.queue[0])
			{
				case 'Water':
					print("TODO: Use 2 Oxygen and Hydrogen to create 1 water.");
				break;
			}
		}
		else
		{
			return false;
		}
	}
	getBuildCost()
	{
		return [
				{name: 'credits', qty: 1000}
				,{name: 'metals', qty: 500}
			];
	}
	update()
	{
		super.update();
	}
}				
class Turret extends SpriteBuilding
{
	getConsumption()
	{
		// 'Per second' amount. FPS should be clamped at around 20fps
		// so set the proportion properly.
		if (this.constructed)
		{
			return [{name: 'electricity', qty: 5}];
		}
		else
		{
			return false;
		}
	}
	getBuildCost()
	{
		return [
				{name: 'credits', qty: 500}
				,{name: 'metals', qty: 250}
			];
	}
}



// View Controller


class Engine
{
	constructor(context, image_resources)
	{
		this.ctx = context;
		this.image_resources = image_resources;
		
		this.terrainImage = image_resources.getResource('terrain1');
		
		this.selSprite = undefined;
		this.placeSprite = undefined;
				
		this.sprites = [];
		this.enemies = [];
		
		this.keys = [];
		
		this.ui = new UIList();
		
		this.imagesAllLoaded = false;
		
		// FPS Settings
		
		this.fps = 30;
		this.fpsInterval = 1000 / this.fps;
		this.oldTime = Date.now();		
		
		this.inventory = {
		
			'electricity': 0
			,'electric_storage': 0
			
			,'metals': 500
			
			,'hydrogen': 100
			,'oxygen': 100
			
			,'water': 50
			,'water_storage': 500
			,'food': 50
			,'food_storage': 500
			
			,'habitat': 0
			
			,'credits': 1000
		
		};
		
		var me = this;

		window.addEventListener("mousemove", this.mouseUpdate, true);
		window.addEventListener("click", this.clickUpdate, true);
		window.addEventListener("keypress", this.keyUpdate, true);

		
		window.addEventListener('keydown', function(e) {
			me.keys[e.keyCode] = true;
		});
		window.addEventListener('keyup', function(e) {
			me.keys[e.keyCode] = false;
		});
	}
	setUIHandler(ui_list)
	{
		this.ui = ui_list;
	}
	isKeyPressed(keyCode)
	{
		if (this.keys[keyCode] != undefined)
		{
			return this.keys[keyCode];
		}
		else
		{
			return false;
		}
	}
	addSprite(name, newSprite)
	{
		this.sprites.unshift(newSprite);
		if (this.selSprite == undefined)
		{
			this.selSprite = newSprite;
		}
		return true;
	}
	removeSprite(sprite)
	{
		var m = false;
		var sp = [];
		for (var i = 0; i < this.sprites.length; i++)
		{
			if (this.sprites[i] == sprite)
			{
				m = this.sprites[i];
			}
			else
			{
				sp.push(this.sprites[i]);
			}
		}
		this.sprites = sp;
	
		return m;
	}
	addEnemy(name, newSprite)
	{
		this.enemies.push(newSprite);
		return true;
	}
	removeEnemy(sprite)
	{
		var m = false;
		var sp = [];
		for (var i = 0; i < this.enemies.length; i++)
		{
			if (this.enemies[i] == sprite)
			{
				m = this.enemies[i];
			}
			else
			{
				sp.push(this.enemies[i]);
			}
		}
		this.enemies = sp;
	
		return m;
	}	
	collideSprites(sprite)
	{
		for (var i=0; i < this.sprites.length; i++)
		{
			if (this.sprites[i] != sprite)
			{
				var sp = this.sprites[i];
				if (
					((sprite.x >= sp.x && sprite.x <= sp.x + sp.getW()) || (sprite.x + sprite.getW() >= sp.x && sprite.x + sprite.getW() <= sp.x + sp.getW()))
					&& ((sprite.y >= sp.y && sprite.y <= sp.y + sp.getH()) || (sprite.y + sprite.getH() >= sp.y && sprite.y + sprite.getH() <= sp.y + sp.getH()))
				)
				{
					return sp;
				}
					
			}
		}
		return false;	
	}
	collideEnemies(sprite)
	{
		for (var i=0; i < this.enemies.length; i++)
		{
			if (this.enemies[i] != sprite)
			{
				var sp = this.enemies[i];

				if (
					// Condition for if the sprite is smaller than the enemy.

					(((sprite.x >= sp.x && sprite.x <= sp.x + sp.getW()) || (sprite.x + sprite.getW() >= sp.x && sprite.x + sprite.getW() <= sp.x + sp.getW()))
					&& ((sprite.y >= sp.y && sprite.y <= sp.y + sp.getH()) || (sprite.y + sprite.getH() >= sp.y && sprite.y + sprite.getH() <= sp.y + sp.getH())))

					||
					
					// Condition for if the enemy is smaller than the sprite.
					(((sp.x >= sprite.x && sp.x <= sprite.x + sprite.getW()) || (sp.x + sp.getW() >= sprite.x && sp.x + sp.getW() <= sprite.x + sprite.getW()))
					&& ((sp.y >= sprite.y && sp.y <= sprite.y + sprite.getH()) || (sp.y + sp.getH() >= sprite.y && sp.y + sp.getH() <= sprite.y + sprite.getH())))
				)
				{
					return sp;
				}
					
			}
		}
		return false;	
	}
	startPlaceBuilding(name)
	{
		
		switch(name)
		{
			case 'Solar Array':
				this.selSprite = undefined;

				var sprite = new SpriteDef('building');
		
				var frames = new SpriteList('building solar');
				frames.addFrame(new SpriteFrame('Gas0', 0, 0, 128, 128, 175));
				frames.addFrame(new SpriteFrame('Gas1', 128, 0, 128, 128, 175));
				frames.addFrame(new SpriteFrame('Gas2', 256, 0, 128, 128, 175));
				frames.addFrame(new SpriteFrame('Gas3', 384, 0, 128, 128, 175));
				frames.addFrame(new SpriteFrame('Gas4', 512, 0, 128, 128, 175));
				frames.addFrame(new SpriteFrame('Gas4', 640, 0, 128, 128, 175));
				frames.addFrame(new SpriteFrame('Gas4', 768, 0, 128, 128, 175));
				frames.addFrame(new SpriteFrame('Gas4', 900, 0, 128, 128, 175));
				frames.addFrame(new SpriteFrame('Gas4', 1028, 0, 128, 128, 175));
				sprite.addAnim('Working', frames);
			
				sprite.playAnim('Working');
				
				this.placeSprite = new SolarBuilding('Solar Array', 400, 300, engine, sprite, 'building solar');
			break;
			case 'Battery Array':
				var sprite = new SpriteDef('building');
		
				var frames = new SpriteList('building battery');
				frames.addFrame(new SpriteFrame('Gas0', 0, 0, 128, 128, 25));
				frames.addFrame(new SpriteFrame('Gas1', 128, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas2', 256, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas3', 384, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas4', 512, 0, 128, 128, 50));
				frames.addFrame(new SpriteFrame('Gas5', 384, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas6', 256, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas7', 128, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas8', 0, 0, 128, 128, 25));
				sprite.addAnim('Working', frames);
			
				sprite.playAnim('Working');

				this.placeSprite = new BatteryBuilding('Battery Array', 400, 300, engine, sprite, 'building battery');
			break;
			case 'Gas Extraction':
				var sprite = new SpriteDef('building');
		
				var frames = new SpriteList('building gas');
				frames.addFrame(new SpriteFrame('Gas0', 0, 0, 128, 128, 25));
				frames.addFrame(new SpriteFrame('Gas1', 128, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas2', 256, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas3', 384, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas4', 512, 0, 128, 128, 50));
				frames.addFrame(new SpriteFrame('Gas5', 384, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas6', 256, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas7', 128, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas8', 0, 0, 128, 128, 25));
				sprite.addAnim('Working', frames);
			
				sprite.playAnim('Working');
							
				this.placeSprite = new GasBuilding('Gas Extraction', 400, 300, engine, sprite, 'building gas');
			break;
			case 'Metals Extraction':
				var sprite = new SpriteDef('building');
		
				var frames = new SpriteList('building metals');
				frames.addFrame(new SpriteFrame('Gas0', 0, 0, 128, 128, 25));
				frames.addFrame(new SpriteFrame('Gas1', 128, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas2', 256, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas3', 384, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas4', 512, 0, 128, 128, 50));
				frames.addFrame(new SpriteFrame('Gas5', 384, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas6', 256, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas7', 128, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas8', 0, 0, 128, 128, 25));
				sprite.addAnim('Working', frames);
			
				sprite.playAnim('Working');

			
				this.placeSprite = new MetalsBuilding('Metals Extraction', 400, 300, engine, sprite, 'building metals');
			break;
			case 'Basic Habitat Module':
				var sprite = new SpriteDef('building');
		
				var frames = new SpriteList('building metals');
				frames.addFrame(new SpriteFrame('Gas0', 0, 0, 128, 128, 25));
				frames.addFrame(new SpriteFrame('Gas1', 128, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas2', 256, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas3', 384, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas4', 512, 0, 128, 128, 50));
				frames.addFrame(new SpriteFrame('Gas5', 384, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas6', 256, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas7', 128, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas8', 0, 0, 128, 128, 25));
				sprite.addAnim('Working', frames);
			
				sprite.playAnim('Working');

				
				this.placeSprite = new Habitat1Building('Basic Habitat Module', 400, 300, engine, sprite, 'building habitat1');
			break;
			case 'Biodome Habitat':
				var sprite = new SpriteDef('building');
		
				var frames = new SpriteList('building biodome habitat');
				frames.addFrame(new SpriteFrame('Gas0', 0, 0, 128, 128, 25));
				sprite.addAnim('Working', frames);
			
				sprite.playAnim('Working');

				
				this.placeSprite = new Habitat2Building('Basic Habitat Module', 400, 300, engine, sprite, 'building habitat2');
			break;
			case 'Farming Biodome':
				var sprite = new SpriteDef('building');
		
				var frames = new SpriteList('building farm');
				frames.addFrame(new SpriteFrame('Gas0', 0, 0, 128, 128, 25));
				sprite.addAnim('Working', frames);
			
				sprite.playAnim('Working');

				
				this.placeSprite = new Farm1Building('Farming Biodome', 400, 300, engine, sprite, 'building farm1');
			break;
			case 'Launch Pad':
				var sprite = new SpriteDef('building');
		
				var frames = new SpriteList('building launchpad');
				frames.addFrame(new SpriteFrame('Gas0', 0, 0, 128, 128, 25));
				sprite.addAnim('Working', frames);
			
				sprite.playAnim('Working');

				
				this.placeSprite = new LaunchPadBuilding('Launch Pad', 400, 300, engine, sprite, 'building launchpad');
			break;
			case 'Nuclear Power Plant':
				var sprite = new SpriteDef('building');
		
				var frames = new SpriteList('building nuclear');
				frames.addFrame(new SpriteFrame('Gas0', 0, 0, 128, 128, 25));
				frames.addFrame(new SpriteFrame('Gas1', 128, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas2', 256, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas3', 384, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas4', 512, 0, 128, 128, 50));
				frames.addFrame(new SpriteFrame('Gas5', 384, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas6', 256, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas7', 128, 0, 128, 128));
				frames.addFrame(new SpriteFrame('Gas8', 0, 0, 128, 128, 25));
				sprite.addAnim('Working', frames);
			
				sprite.playAnim('Working');


			
				this.placeSprite = new NuclearBuilding('Nuclear Power Plant', 400, 300, engine, sprite, 'building nuclear');
			break;
			case 'Factory':
				var sprite = new SpriteDef('building');
		
				var frames = new SpriteList('building factory');
				frames.addFrame(new SpriteFrame('Gas0', 0, 0, 128, 128, 25));
				sprite.addAnim('Working', frames);
			
				sprite.playAnim('Working');
				

			
				this.placeSprite = new FactoryBuilding('Factory', 400, 300, engine, sprite, 'building factory');
			break;
			case 'Cannon Turret':
				var sprite = new SpriteDef('building');
		
				var frames = new SpriteList('building turret');
				frames.addFrame(new SpriteFrame('Turret1', 0, 0, 128, 128, 25));
				sprite.addAnim('South', frames);
				frames.addFrame(new SpriteFrame('Turret2', 128, 0, 128, 128, 25));
				sprite.addAnim('SouthEast', frames);
				frames.addFrame(new SpriteFrame('Turret3', 256, 0, 128, 128, 25));
				sprite.addAnim('East', frames);
				frames.addFrame(new SpriteFrame('Turret4', 364, 0, 128, 128, 25));
				sprite.addAnim('NorthEast', frames);
				frames.addFrame(new SpriteFrame('Turret5', 512, 0, 128, 128, 25));
				sprite.addAnim('North', frames);
				frames.addFrame(new SpriteFrame('Turret6', 640, 0, 128, 128, 25));
				sprite.addAnim('NorthWest', frames);
				frames.addFrame(new SpriteFrame('Turret7', 768, 0, 128, 128, 25));
				sprite.addAnim('West', frames);
				frames.addFrame(new SpriteFrame('Turret8', 896, 0, 128, 128, 25));
				sprite.addAnim('SouthWest', frames);
			
				sprite.playAnim('East');


			
				this.placeSprite = new Turret('Cannon Turret', 400, 300, engine, sprite, 'building turret');
			break;
		}
		
		var cost = engine.placeSprite.getBuildCost();
		
		var costed = 0;
		
		for (var i = 0; i < cost.length; i++)
		{
			var n = cost[i].name;
			var q = cost[i].qty;
			
			if (engine.inventory[n] - q >= 0)
			{
				costed++;
			}
		}
		
		if (costed == cost.length)
		{			
			for (var i = 0; i < cost.length; i++)
			{
				var n = cost[i].name;
				var q = cost[i].qty;
			
				if (engine.inventory[n] - q >= 0)
				{
					engine.inventory[n] -= q;
				}
			}
		}
		else
		{
			alert("Cannot afford to build " + engine.placeSprite.name);
			engine.placeSprite = undefined;
		}		

	
	}
	update()
	{
	
		// Make sure images are all loaded.
		if (!this.imagesAllLoaded)
		{
			this.ctx.fillStyle = "#000";
			this.ctx.clearRect(0, 0, canvasW, canvasH);

			this.ctx.font = "Bold 24px Share Tech Mono";
			this.ctx.fillStyle = "#89ae8e";
			this.ctx.fillText("Loading Resources", 5, 75);

			this.ctx.font = "Italic 16px Share Tech Mono";
			this.ctx.fillStyle = "#ee0000";
					
			var notLoadedCount = 0;			
			var dy = 100;
			for (var resource in this.image_resources.resource_list) {
				if (this.image_resources.resource_list.hasOwnProperty(resource)) {
					if (this.image_resources.resource_list[resource].imgDOM != undefined && this.image_resources.resource_list[resource].imgDOM.error)
					{
						var rname = this.image_resources.resource_list[resource].imgDOM.src;
						this.ctx.fillText(">" + resource + " not loaded...", 0, dy);
						notLoadedCount++;
						dy += 18;
						this.ctx.fillText("(" + rname + ")", 25, dy);
						dy += 18;
					}
				}
			}
			if (notLoadedCount > 0)
			{
				this.imagesAllLoaded = false;
				return;
			}
			else
			{
				this.imagesAllLoaded = true;
				return;
			}
		}
	
		
		this.ctx.clearRect(0, 0, canvasW, canvasH);

		// Draw the background (terrain) image.
		this.ctx.drawImage(this.terrainImage.imgDOM, 0, 0, canvasW, canvasH, 0, 0, canvasW, canvasH);
		
		// Update Enemies	
		for (var i = this.enemies.length - 1; i >= 0; i--)
		{
			this.enemies[i].update();
			var name = this.enemies[i].name;
			var x = this.enemies[i].x;
			var y = this.enemies[i].y;
			var w = this.enemies[i].getW();
			var h = this.enemies[i].getH();
			
			this.ctx.font = "Italic 12px Share Tech Mono";			
			this.ctx.strokeStyle = "#f10000";
			this.ctx.fillStyle = "#f10000";
			
			this.ctx.fillText(name, x, y - 5);

			/*this.ctx.setLineDash([5, 5]);
			this.ctx.lineDashOffset += 0.25;
			if (this.ctx.lineDashOffset > 10)
			{
				this.ctx.lineDashOffset = 0;
			}
			this.ctx.beginPath();
			this.ctx.arc(x + w / 2, y + h / 2, w * 0.5, 0, 2 * Math.PI);
			this.ctx.stroke();*/
		}
		

		// Update Sprites	
		for (var i = this.sprites.length - 1; i >= 0; i--)
		{
			this.sprites[i].update();
		}
		
		// Building HUD if selected
		for (var i = this.sprites.length - 1; i >= 0; i--)
		{
			if (this.sprites[i] == this.selSprite)
			{
				var name = this.sprites[i].name;
				var x = this.sprites[i].x;
				var y = this.sprites[i].y;
				var w = this.sprites[i].getW();
				var h = this.sprites[i].getH();
				
				// Selected sprite UI Text
				this.ctx.strokeStyle = "#89ae8e";
				this.ctx.fillStyle = "#89ae8e";
				this.ctx.font = "Italic 12px Share Tech Mono";
				this.ctx.fillText(name, x, y - 5);
				
				this.ctx.setLineDash([5, 5]);
				this.ctx.lineDashOffset += 0.25;
				if (this.ctx.lineDashOffset > 10)
				{
					this.ctx.lineDashOffset = 0;
				}
				this.ctx.beginPath();
				this.ctx.arc(x + w / 2, y + h / 2, w * 0.5, 0, 2 * Math.PI);
				this.ctx.stroke();
				
				if (!this.selSprite.constructed)
				{
					this.ctx.fillStyle = "#89ae8e";
					this.ctx.strokeStyle = "#89ae8e";
			
					this.ctx.setLineDash([]);
					var w = Math.floor((this.selSprite.construction_progress / this.selSprite.construction_completion) * 64);
					this.ctx.fillRect(this.selSprite.getX() + 10, this.selSprite.getY() + 110, w, 12);
					this.ctx.strokeRect(this.selSprite.getX() + 10, this.selSprite.getY() + 110, 64, 12);
				}

				if (this.selSprite.getType() == "SpriteBuilding" && !this.selSprite.powered && this.selSprite.constructed && this.selSprite.Ond)
				{
					this.ctx.font = "Italic 12px Share Tech Mono";
					this.ctx.fillStyle = "#ee0000";
					this.ctx.fillText("No power!", x, y + 100);
				}
			}
		}

		if (this.placeSprite != undefined)
		{
			var g = this.ctx.globalAlpha;
			this.ctx.globalAlpha = 0.6;
			this.placeSprite.draw();
			this.ctx.globalAlpha = g;
		}

		// Update Production

		// Zero out non-cumulative attributes
		this.inventory.electric_storage = 0;
		
		var elecAmt = this.inventory.electricity;
		for (var i = 0; i < this.sprites.length; i++)
		{
			if (
				((this.sprites[i].getType() == 'SpriteBuilding' && this.sprites[i].powered)
				|| (this.sprites[i].getType() == 'ElectricityBuilding'))
					&& this.sprites[i].Ond
			)
			{
				var p = this.sprites[i].getProduction();
				for (var j = 0; j < p.length; j++)
				{
					this.inventory[p[j].name] += p[j].qty;
				}
			}
		}
		
		// Update Consumption
		for (var i = 0; i < this.sprites.length; i++)
		{
			if (this.sprites[i].getType() == 'SpriteBuilding' && this.sprites[i].Ond)
			{
				var p = this.sprites[i].getConsumption();
				for (var j = 0; j < p.length; j++)
				{
					this.inventory[p[j].name] -= p[j].qty;
					if (this.inventory.electricity < 0)
					{
						this.sprites[i].powered = false;
					}
					else
					{
						this.sprites[i].powered = true;
					}
				}
			}
		}
		
		var elecProd = this.inventory.electricity - elecAmt;
		
		// Clamp Electricity resource at battery capacity.
		if (this.inventory.electricity > this.inventory.electric_storage)
		{
			this.inventory.electricity = this.inventory.electric_storage;
		}
		if (this.inventory.electricity < 0)
		{
			this.inventory.electricity = 0;
		}
		
		// Clamp food stocks at storage capacity.
		if (this.inventory.food > this.inventory.food_storage)
		{
			this.inventory.food = this.inventory.food_storage;
		}
		if (this.inventory.food < 0)
		{
			this.inventory.food = 0;
		}
		
		// Clamp water stocks at storage capacity.
		if (this.inventory.water > this.inventory.water_storage)
		{
			this.inventory.water = this.inventory.water_storage;
		}
		if (this.inventory.water < 0)
		{
			this.inventory.water = 0;
		}
				
		// Update UI
	
		this.ui.update();
		this.ui.draw();
		
		// Draw UI Header Resource Values

		this.ctx.font = "bold 14px Share Tech Mono";
		this.ctx.fillStyle = "#89ae8e";
		var e = elecProd;
		var p = "+";
		if (e <= 0)
		{
			p = "";
		}
		

		// Electric production
		this.ctx.fillStyle = "#658169";
		this.ctx.fillText("E", 35, 50);
		this.ctx.fillStyle = "#89ae8e";
		this.ctx.fillText(p + e, 50, 50);

		// Food Amount
		this.ctx.fillStyle = "#658169";
		this.ctx.fillText("F", 75, 50);
		var f = this.inventory.food;
		this.ctx.fillStyle = "#89ae8e";
		this.ctx.fillText(f, 90, 50);

		// Oxygen Amount
		this.ctx.fillStyle = "#658169";
		this.ctx.fillText("Ox", 130, 50);
		var ox = this.inventory.oxygen;
		this.ctx.fillStyle = "#89ae8e";
		this.ctx.fillText(ox, 150, 50);

		// Hydrogen Amount
		this.ctx.fillStyle = "#658169";
		this.ctx.fillText("Hy", 190, 50);
		var hy = this.inventory.hydrogen;
		this.ctx.fillStyle = "#89ae8e";
		this.ctx.fillText(hy, 210, 50);

		// Metals Amount
		this.ctx.fillStyle = "#658169";
		this.ctx.fillText("M", 255, 50);
		var m = this.inventory.metals;
		this.ctx.fillStyle = "#89ae8e";
		this.ctx.fillText(m, 270, 50);

		// Credits
		this.ctx.fillStyle = "#658169";
		this.ctx.fillText("Cr", 305, 50);
		var c = Math.abs(this.inventory.credits / 1000).toFixed(1);
		this.ctx.fillStyle = "#89ae8e";
		this.ctx.fillText(c + "k", 325, 50);


	}
	mouseUpdate(e)
	{
	
		if (engine.placeSprite != undefined)
		{
			engine.placeSprite.setXY(e.clientX - 64, e.clientY - 64);
			engine.placeSprite.draw();
		}
			
		engine.ui.mouseUpdate(e);
	}
	clickUpdate(e)
	{		
		var r = engine.ui.clickUpdate(e);

		if (!r && engine.placeSprite == undefined)
		{
			var found = false;
			for (var i = engine.sprites.length - 1; i >= 0; i--)
			{
				var s = engine.sprites[i];
				if (e.clientX >= s.getX() && e.clientX <= s.getX() + s.getW()
					&& e.clientY >= s.getY() && e.clientY <= s.getY() + s.getH())
				{
					engine.selSprite = s.onClick(e);
					found = true;
				}
			}
			if (!found)
			{
				engine.selSprite = undefined;
			}
			else
			{
				var d = engine.ui.getUIElementByName('ui dialog actions');
				if ((engine.selSprite.getType() == "SpriteBuilding"
								|| engine.selSprite.getType() == "ElectricityBuilding"))
				{
					d.slideIn();
				}
			}
		}
		if (!r && engine.placeSprite != undefined)
		{
			// Place Building
			
			engine.placeSprite.setXY(e.clientX - 64, e.clientY - 64);
			
			engine.addSprite(engine.placeSprite.name, engine.placeSprite);
			engine.placeSprite = undefined;
		}
		
	}
	keyUpdate(e)
	{
		engine.ui.onKeyPress(e);
		
		if (e.keyCode == 27 && engine.placeSprite != undefined)
		{
			// Cancel Build
			
			var cost = engine.placeSprite.getBuildCost();
			
			for (var i = 0; i < cost.length; i++)
			{
				var n = cost[i].name;
				var q = cost[i].qty;
			
				engine.inventory[n] += q;
			}
					
			engine.placeSprite = undefined;
		}
	}
}


class AISprite extends Sprite
{
	keyUpdate()
	{
	
	}
	
	death()
	{
		engine.removeEnemy(this);
	}
}

class SpriteVehicle extends Sprite
{
	constructor(name, x, y, controller, sprite_def, resource_name)
	{
		super(name, x, y, controller, sprite_def, resource_name);

		this.seats = [];
		this.max_capacity = 2;
		
		this.piloted = false;

		this.constructed = true;
		this.dir = 0;
		this.speed = 2.75;
		this.turnSpeed = 1;
	}
	getType()
	{
		return 'SpriteVehicle';
	}
	move(x, y)
	{		
		if (!this.piloted)
		{
			return;
		}
		
		var ox = this.x;
		var oy = this.y;
		
		if (x != 0)
		{
			this.dir += x * this.turnSpeed;
			if (this.dir < 0)
			{
				this.dir = 8;
			}
			if (this.dir > 8)
			{
				this.dir = 0;
			}
		}
		if (y != 0)
		{
			if (this.dir >= 0 && this.dir < 1)
			{
				this.x += this.speed * y;
			}
			if (this.dir >= 1 && this.dir < 2)
			{
				this.x += this.speed * y * 0.65;
				this.y += this.speed * y * 0.65;
			}
			if (this.dir >= 2 && this.dir < 3)
			{
				this.y += this.speed * y;
			}
			if (this.dir >= 3 && this.dir < 4)
			{
				this.x -= this.speed * y * 0.65;
				this.y += this.speed * y * 0.65;
			}
			if (this.dir >= 4 && this.dir < 5)
			{
				this.x -= this.speed * y;
			}
			if (this.dir >= 5 && this.dir < 6)
			{
				this.x -= this.speed * y * 0.65;
				this.y -= this.speed * y * 0.65;
			}
			if (this.dir >= 6 && this.dir < 7)
			{
				this.y -= this.speed * y;
			}
			if (this.dir >= 7 && this.dir < 8)
			{
				this.x += this.speed * y * 0.65;
				this.y -= this.speed * y * 0.65;
			}
		}

		var c = engine.collideSprites(this);

		if (c && (c.getType() == "SpriteBuilding" || c.getType() == "ElectricityBuilding"))
		{
			this.setXY(ox, oy);
		}

		var e = engine.collideEnemies(this);
		
		if (e)
		{
			var sp = this.speed * 0.3;

			if (y > 0)
			{
				e.dir = this.dir;
			}
			else
			{
				if (this.dir >= 0 && this.dir < 1)
				{
					e.dir = 4
				}
				if (this.dir >= 1 && this.dir < 2)
				{
					e.dir = 5;
				}
				if (this.dir >= 2 && this.dir < 3)
				{
					e.dir = 6;
				}
				if (this.dir >= 3 && this.dir < 4)
				{
					e.dir = 7;
				}
				if (this.dir >= 4 && this.dir < 5)
				{
					e.dir = 0;
				}
				if (this.dir >= 5 && this.dir < 6)
				{
					e.dir = 1;
				}
				if (this.dir >= 6 && this.dir < 7)
				{
					e.dir = 2;
				}
				if (this.dir >= 7 && this.dir < 8)
				{
					e.dir = 3;
				}
			}
			if (e.dir >= 0 && e.dir < 1)
			{
				e.x += sp;
			}
			if (e.dir >= 1 && e.dir < 2)
			{
				e.x += sp * 0.65;
				e.y += sp * 0.65;
			}
			if (e.dir >= 2 && e.dir < 3)
			{
				e.y += sp;
			}
			if (e.dir >= 3 && e.dir < 4)
			{
				e.x -= sp * 0.65;
				e.y += sp * 0.65;
			}
			if (e.dir >= 4 && e.dir < 5)
			{
				e.x -= sp;
			}
			if (e.dir >= 5 && e.dir < 6)
			{
				e.x -= sp * 0.65;
				e.y -= sp * 0.65;
			}
			if (e.dir >= 6 && e.dir < 7)
			{
				e.y -= sp;
			}
			if (e.dir >= 7 && e.dir < 8)
			{
				e.x += sp * 0.65;
				e.y -= sp * 0.65;
			}
			
			e.accel = this.speed * 1.3;
			e.yoffset = this.speed * 1.3;
			e.hp -= 1;
		}
	}
	keyUpdate()
	{
		if (engine.selSprite == this)
		{

			// Watch for Keyup Status on command keys.
			if (this.keyStatus[71] && !this.controller.isKeyPressed(71))
			{
				if (this.seats.length > 0)
				{
					// Debarking
					var sp = this.seats.pop();
					sp.setXY(this.x + this.getW() / 2 - this.getW() / 2, this.y + this.getH() / 2 - this.getH() / 2);
					engine.selSprite = sp;
					engine.addSprite(sp.name, sp);
				}
			}
		
			// Update Keydown/up Status
			
			// G Key
			this.keyStatus[71] = this.controller.isKeyPressed(71);
			
			this.isMoving = false;
			if (this.controller.isKeyPressed(68))
			{
				// Turn Right
				this.move(0.05 * this.speed, 0);
				this.isMoving = true;
			}
			if (this.controller.isKeyPressed(65))
			{
				// Turn Left
				this.move(-0.05 * this.speed, 0);
				this.isMoving = true;
			}
			if (this.controller.isKeyPressed(83))
			{
				// Move Forward
				this.move(0, -1);
				this.isMoving = true;
			}
			if (this.controller.isKeyPressed(87))
			{
				// Move Backward
				this.move(0, 1);
				this.isMoving = true;
			}
		}
	}
	update()
	{
		if (this.seats.length > 0)
		{
			this.piloted = true;
		}
		else
		{
			this.piloted = false;
		}
	
		this.sprite_def.update();

		this.keyUpdate();

		var isMoving = this.isMoving;
		
		// Depending on the rotation of the vehicle, show the correct
		// animation direction.
		if (
			(this.dir >= 0 && this.dir < 1)
		)
		{
			this.playAnim('Moving East');
		}
		if (
			(this.dir >= 1 && this.dir < 2)
		)
		{
			this.playAnim('Moving Southeast');
		}
		if (
			(this.dir >= 2 && this.dir < 3)
		)
		{
			this.playAnim('Moving South');
		}
		if (
			(this.dir >= 3 && this.dir < 4)
		)
		{
			this.playAnim('Moving Southwest');
		}
		if (
			(this.dir >= 4 && this.dir < 5)
		)
		{
			this.playAnim('Moving West');
		}
		if (
			(this.dir >= 5 && this.dir < 6)
		)
		{
			this.playAnim('Moving Northwest');
		}
		if (
			(this.dir >= 6 && this.dir < 7)
		)
		{
			this.playAnim('Moving North');
		}
		if (
			(this.dir >= 7 && this.dir < 8)
		)
		{
			this.playAnim('Moving Northeast');
		}


		
		if (!isMoving)
		{
			this.pauseAnim();
		}
		
		this.draw();

	}
	draw()
	{
		if (!this.sheetUnits.imgDOM)
		{
			print('Sprite class draw error: imgDOM object is undefined.');
			return;
		}
		var frame = this.sprite_def.getCurrentFrame();
		var sx = frame.getX();
		var sy = frame.getY();
		var w = frame.getWidth();
		var h = frame.getHeight();
		var dx = this.getX();
		var dy = this.getY();
		this.ctx.drawImage(this.sheetUnits.imgDOM, sx, sy, w, h, dx, dy, w, h);

		if (engine.selSprite == this)
		{

			var ctx = this.ctx;
			ctx.font = "bold 18px Share Tech Mono";
			ctx.fillStyle = "#89ae8e";
			ctx.fillText("Commands", 600, 45);

			
			ctx.font = "bold 12px Share Tech Mono";
			if (this.piloted)
			{
				ctx.fillStyle = "#89ae8e";
				ctx.fillText("Piloted (" + this.seats.length + " crew)", 600, 65);
			}
			else
			{
				ctx.fillStyle = "#f10000";
				ctx.fillText("Not piloted!", 600, 65);
				ctx.fillText("(EVA crew can board)", 600, 78);
			}
			ctx.fillStyle = "#89ae8e";

			ctx.fillText("W A S D - Turn/Move", 600, 91);
			ctx.fillText("G - Debark Crewmember", 600, 104);

		}
		
		if (_DEBUG && _DEBUG_BoundingBox)
		{
			var ctx = this.ctx;
			
			ctx.strokeStyle = ctx.fillStyle;
			
			ctx.strokeRect(this.x, this.y, this.getW(), this.getH());
		}
	}
}



// UI Views

class UISprite extends Sprite
{
	constructor(name, x, y, controller, sprite_def, resource_name)
	{
		super(name, x, y, controller, sprite_def, resource_name);
	}
	getType()
	{
		return 'UISprite';
	}
	update()
	{
		this.sprite_def.update();

		this.keyUpdate();
	}
	
	// Events
	
	onClick(e)
	{
	}
	onMouseOver(e)
	{
	}
	onMouseOut(e)
	{
	}
	onMouseMove(e)
	{
	}
	onKeyPress(e)
	{
	}
	keyUpdate()
	{
		return;
	}
	
	draw()
	{
		if (!this.sheetUnits.imgDOM)
		{
			print('Sprite class draw error: imgDOM object is undefined.');
			return;
		}
		var frame = this.sprite_def.getCurrentFrame();
		var sx = frame.getX();
		var sy = frame.getY();
		var w = frame.getWidth();
		var h = frame.getHeight();
		var dx = this.getX();
		var dy = this.getY();
		this.ctx.drawImage(this.sheetUnits.imgDOM, sx, sy, w, h, dx, dy, w, h);
	}
	
}
class UIDialog extends UISprite
{
	constructor(name, x, y, controller, sprite_def, resource_name)
	{
		if (sprite_def == undefined)
		{
			sprite_def = new SpriteDef('ui dialog');
			resource_name = 'ui dialog';

			var frames = new SpriteList('Dialog');
			frames.addFrame(new SpriteFrame('Dialog', 0, 0, 516, 500));
			sprite_def.addAnim('Dialog', frames);

			sprite_def.playAnim('Dialog');
		}
		
		super(name, x, y, controller, sprite_def, resource_name);
		
		// UI Elements that belong in this dialog
		this.ui = new UIList();
		
		this.y = 82;
		this.x = this.getW() * -1;
		
		this.status = "closed"
		
		this.slidingIn = false;
		this.slidingOut = false;
		this.slideSpeed = 50;
	}
	getType()
	{
		return "UIDialog";
	}
	slideIn()
	{
		this.slidingIn = true;
		this.slidingOut = false;

	}
	slideOut()
	{
		this.slidingOut = true;
		this.slidingIn = false;
	}
	update()
	{
		if (this.slidingIn && this.x < this.slideSpeed * -1)
		{
			this.x += this.slideSpeed;
		}
		else if (this.slidingIn && this.x >= this.slideSpeed * -1)
		{
			this.x = 0;
			this.slidingIn = false;
			this.status = "open"
		}

		if (this.slidingOut && this.x > (this.getW() * -1) + this.slideSpeed)
		{
			this.x -= this.slideSpeed;
		}
		else if (this.slidingOut && this.x <= (this.getW() * -1) + this.slideSpeed)
		{
			this.x = (this.getW() * -1);
			this.slidingOut = false;
			this.status = "closed"
		}
	
		this.sprite_def.update();
		
		this.keyUpdate();
				
		if (!this.isMoving)
		{
			this.pauseAnim();
		}
		
		this.ui.update();

	}
	draw()
	{
		super.draw();
		
		this.ctx.save();
		this.ctx.translate(this.getX(), this.getY());
		this.ui.draw();
		this.ctx.restore();
	}
}
class UIButton extends UISprite
{
	constructor(name, x, y, controller, sprite_def, resource_name)
	{
		if (sprite_def == undefined)
		{
			sprite_def = new SpriteDef('ui button');
			resource_name = 'ui button';

			var frames = new SpriteList('LightsOn');
			frames.addFrame(new SpriteFrame('LightsOn0', 0, 0, 95, 47));
			sprite_def.addAnim('LightsOn', frames);
			var frames = new SpriteList('LightsOff');
			frames.addFrame(new SpriteFrame('LightsOff0', 0, 48, 95, 47));
			sprite_def.addAnim('LightsOff', frames);

			sprite_def.playAnim('LightsOff');

		}
		super(name, x, y, controller, sprite_def, resource_name);
		
	}
	draw()
	{
					
		super.draw();
	
		var ctx = this.ctx;
		ctx.font = "bold 18px Share Tech Mono";
		if (this.sprite_def.animId == 'LightsOff')
		{
			ctx.fillStyle = "#89ae8e";
		}
		else
		{
			ctx.fillStyle = "#162322";
		}
		var m = ctx.measureText(this.name);
		var tw = m.width;
		var tx = parseInt((45) - (tw / 2));
		ctx.fillText(this.name, this.x + 5 + tx, this.y + 30);

	}
	onMouseOver(e)
	{
		this.sprite_def.playAnim('LightsOn');
	}
	onMouseOut(e)
	{
		this.sprite_def.playAnim('LightsOff');
	}
	onClick(e)
	{
		print("Button Click");
		
	}			
	
}
class UITinyButton extends UISprite
{
	constructor(name, x, y, controller, sprite_def, resource_name)
	{
		if (sprite_def == undefined)
		{
			sprite_def = new SpriteDef('ui tinybutton');
			resource_name = 'ui tinybutton';

			var frames = new SpriteList('LightsOn');
			frames.addFrame(new SpriteFrame('LightsOn0', 0, 0, 80, 28));
			sprite_def.addAnim('LightsOn', frames);
			var frames = new SpriteList('LightsOff');
			frames.addFrame(new SpriteFrame('LightsOff0', 0, 28, 80, 28));
			sprite_def.addAnim('LightsOff', frames);

			sprite_def.playAnim('LightsOff');

		}
		super(name, x, y, controller, sprite_def, resource_name);
	}
	draw()
	{
					
		super.draw();
	
		var ctx = this.ctx;
		ctx.font = "bold 16px Share Tech Mono";
		if (this.sprite_def.animId == 'LightsOff')
		{
			ctx.fillStyle = "#89ae8e";
		}
		else
		{
			ctx.fillStyle = "#162322";
		}
		var m = ctx.measureText(this.name);
		var tw = m.width;
		var tx = parseInt((40) - (tw / 2));
		ctx.fillText(this.name, this.x + 5 + tx, this.y + 20);

	}
	onMouseOver(e)
	{
		this.sprite_def.playAnim('LightsOn');
	}
	onMouseOut(e)
	{
		this.sprite_def.playAnim('LightsOff');
	}
	onClick(e)
	{
		print("Button Click");
		
	}}
class UITextbox extends UISprite
{
	constructor(name, x, y, controller, parent)
	{
		var sprite_def = new SpriteDef('ui text');
		var resource_name = 'ui text';

		var frames = new SpriteList('LightsOn');
		frames.addFrame(new SpriteFrame('LightsOn0', 0, 0, 225, 28));
		sprite_def.addAnim('LightsOn', frames);
		var frames = new SpriteList('LightsOff');
		frames.addFrame(new SpriteFrame('LightsOff0', 0, 28, 225, 28));
		sprite_def.addAnim('LightsOff', frames);

		sprite_def.playAnim('LightsOff');

		super(name, x, y, controller, sprite_def, resource_name);
		this.cursorPos = name.length;
		this.parentList = parent;
	}
	draw()
	{

		super.draw();
	
		var ctx = this.ctx;
		ctx.font = "bold 18px Share Tech Mono";
		if (this.sprite_def.animId == 'LightsOff')
		{
			ctx.fillStyle = "#89ae8e";
		}
		else
		{
			ctx.fillStyle = "#162322";
		}
		var m = ctx.measureText(this.name.slice(0, this.cursorPos));
		ctx.fillText(this.name, this.x + 9, this.y + 20);

		var parent = this.parentList;
		if (parent.getSelectedUI != undefined && new Date().getTime() % 500 > 255 && this == parent.getSelectedUI())
		{
			ctx.fillRect(this.x + 9 + m.width, this.y + 22, 2, -18);
		}

	}
	
	onMouseOver(e)
	{
		this.sprite_def.playAnim('LightsOn');
	}
	onMouseOut(e)
	{
		this.sprite_def.playAnim('LightsOff');
	}
	onClick(e)
	{
		console.log(this.parentList);
	}
	regexMatch(key)
	{
		return key.match(/^\w+$/) || key == " ";
	}
	onKeyPress(e)
	{
		var parent = this.parentList;
		if (parent.getSelectedUI != undefined && this == parent.getSelectedUI())
		{
			var p1 = this.name.slice(0, this.cursorPos);
			var p2 = this.name.slice(this.cursorPos);
			var key = String.fromCharCode(e.charCode);
			if (e.keyCode == 8)
			{
				this.cursorPos--;
				this.name = p1.slice(0, this.cursorPos) + p2;
				if (this.cursorPos < 0)
				{
					this.name = "";
					this.cursorPos = 0;
				}
				return true;
			}
			else if (e.keyCode == 46)
			{
				this.name = p1 + p2.slice(1);
				if (this.cursorPos > this.name.length)
				{
					this.cursorPos = this.name.length;
				}
				return true;
			}
			else if (e.keyCode == 35)
			{
				this.cursorPos = this.name.length;
			}
			else if (e.keyCode == 36)
			{
				this.cursorPos = 0;
			}
			else if (e.keyCode == 13)
			{
				parent.setSelectedUI(false);
			}
			else if (e.keyCode == 37)
			{
				this.cursorPos--;
				if (this.cursorPos < 0)
				{
					this.cursorPos = 0;
				}
			}
			else if (e.keyCode == 39)
			{
				this.cursorPos++;
				if (this.cursorPos > this.name.length)
				{
					this.cursorPos = this.name.length;
				}
			}
			else
			{
				 //console.log(e);
			}
			
			if (this.regexMatch(key))
			{
				this.name = p1 + key + p2;
				this.cursorPos++;
			}
		}
	}
	
}
class UITextboxNumeric extends UITextbox
{
	regexMatch(key)
	{
		return key.match(/[0-9]/);
	}
	
}

class UIList
{
	constructor()
	{
		this.list = [];
		
		this.oldMX = 0;
		this.oldMY = 0;
		this.uiElementHover = false;
		this.uiElementSelected = false;
	}
	addUIElement(f)
	{
		if (this.list.length == 0)
		{
			this.selectedId = 0;
		}
		return this.list.push(f);
	}
	getUIElement(index)
	{
		if (this.list[index] != undefined)
		{
			return this.list[index];
		}
	}
	getUIElementByName(name)
	{
		for (var i = 0; i < this.list.length; i++)
		{
			if (this.list[i].name == name)
			{
				return this.list[i];
			}
		} 
		return false;
	}
	getUIElementAt(x, y)
	{
		if (this.list.length == 0) { return; }

		for (var i = this.list.length - 1; i >= 0; i--)
		{
			var r = this.list[i];
			if (r)
			{
				if (x >= r.x && x <= r.x + r.getW()
					&& y >= r.y && y <= r.y + r.getH())
				{
					return r;
				}
			}
		}
		return false;
	}
	setSelectedUI(el)
	{
		this.uiElementSelected = el;
	}
	getSelectedUI()
	{
		return this.uiElementSelected;
	}
	getCount()
	{
		return this.list.length;
	}
	update()
	{
		if (this.list.length == 0) { return; }
		
		for (var i = this.list.length - 1; i >= 0; i--)
		{
			this.list[i].update();
		}
	}
	draw()
	{
		if (this.list.length == 0) { return; }
		
		for (var i = 0; i < this.list.length; i++)
		{
			this.list[i].draw();
		}
	}
	
	// Event Handlers
	
	mouseUpdate(e)
	{
		var el = this.getUIElementAt(e.clientX, e.clientY);
		if (el && el.getType() == "UIDialog" && el.status == "open")
		{	
			var el = el.ui.getUIElementAt(e.clientX - el.getX(), e.clientY - el.getY());
		}
				
		engine.ui.oldMX = e.clientX;
		engine.ui.oldMY = e.clientY;
		
		if (el)
		{
			if (this.uiElementHover != false && this.uiElementHover != el)
			{
				this.uiElementHover.onMouseOut(e);
				this.uiElementHover = el;
				el.onMouseOver(e);
			}
			else if (this.uiElementHover == false)
			{
				this.uiElementHover = el;
				el.onMouseOver(e);
			}
			else if (this.uiElementHover == el)
			{
				el.onMouseMove(e);
			}
		}
		else
		{
			if (this.uiElementHover != false)
			{
				this.uiElementHover.onMouseOut(e);
				this.uiElementHover = false;
			}
		}
		
		return true;
	}
	clickUpdate(e)
	{
		var el = this.getUIElementAt(e.clientX, e.clientY);
		var dialog = false;
		if (el && el.getType() == "UIDialog" && el.status == "open")
		{	
			dialog = el;
			var el = el.ui.getUIElementAt(e.clientX - el.getX(), e.clientY - el.getY());
		}
				
		this.oldMX = e.clientX;
		this.oldMY = e.clientY;
		
		if (el)
		{
			if (!dialog)
			{
				this.setSelectedUI(el);
			}
			else {
				dialog.ui.setSelectedUI(el);
			}
			el.onClick(e);
			return true;
		}
		else
		{
			this.setSelectedUI(false);
		}

		return false;
	}
	onKeyPress(e)
	{
		var el = this.getSelectedUI();
				
		for (var i = 0; i < this.list.length; i++)
		{
			if (this.list[i].getType != undefined && this.list[i].getType() == "UIDialog")
			{
				this.list[i].ui.onKeyPress(e);
			}
			else
			{
				this.list[i].onKeyPress(e);
			}
		}
		return true;
	}
}
class UIListItem extends UISprite
{
	constructor(name, x, y, controller, sprite_def, resource_name)
	{
		if (sprite_def == undefined)
		{
			sprite_def = new SpriteDef('ui multilist');
			resource_name = 'ui multilist';

			var frames = new SpriteList('LightsOn');
			frames.addFrame(new SpriteFrame('LightsOn0', 0, 0, 331, 35));
			sprite_def.addAnim('LightsOn', frames);
			var frames = new SpriteList('LightsOff');
			frames.addFrame(new SpriteFrame('LightsOff0', 0, 36, 331, 35));
			sprite_def.addAnim('LightsOff', frames);

			sprite_def.playAnim('LightsOff');

		}
		super(name, x, y, controller, sprite_def, resource_name);
	}
	draw()
	{
					
		super.draw();
	
		var ctx = this.ctx;
		ctx.font = "bold 18px Share Tech Mono";
		ctx.fillStyle = "#89ae8e";
		ctx.fillText(this.name, this.x + 15, this.y + 24);

	}
	onClick()
	{
		print("ui listitem click");
	}
}

class UIMultiList extends UISprite
{
	constructor(name, x, y, controller)
	{
		var sprite_def = new SpriteDef('ui multilist');
		sprite_def = new SpriteDef('ui dialog');
		resource_name = 'ui dialog';

		var frames = new SpriteList('Dialog');
		frames.addFrame(new SpriteFrame('Dialog', 0, 0, 331, 142));
		sprite_def.addAnim('Dialog', frames);
		
		sprite_def.playAnim('Dialog');

		var resource_name = 'ui multilist';
	
		super(name, x, y, controller, sprite_def, resource_name);
		
		this.multiSelect = false;
		this.list = new UIList();
	}
	addItem(name)
	{
		this.list.addUIElement(new UIListItem(name, this.getX(), this.getY() + (36 * this.list.getCount()), engine));
		this.sprite_def.getCurrentFrame().height = 36 * this.list.getCount();
	}
	update()
	{
	}
	draw()
	{
		this.list.draw();
	}
	onMouseOver(e)
	{
		
	}
	onMouseOut(e)
	{
		
	}
	onMouseMove(e)
	{

	}
	getSelected()
	{
		var names = [];
		
		for (var i = 0; i < this.list.list.length; i++)
		{
			if (this.list.list[i].sprite_def.animId == 'LightsOn')
			{
				names.push(this.list.list[i].name);
			}
		} 
		return names;
	}
	setSelectedIndex(i)
	{
		var el = this.list.getUIElement(i);

		if (el)
		{
			var oldEl = this.list.getSelectedUI();
			if (el.sprite_def.animId == 'LightsOn')
			{
				el.playAnim("LightsOff");
			}
			else
			{
				el.playAnim("LightsOn");
				this.list.setSelectedUI(el)
			}
			if (oldEl && !this.multiSelect)
			{
				oldEl.playAnim("LightsOff");
			}
		}
	}
	onClick(e)
	{
		var i = parseInt((e.clientY - this.getY() - 86) / 36);
		this.setSelectedIndex(i);
	}
	
}
class UIImageList
{
	constructor(name, x, y, images)
	{
	}
}
