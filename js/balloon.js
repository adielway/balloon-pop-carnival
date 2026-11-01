export class Balloon {
  constructor(name, x, y, color, phase, radius) {
    Object.assign(this, { name, x, y, color, phase, radius, popped: false });
  }

  draw(ctx, time) {
    const bob = Math.sin(time * 1.5 + this.phase) * 11;
    const sway = Math.sin(time * 0.8 + this.phase) * 7;
    const x = this.x + sway;
    const y = this.y + bob;
    const scale = this.radius / 43;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.82 * scale, 1.08 * scale);
    ctx.shadowColor = "#48627a55";
    ctx.shadowBlur = 13 * scale;
    ctx.shadowOffsetX = 7 * scale;
    ctx.shadowOffsetY = 9 * scale;

    const gradient = ctx.createRadialGradient(-18, -24, 3, 8, 5, 53);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.16, this.color);
    gradient.addColorStop(0.78, this.color);
    gradient.addColorStop(1, "#58445d");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 43, 43, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.beginPath();
    ctx.ellipse(-18, -22, 6, 15, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.beginPath();
    ctx.arc(-23, -31, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(x - 6 * scale, y + 45 * scale);
    ctx.lineTo(x + 6 * scale, y + 45 * scale);
    ctx.lineTo(x, y + 56 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#788b9a";
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.beginPath();
    ctx.moveTo(x, y + 55 * scale);
    ctx.bezierCurveTo(x + 12 * scale, y + 70 * scale, x - 10 * scale, y + 80 * scale, x - 2 * scale, y + 96 * scale);
    ctx.stroke();
  }
}
