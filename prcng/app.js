'use strict';

var $;

window.onerror = function (msg, url, lineNumber) {
	$("#errors").append($("<li></li>").text(msg));
	return false;
};

var PIXI;
var jQuery;
var BezierEasing;

jQuery.fn.tag = function() {
	return this.prop("tagName");
};
jQuery.fn.itn = function() { // Immediate Text Nodes
	return this.contents().filter(
		function () { return this.nodeType == 3; }
	);
};

var type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) type = "canvas";
PIXI.utils.sayHello(type);

var sw = window.innerWidth; var sh = window.innerHeight;
if (sw * 9 > sh * 16) sw = sh * 16 / 9;
else sh = sw / 16 * 9;
const app = new PIXI.Application({ width: sw, height: sh });

const view = app.view;
$("#stage").append(view);
app.ticker.add(onTick);

const stage = app.stage;
stage.interactive = true;
stage.on("click", onClick);
stage.on("tap", onClick);
stage.sortableChildren = true;

const loader = PIXI.Loader.shared;
const res = loader.resources;

const bg = new PIXI.Sprite();
bg.zindex = -10;
bg.width = sw; bg.height = sh;
stage.addChild(bg);

const charag = new PIXI.Container();
charag.zindex = 5;
stage.addChild(charag);

const charaself = new PIXI.Sprite();
charaself.zindex = 6;
stage.addChild(charaself);

const dialog = new PIXI.Sprite();
dialog.zindex = 9;
dialog.x = 0; dialog.y = 0.58 * sh;
dialog.width = 0.85 * sw;
dialog.height = 0.85 * sw * 40 / 153;
stage.addChild(dialog);

const charan = new PIXI.Text("", {
	"fontSize": sw / 26,
	"fontWeight": "bold",
});
charan.zindex = 10;
charan.x = 0.05 * sw; charan.y = 0.61 * sh;
stage.addChild(charan);

const line = new PIXI.Text("", {
	"fontSize": sw / 28,
	"wordWrap": true,
	"wordWrapWidth": 0.9 * sw,
});
line.zindex = 10;
line.x = 0.05 * sw; line.y = 0.7 * sh;
stage.addChild(line);

const choiceg = new PIXI.Container();
choiceg.zindex = 15;
stage.addChild(choiceg);

const state = new PIXI.Text("", {
	"fontSize": sw / 32,
});
state.zindex = 20;
stage.addChild(state);

loader.onComplete.add(() => {
	console.log("Texture load completed");
});
loader.onError.add(e => {
	console.error("Texture load error: " + e);
	$("#errors").append($("<li></li>").text("Texture load error: " + e));
});

const tex = $("tex");
var cur = null;
var charas = [];
var anim = [];
var typertime = 0;
var typespeed = 20;
var typer = [];

loader.add($.map([
	"dialog", "dialog_a", "dialog_l", "dialog_m", "dialog_r", "dialog_s"
], i => { return {"name": i, "url": "assets/" + i + ".png" }; })).load(() => run("prologue"));

function run(id) {
	cur = $("#" + id).children().first();
	proc();
}

function proc() {
	while (true) {
		var tag = cur.tag().toLowerCase();
		if (tag == "chara") {
			procChara();
		}
		else if (tag == "choices") {
			procChoices(); return;
		}
		else if (tag == "comment") { }
		else if (tag == "line") {
			procLine(); return;
		}
		else if (tag == "profile") {
			procProfile(); return;
		}
		else if (tag == "scene") {
			procScene(); return;
		}
		else {
			throw new Error("Unknown act script entry " + tag);
		}
		cur = cur.next();
	}
}

function next() {
	var r = cur.next();
	if (r.length == 0) cur = cur.parent().next();
	else cur = r;
	proc();
}

function procChoices() {
	var choices = cur.children();
	for (var i in choices) {
		var c = choices[i];
	}
	throw new Error("Choices not implemented yet");
}

function procChara(chara) {
	if (!chara) chara = cur;
	var index = chara.attr("i");
	var c = charas[index];
	if (!c) throw new Error("Character data for " + index.toString() + " not found");
	if (c.profile == "") return;
	var exp = chara.attr("exp");
	if (exp) c.exp = exp;
	var pos = parseAnim(chara.attr("pos"), c.pos);
	var srcx = sw / 2 + c.pos * sw / 5;
	c.pos = parseFloat(pos.value);
	var enter = parseAnim(chara.attr("enter"));
	var leave = parseAnim(chara.attr("leave"));
	var t = res["c" + index + "_" + c.profile + "_" + c.exp].texture;
	if (c.sprite == null) {
		if (c.self) c.sprite = charaself;
		else {
			c.sprite = new PIXI.Sprite();
			c.sprite.zindex = 5;
			charag.addChild(c.sprite);
		}
		c.sprite.alpha = 0;
	}
	if (chara.attr("ready") == null) c.sprite.visible = true;
	c.sprite.texture = t;
	if (c.self) {
		c.sprite.anchor.set(1);
		c.sprite.x = sw; c.sprite.y = sh;
		c.sprite.width = c.sprite.height = sw / 4;
	}
	else {
		c.sprite.anchor.set(0.5, 0);
		var tw = t.width; var th = t.height;
		var bw = tw * sh / th;
		var destx = sw / 2 + c.pos * sw / 5;
		c.sprite.width = bw;
		c.sprite.height = sh;
		anim.push({
			"target": i => c.sprite.x = i,
			"time": 0,
			"duration": pos.duration,
			"t1": srcx, "t2": destx,
			"transition": pos.transition,
		});
	}
	switch (enter.value) {
		case "fade": anim.push({
				"target": i => c.sprite.alpha = i,
				"time": 0,
				"duration": enter.duration,
				"t1": c.sprite.alpha, "t2": 1,
				"transition": enter.transition,
			}); break;
		default: anim.push({
				"target": i => c.sprite.alpha = i,
				"time": 0,
				"duration": 0,
				"t1": c.sprite.alpha, "t2": 1,
				"transition": enter.transition,
			}); break;
	}
	switch (leave.value) {
		case "fade": anim.push({
				"target": i => c.sprite.alpha = i,
				"time": 0,
				"duration": leave.duration,
				"t1": c.sprite.alpha, "t2": 0,
				"transition": leave.transition,
				"callback": () => c.sprite.visible = false,
			}); break;
		case undefined: break;
		default: anim.push({
				"target": i => c.sprite.alpha = i,
				"time": 0,
				"duration": 0,
				"t1": c.sprite.alpha, "t2": 0,
				"transition": leave.transition,
				"callback": () => c.sprite.visible = false,
			}); break;
	}
}

function procLine() {
	var chara = cur.children("chara");
	if (chara.length > 0) {
		procChara(chara);
		var index = chara.attr("i");
		var c = charas[index];
		charan.text = c.name;
		if (c.self) dialog.texture = res["dialog_s"].texture;
		else if (c.pos < 0) dialog.texture = res["dialog_l"].texture;
		else if (c.pos == 0) dialog.texture = res["dialog_m"].texture;
		else dialog.texture = res["dialog_r"].texture;
	}
	else charan.text = "";
	if (cur.attr("aside") == "") dialog.texture = res["dialog_a"].texture;
	line.style.wordWrapWidth = (charaself.visible ? 0.7 : 0.9) * sw;
	line.text = "";
	var t = cur.contents().each(function (index) {
		var nn = this.nodeName.toLowerCase();
		if (nn == "#text") typer.push({ "speed": typespeed, "text": this.textContent });
		else if (nn == "speed") typespeed = parseFloat(this.innerText);
		else if (nn == "pause") typer.push({ "pause": parseFloat(this.innerText) });
		else if (nn == "interrupt") typer.push({ "interrupt": true });
	});
}

function procProfile() {
	var chara = cur.children("chara");
	var index = chara.attr("i");
	var index2 = cur.itn().text();
	loadChara(index);
	var name = chara.text();
	if (name != "") charas[index].name = name;
	if (cur.attr("self") != undefined) charas[index].self = true;
	charas[index].profile = index2;
	var l = tex.children("chara[i='" + index + "_" + index2 + "']").text().split(",");
	charas[index].exp = l[0];
	l = $.map(l, function (i) {
		var key = "c" + index + "_" + index2 + "_" + i;
		return { name: key, url: "assets/" + key + ".png" };
	});
	loader.add(l).load(() => next());
}

function procScene() {
	var index = cur.attr("i");
	var index2 = cur.text();
	var l = tex.children("scene[i='" + index + "']").text().split(",");
	l = $.map(l, function (i) {
		var key = "s" + index + "_" + i;
		return { name: key, url: "assets/" + key + ".png" };
	});
	loader.add(l).load(() => {
		bg.texture = res["s" + index + "_" + index2].texture;
		next();
	});
}

function loadChara(index) {
	if (charas[index] != undefined) return;
	charas[index] = { name: "", self: false, profile: "", pos: 0, exp: "", sprite: null };
}

function parseAnim(data, def) {
	var value;
	var a = [0];
	if (data != undefined) {
		var l = data.split(";");
		value = l[0];
		if (l.length > 1) a = $.map(l[1].split(","), i => parseFloat(i));
	}
	else value = def;
	if (a.length == 1) a.push(0);
	if (a.length == 2) a.push(0, 0, 1, 1);
	return {
		"value": value,
		"duration": a[0],
		"transition": BezierEasing(a[1], a[2], a[3], a[4]),
	};
}

function onClick(e) {
	if (typer.length > 0) flushTyper();
	else next();
}

function flushTyper() {
	if (!typer[0].pause) {
		var s = Math.floor(typertime);
		line.text += typer[0].text.slice(s);
	}
	typer.splice(0, 1);
	for (var i in typer) {
		var t = typer[i];
		if (t.interrupt) {
			typertime = 0;
			typer.length = 0;
			next();
			return;
		}
		else if (t.pause) continue;
		if (typer[i].text) line.text += typer[i].text;
	}
	typertime = 0;
	typer.length = 0;
}

function onTick(e) {
	state.text = Math.round(app.ticker.FPS).toString() + "FPS"
		+ "\n" + (Math.round(typertime * 10) / 10).toString();
	if (loader.loading) state.text += "\n" + Math.floor(loader.progress) + "%";
	for (var i = anim.length - 1; i >= 0; i--) {
		var a = anim[i];
		var x;
		if (a.duration == 0) {
			x = a.t2;
			anim.splice(i, 1);
			if (a.callback != undefined) a.callback();
		}
		else {
			a.time += 1 / 60;
			var p = a.time / a.duration;
			if (p >= 1) {
				p = 1;
				anim.splice(i, 1);
				if (a.callback != undefined) a.callback();
			}
			var p3 = a.transition(p);
			x = a.t1 * (1 - p3) + a.t2 * p3;
		}
		a.target(x);
	}
	if (typer.length > 0) {
		var t = typer[0];
		if (t.interrupt) {
			typertime = 0;
			typer.length = 0;
			next();
		}
		else if (t.pause) {
			typertime += 1 / 60;
			if (typertime >= t.pause) {
				typertime = 0;
				typer.splice(0, 1);
			}
		}
		else {
			var s = Math.floor(typertime);
			typertime += t.speed / 60;
			var e = Math.floor(typertime);
			var nt = t.text.slice(s, e);
			line.text += nt;
			if (typertime >= t.text.length) {
				typertime = 0;
				typer.splice(0, 1);
			}
		}
	}
}
