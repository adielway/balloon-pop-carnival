import { AudioManager } from "./audio.js";
import { Balloon } from "./balloon.js";
import { Particle } from "./particle.js";

export class Game {
  constructor() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.audio = new AudioManager();

    this.elements = {
      input: document.getElementById("nameInput"),
      bulkInput: document.getElementById("bulkInput"),
      addButton: document.getElementById("addBtn"),
      bulkButton: document.getElementById("bulkBtn"),
      startButton: document.getElementById("startBtn"),
      popButton: document.getElementById("popBtn"),
      nextButton: document.getElementById("nextBtn"),
      resetButton: document.getElementById("resetBtn"),
      musicButton: document.getElementById("musicBtn"),
      entryArea: document.getElementById("entryArea"),
      hint: document.getElementById("hint")
    };

    this.width = 1100;
    this.height = 720;
    this.maxNames = 40;
    this.colors = ["#ff5d7a", "#ffb74d", "#5cbeff", "#ae7dff", "#5bd39e", "#ff82d2", "#ffdc5c"];
    this.names = [];
    this.balloons = [];
    this.particles = [];
    this.phase = "input";
    this.winner = "";
    this.target = null;
    this.dart = null;
    this.revealAt = 0;
    this.lastFrame = 0;
    this.elapsed = 0;

    this.bindEvents();
    this.updateControls();
    requestAnimationFrame((time) => this.animate(time));
  }

  bindEvents() {
    const ui = this.elements;
    ui.addButton.addEventListener("click", () => this.addOneName());
    ui.bulkButton.addEventListener("click", () => this.addManyNames());
    ui.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.addOneName();
      }
    });
    ui.startButton.addEventListener("click", () => this.startGame());
    ui.popButton.addEventListener("click", () => this.shootDart());
    ui.nextButton.addEventListener("click", () => this.nextRound());
    ui.resetButton.addEventListener("click", () => this.resetGame());
    ui.musicButton.addEventListener("click", () => this.toggleMusic());
  }

  cleanNames(text) {
    return text
        .split(/[\r\n,;\t]+/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
  }

  addOneName() {
    const name = this.elements.input.value.trim();
    if (!name) return;
    if (this.names.length >= this.maxNames) {
      this.elements.hint.textContent = `The limit is ${this.maxNames} names.`;
      return;
    }
    this.names.push(name.slice(0, 40));
    this.elements.input.value = "";
    this.updateControls();
  }

  addManyNames() {
    const incoming = this.cleanNames(this.elements.bulkInput.value);
    if (!incoming.length) {
      this.elements.hint.textContent = "Paste or type a list of names first.";
      return;
    }
    const room = this.maxNames - this.names.length;
    const accepted = incoming.slice(0, Math.max(0, room)).map((name) => name.slice(0, 40));
    this.names.push(...accepted);
    this.elements.bulkInput.value = "";
    this.updateControls();
    const skipped = incoming.length - accepted.length;
    this.elements.hint.textContent = skipped
      ? `${accepted.length} names added. ${skipped} skipped because the ${this.maxNames}-name limit was reached.`
      : `Added ${accepted.length} names! You now have ${this.names.length} names.`;
  }

  updateControls() {
    this.elements.startButton.disabled = this.names.length === 0;
    this.elements.hint.textContent = `${this.names.length} / ${this.maxNames} names added. Names stay secret inside the balloons!`;
  }

  buildBalloons() {
    this.balloons = [];
    const count = this.names.length;
    const columns = count <= 8 ? 4 : 8;
    const xGap = count <= 8 ? 170 : 94;
    const yGap = count <= 8 ? 165 : 66;
    const startX = count <= 8 ? 430 : 365;
    const startY = count <= 8 ? 330 : 285;
    const radius = count <= 8 ? 37 : 28;

    this.names.forEach((name, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      this.balloons.push(new Balloon(
        name,
        startX + column * xGap + (row % 2) * 8,
        startY + row * yGap,
        this.colors[index % this.colors.length],
        index * 0.73,
        radius
      ));
    });
  }

  startGame() {
    if (!this.names.length) return;
    this.phase = "game";
    this.buildBalloons();
    this.elements.entryArea.hidden = true;
    this.elements.startButton.hidden = true;
    this.elements.popButton.hidden = false;
    this.elements.resetButton.hidden = false;
    this.elements.nextButton.hidden = true;
    this.elements.popButton.disabled = false;
  }

  resetGame() {
    this.names = [];
    this.balloons = [];
    this.particles = [];
    this.winner = "";
    this.target = null;
    this.dart = null;
    this.phase = "input";
    this.elements.entryArea.hidden = false;
    this.elements.startButton.hidden = true;
    this.elements.popButton.hidden = true;
    this.elements.nextButton.hidden = true;
    this.elements.resetButton.hidden = true;
    this.elements.startButton.disabled = true;
    this.elements.input.value = "";
    this.elements.bulkInput.value = "";
    this.updateControls();
  }

  nextRound() {
    if (!this.names.length) {
      this.resetGame();
      return;
    }
    this.startGame();
  }

  shootDart() {
    if (this.phase !== "game" || this.dart || !this.names.length) return;
    const available = this.balloons.filter((balloon) => !balloon.popped);
    if (!available.length) return;

    this.audio.startDrumroll();

    this.target = available[Math.floor(Math.random() * available.length)];
    this.dart = {
      x: 220, y: 445, progress: 0,
      startX: 220, startY: 445,
      endX: this.target.x, endY: this.target.y
    };
    this.elements.popButton.disabled = true;
    this.elements.hint.textContent = "The dart is on its way...";
  }

  toggleMusic() {
    const enabled = !this.audio.musicOn;
    this.audio.toggleMusic(enabled);
    this.elements.musicButton.textContent = enabled ? "♫ MUSIC: ON" : "♫ MUSIC: OFF";
    this.elements.musicButton.setAttribute("aria-pressed", String(enabled));
  }

  finishPop() {
    if (!this.target) return;
    this.target.popped = true;
    this.winner = this.target.name;
    this.audio.playPop();

    for (let i = 0; i < 36; i++) {
      this.particles.push(new Particle(this.target.x, this.target.y, this.target.color));
    }

    // Remove only the selected occurrence, even if two students share a name.
    const selectedIndex = this.names.indexOf(this.winner);
    if (selectedIndex !== -1) this.names.splice(selectedIndex, 1);

    this.phase = "suspense";
    this.revealAt = this.elapsed;
    this.elements.popButton.disabled = false;
    this.elements.popButton.hidden = true;
    this.elements.nextButton.hidden = true;
    this.elements.hint.textContent = "The carnival is choosing...";
  }

  update(deltaTime) {
    if (this.dart) {
      this.dart.progress += deltaTime * 2.5;
      if (this.dart.progress >= 1) {
        this.dart = null;
        this.finishPop();
      }
    }

    if (this.phase === "suspense" && this.elapsed - this.revealAt >= 2.0) {
      this.phase = "reveal";
      this.revealAt = this.elapsed;
      this.audio.playReveal();
      this.elements.nextButton.hidden = false;
      this.elements.nextButton.textContent = this.names.length ? "NEXT ROUND" : "FINISH";
      this.elements.hint.textContent = "The surprise has been revealed!";
    }

    this.particles.forEach((particle) => particle.update(deltaTime));
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  drawRoundedRect(x, y, width, height, radius, fill) {
    const ctx = this.ctx;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }

  drawBackground(time) {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#8bd5ff");
    gradient.addColorStop(1, "#e5f7ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = "#8bd69b";
    ctx.fillRect(0, 625, this.width, 95);
    ctx.fillStyle = "#70c985";
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.arc(i * 95, 635, 55, Math.PI, 0);
      ctx.fill();
    }

    ctx.fillStyle = "#e94f70";
    ctx.fillRect(0, 0, this.width, 125);
    for (let i = 0; i < 11; i++) {
      ctx.fillStyle = i % 2 ? "#fff4df" : "#e94f70";
      ctx.fillRect(i * 110, 0, 55, 125);
    }
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 ? "#fff4df" : "#e94f70";
      ctx.beginPath();
      ctx.ellipse(i * 100 + 25, 119, 53, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#604b60";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const x = i * 275;
      const y = 148 + Math.sin(i * 1.5) * 10;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();

    const lightColors = ["#ffe56c", "#ff8aa4", "#8ef0ce", "#c5a2ff"];
    for (let i = 0; i < 13; i++) {
      const x = 25 + i * 88;
      const y = 148 + Math.sin(i * 0.7) * 10;
      ctx.shadowBlur = 15;
      ctx.shadowColor = lightColors[i % 4];
      ctx.fillStyle = lightColors[i % 4];
      ctx.beginPath();
      ctx.arc(x, y, 8 + Math.sin(time * 3 + i) * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const flagColors = ["#ff6581", "#ffcf5e", "#66c9f2", "#6ed5a0"];
    for (let i = 0; i < 9; i++) {
      const x = 35 + i * 125;
      ctx.fillStyle = flagColors[i % 4];
      ctx.beginPath();
      ctx.moveTo(x, 166);
      ctx.lineTo(x + 38, 166);
      ctx.lineTo(x + 19, 197);
      ctx.closePath();
      ctx.fill();
    }

    for (let i = 0; i < 4; i++) {
      const x = 65 + i * 300;
      const y = 260 + (i % 2) * 70;
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.beginPath();
      ctx.arc(x, y, 27, 0, 7);
      ctx.arc(x + 28, y - 10, 34, 0, 7);
      ctx.arc(x + 60, y, 25, 0, 7);
      ctx.fill();
    }
  }

  drawKid() {
    const ctx = this.ctx;
    ctx.fillStyle = "#0002";
    ctx.beginPath();
    ctx.ellipse(124, 545, 65, 12, 0, 0, 7);
    ctx.fill();
    const body = ctx.createRadialGradient(96, 465, 5, 125, 490, 65);
    body.addColorStop(0, "#ffe18c");
    body.addColorStop(1, "#ed982b");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(120, 490, 49, 60, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#e9a779";
    ctx.fillRect(111, 421, 25, 30);
    ctx.fillStyle = "#e8a27c";
    ctx.beginPath();
    ctx.arc(91, 395, 12, 0, 7);
    ctx.arc(161, 395, 12, 0, 7);
    ctx.fill();
    const skin = ctx.createRadialGradient(113, 370, 5, 128, 395, 48);
    skin.addColorStop(0, "#ffe0bd");
    skin.addColorStop(1, "#e9a779");
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(126, 394, 40, 46, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#57321f";
    ctx.beginPath();
    ctx.ellipse(126, 365, 42, 27, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(94 + i * 20, 355 + (i % 2) * -7, 14, 0, 7);
      ctx.fill();
    }
    for (const x of [112, 140]) {
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.ellipse(x, 390, 6, 8, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#392b29";
      ctx.beginPath();
      ctx.arc(x + 1, 392, 3.5, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "#ed8b91";
    for (const x of [100, 151]) {
      ctx.beginPath();
      ctx.arc(x, 410, 7, 0, 7);
      ctx.fill();
    }
    ctx.strokeStyle = "#8d4f49";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(127, 407, 11, 0.2, Math.PI - 0.2);
    ctx.stroke();
    const tube = ctx.createLinearGradient(150, 410, 150, 430);
    tube.addColorStop(0, "#f3d18b");
    tube.addColorStop(0.45, "#a8753d");
    tube.addColorStop(1, "#70471f");
    this.drawRoundedRect(153, 414, 112, 15, 6, tube);
    ctx.fillStyle = "#70471f";
    ctx.fillRect(253, 412, 7, 19);
    ctx.fillStyle = "#ffe0a0";
    ctx.fillRect(159, 416, 88, 3);
  }

  drawDart() {
    if (!this.dart) return;
    const ctx = this.ctx;
    const dart = this.dart;
    const x = dart.startX + (dart.endX - dart.startX) * dart.progress;
    const y = dart.startY + (dart.endY - dart.startY) * dart.progress;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(dart.endY - dart.startY, dart.endX - dart.startX));
    ctx.fillStyle = "#5d5147";
    ctx.fillRect(-19, -2, 31, 4);
    ctx.fillStyle = "#d7dce0";
    ctx.beginPath();
    ctx.moveTo(12, -5);
    ctx.lineTo(23, 0);
    ctx.lineTo(12, 5);
    ctx.fill();
    ctx.restore();
  }

  drawInputScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = "#4e5572";
    ctx.font = "600 23px system-ui";
    ctx.fillText("Add the names, then let the carnival choose!", 550, 300);
    ctx.fillText(`Names added: ${this.names.length} / ${this.maxNames}`, 550, 355);
    ctx.font = "18px system-ui";
    this.names.slice(0, 12).forEach((name, index) => {
      const x = 300 + (index % 4) * 170;
      const y = 405 + Math.floor(index / 4) * 48;
      this.drawRoundedRect(x - 75, y - 18, 150, 35, 10, "#fffaf0");
      ctx.fillStyle = "#55445b";
      ctx.fillText(`${index + 1}. ${name}`, x, y + 6);
    });
    if (this.names.length > 12) {
      ctx.fillStyle = "#806b79";
      ctx.font = "16px system-ui";
      ctx.fillText(`and ${this.names.length - 12} more names...`, 550, 570);
    }
  }

  drawResultPanel() {
    const ctx = this.ctx;
    this.drawRoundedRect(270, 300, 560, 210, 25, "rgba(255,250,240,.95)");
    ctx.textAlign = "center";
    if (this.phase === "suspense") {
      const pulse = 1 + Math.sin(this.elapsed * 9) * 0.035;
      ctx.save();
      ctx.translate(550, 390);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#e84f76";
      ctx.font = "900 38px system-ui";
      ctx.fillText("WHO WILL IT BE?", 0, 0);
      ctx.restore();
      ctx.fillStyle = "#806b79";
      ctx.font = "20px system-ui";
      ctx.fillText("The carnival is choosing...", 550, 440);
    } else {
      const scale = Math.min(1, (this.elapsed - this.revealAt) * 2.5);
      ctx.fillStyle = "#62556b";
      ctx.font = "bold 25px system-ui";
      ctx.fillText("THE PICKED NAME IS", 550, 365);
      ctx.save();
      ctx.translate(550, 430);
      ctx.scale(0.5 + 0.5 * scale, 0.5 + 0.5 * scale);
      ctx.fillStyle = "#e84f76";
      ctx.font = "900 48px system-ui";
      ctx.fillText(this.winner, 0, 0);
      ctx.restore();
      ctx.fillStyle = "#62556b";
      ctx.font = "19px system-ui";
      ctx.fillText(`Remaining names: ${this.names.length}`, 550, 475);
    }
  }

  draw() {
    const ctx = this.ctx;
    this.drawBackground(this.elapsed);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "900 34px system-ui";
    ctx.shadowColor = "#853c60";
    ctx.shadowBlur = 3;
    ctx.fillText("BALLOON POP CARNIVAL", 550, 235);
    ctx.shadowBlur = 0;

    if (this.phase === "input") {
      this.drawInputScreen();
      return;
    }

    ctx.textAlign = "left";
    ctx.fillStyle = "#49304d";
    ctx.font = "bold 21px system-ui";
    ctx.fillText(`Names remaining: ${this.names.length}`, 28, 270);
    this.balloons.forEach((balloon) => {
      if (!balloon.popped) balloon.draw(ctx, this.elapsed);
    });
    this.drawKid();
    this.drawDart();
    this.particles.forEach((particle) => particle.draw(ctx));

    if (this.phase === "suspense" || this.phase === "reveal") this.drawResultPanel();
  }

  animate(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastFrame) / 1000 || 0, 0.05);
    this.lastFrame = timestamp;
    this.elapsed += deltaTime;
    this.update(deltaTime);
    this.draw();
    requestAnimationFrame((time) => this.animate(time));
  }
}
