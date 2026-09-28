import { asset } from './asset';

// The arrival dishes are real menu photographs, cut out, with a depth map each.
// A WebGL shader shifts every pixel by its own depth as the dish tilts, which
// gives the plate real volume without any 3D model. The static cut-out image
// stays underneath: it is what shows before the textures load, without WebGL,
// and whenever motion is paused.
export interface Dish3D { id: string; image: string; depth: string; alt: string }

const VERTEX = `
attribute vec2 a_pos;
uniform vec2 u_scale;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * .5 + .5, .5 - a_pos.y * .5);
  // Sit the dish on the bottom of the stage, where its shadow is.
  gl_Position = vec4(a_pos * u_scale - vec2(0., 1. - u_scale.y), 0., 1.);
}`;
const FRAGMENT = `
precision mediump float;
uniform sampler2D u_color;
uniform sampler2D u_depth;
uniform vec2 u_tilt;
uniform vec2 u_texel;
varying vec2 v_uv;
void main() {
  vec2 offset = u_tilt * .045;
  vec2 p = v_uv;
  // A few fixed-point steps find which pixel lands here once depth is applied.
  for (int i = 0; i < 6; i++) p = v_uv + offset * (texture2D(u_depth, p).r - .5);
  vec4 color = texture2D(u_color, p);
  vec2 step = u_texel * 3.;
  float dx = texture2D(u_depth, p + vec2(step.x, 0.)).r - texture2D(u_depth, p - vec2(step.x, 0.)).r;
  float dy = texture2D(u_depth, p + vec2(0., step.y)).r - texture2D(u_depth, p - vec2(0., step.y)).r;
  // Light follows the tilt: faces turned towards it brighten a little.
  float light = clamp(1. + (dx * -u_tilt.x + dy * -u_tilt.y) * 5. + .04, .86, 1.16);
  gl_FragColor = vec4(color.rgb * light, color.a);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}
const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

export function initDish3D(stage: HTMLElement, dishes: Dish3D[]) {
  const canvas = stage.querySelector('canvas')!;
  const still = stage.querySelector('img')!;
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
  const textures = new Map<string, Promise<{ color: WebGLTexture; depth: WebGLTexture; width: number; height: number }>>();
  let current = 0;
  let ready = false;
  let paused = false;
  let inView = false;
  let frame = 0;
  let size = { width: 1, height: 1 };
  const tilt = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let pointerUntil = 0;
  let program: WebGLProgram | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};

  function upload(image: HTMLImageElement) {
    const texture = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    gl!.pixelStorei(gl!.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, image);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    return texture;
  }
  function load(index: number) {
    const dish = dishes[index];
    if (!textures.has(dish.id)) {
      textures.set(dish.id, Promise.all([loadImage(asset(dish.image)), loadImage(asset(dish.depth))])
        .then(([color, depth]) => ({ color: upload(color), depth: upload(depth), width: color.naturalWidth, height: color.naturalHeight })));
    }
    return textures.get(dish.id)!;
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    // Layout size, not getBoundingClientRect: the canvas is tilted by a CSS transform.
    size = { width: Math.max(1, Math.round(canvas.clientWidth * ratio)), height: Math.max(1, Math.round(canvas.clientHeight * ratio)) };
    canvas.width = size.width; canvas.height = size.height;
  }
  async function draw() {
    if (!gl || !program) return;
    const texture = await load(current);
    gl.viewport(0, 0, size.width, size.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Contain the dish in the canvas, keeping its proportions.
    const scale = Math.min(size.width / texture.width, size.height / texture.height);
    gl.uniform2f(uniforms.u_scale, texture.width * scale / size.width, texture.height * scale / size.height);
    gl.uniform2f(uniforms.u_tilt, tilt.x, tilt.y);
    gl.uniform2f(uniforms.u_texel, 1 / texture.width, 1 / texture.height);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture.color);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texture.depth);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function tick(time: number) {
    frame = 0;
    if (performance.now() > pointerUntil) {
      // With no pointer around, the dish turns slowly on its own.
      target.x = Math.sin(time / 1700) * .75;
      target.y = Math.cos(time / 2300) * .4;
    }
    tilt.x += (target.x - tilt.x) * .06;
    tilt.y += (target.y - tilt.y) * .06;
    stage.style.setProperty('--tilt-x', tilt.x.toFixed(3));
    stage.style.setProperty('--tilt-y', tilt.y.toFixed(3));
    draw();
    schedule();
  }
  function schedule() {
    if (!frame && ready && !paused && inView && !document.hidden) frame = requestAnimationFrame(tick);
  }

  if (gl) {
    program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) program = null;
  }
  if (gl && program) {
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    for (const name of ['u_scale', 'u_tilt', 'u_texel', 'u_color', 'u_depth']) uniforms[name] = gl.getUniformLocation(program, name);
    gl.uniform1i(uniforms.u_color, 0);
    gl.uniform1i(uniforms.u_depth, 1);
    resize();
    new ResizeObserver(() => { resize(); draw(); }).observe(canvas);
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); }, { threshold: .05 }).observe(stage);
    document.addEventListener('visibilitychange', schedule);
    load(0).then(() => {
      ready = true;
      stage.classList.add('is-3d');
      draw(); schedule();
      // The other two dishes load once the first one is on screen.
      dishes.forEach((_, index) => { if (index) load(index); });
    }).catch(() => { /* The still cut-out stays in place. */ });

    // Mouse: the whole arrival section steers the dish. Touch: dragging on it.
    const steer = (event: PointerEvent, area: Element) => {
      const bounds = area.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - .5) * 2));
      target.y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - .5) * 2));
      pointerUntil = performance.now() + 2200;
    };
    const section = stage.closest('section') || stage;
    section.addEventListener('pointermove', event => { if (event.pointerType === 'mouse' && !paused) steer(event, section); });
    stage.addEventListener('pointermove', event => { if (event.pointerType !== 'mouse' && !paused) steer(event, stage); });
  }

  return {
    show(index: number) {
      current = index;
      const dish = dishes[index];
      still.src = asset(dish.image);
      still.alt = dish.alt;
      return load(index).then(draw).catch(() => undefined);
    },
    setPaused(value: boolean) {
      paused = value;
      stage.classList.toggle('is-still', value);
      if (value) { cancelAnimationFrame(frame); frame = 0; tilt.x = tilt.y = 0; stage.style.setProperty('--tilt-x', '0'); stage.style.setProperty('--tilt-y', '0'); draw(); }
      else schedule();
    },
  };
}
