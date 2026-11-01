export class Particle {
  constructor(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 90 + Math.random() * 130;
    Object.assign(this, {
      x, y, color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      radius: 3 + Math.random() * 4
    });
  }

  update(deltaTime) {
    this.life -= deltaTime * 1.3;
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vy += 180 * deltaTime;
  }

  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
