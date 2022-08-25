import { Cached } from "./cached";

/** A 2D vector. */
export type Vec2 = { x: number; y: number; }

/** A partial 2D vector. */
export type PartialVec2 = Partial<Vec2>; 

/** An alignment along the x-axis. */
export type HorizontalAlignment = 'leading' | 'center' | 'trailing';

/** An alignment along the y-axis. */
export type VerticalAlignment = 'top' | 'center' | 'bottom';

/** A component that can be rendered to a canvas. */
export type Component = (ctx: CanvasRenderingContext2D, doRender: boolean) => Vec2;

/** Adds two 2D vectors. */
export function add(lhs: PartialVec2, rhs: PartialVec2): Vec2 {
  return { x: (lhs.x ?? 0) + (rhs.x ?? 0), y: (lhs.y ?? 0) + (rhs.y ?? 0) };
}

/** Subtracts two 2D vectors. */
export function sub(lhs: PartialVec2, rhs: PartialVec2): Vec2 {
  return add(lhs, scale(rhs, -1));
}

/** Scales a 2D vector. */
export function scale({ x = 0, y = 0 }: PartialVec2, rhs: number): Vec2 {
  return { x: x * rhs, y: y * rhs };
}

/** Swaps the components of a 2D vector. */
export function transpose(vec: Vec2): Vec2 {
  return { y: vec.x, x: vec.y };
}

/** Computes the aligned offset within the given bounds. */
function align(alignment: HorizontalAlignment | VerticalAlignment, totalSize: number, size: number): number {
  switch (alignment) {
  case 'top':
  case 'leading':
    return 0;
  case 'center':
    return totalSize / 2 - size / 2;
  case 'bottom':
  case 'trailing':
    return totalSize - size;
  default:
    throw new Error(`Invalid alignment: ${alignment}`);
  }
}

/** Renders the given component to the given canvas. */
export function render(
  component: Component,
  canvas: HTMLCanvasElement,
  options: {
    resizeToFit?: boolean,
  } = {}
) {
  const ctx = canvas.getContext('2d');
  const size = componentSize(ctx, component);

  if (options.resizeToFit) {
    if (size.x !== canvas.width) {
      canvas.width = size.x;
    }
    if (size.y !== canvas.height) {
      canvas.height = size.y;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  component(ctx, true);
}

/** Compoutes the size of the given component. */
function componentSize(ctx: CanvasRenderingContext2D, component: Component): Vec2 {
  return component(ctx, false);
}

/** Composes components horizontally. */
export function hStack(
  components: Component[],
  options: {
    alignment?: VerticalAlignment,
  } = {}
): Component {
  const alignment = options.alignment ?? 'center';
  const sizesCache = new Cached<Vec2[]>();
  return (ctx, doRender) => {
    const sizes = sizesCache.get(() => components.map(c => componentSize(ctx, c)));
    const totalHeight = sizes.reduce((acc, size) => Math.max(acc, size.y), 0);
    let pos = { x: 0, y: 0 };
    let totalSize = { x: 0, y: 0 };
    components.forEach((component, i) => {
      const size = sizes[i];
      const offset = align(alignment, totalHeight, size.y);
      translation(component, add(pos, { y: offset }))(ctx, doRender);
      pos = add(pos, { x: size.x });
      totalSize = {
        x: totalSize.x + size.x,
        y: Math.max(totalSize.y, size.y),
      };
    });
    return totalSize;
  };
}

/** Composes components vertically. */
export function vStack(
  components: Component[],
  options: {
    alignment?: HorizontalAlignment,
  } = {}
): Component {
  const alignment = options.alignment ?? 'center';
  const sizesCache = new Cached<Vec2[]>();
  return (ctx, doRender) => {
    const sizes = sizesCache.get(() => components.map(c => componentSize(ctx, c)));
    const totalWidth = sizes.reduce((acc, size) => Math.max(acc, size.x), 0);
    let pos = { x: 0, y: 0 };
    let totalSize = { x: 0, y: 0 };
    components.forEach((component, i) => {
      const size = sizes[i];
      const offset = align(alignment, totalWidth, size.x);
      translation(component, add(pos, { x: offset }))(ctx, doRender);
      pos = add(pos, { y: size.y });
      totalSize = {
        x: Math.max(totalSize.x, size.x),
        y: totalSize.y + size.y,
      };
    });
    return totalSize;
  };
}

/** Composes components above each other. */
export function zStack(
  components: Component[],
  options: {
    hAlignment?: HorizontalAlignment,
    vAlignment?: VerticalAlignment,
  } = {}
): Component {
  const hAlignment = options.hAlignment ?? 'center';
  const vAlignment = options.vAlignment ?? 'center';
  const sizesCache = new Cached<Vec2[]>();
  return (ctx, doRender) => {
    const sizes = sizesCache.get(() => components.map(c => componentSize(ctx, c)));
    const totalSize = sizes.reduce((acc, size) => ({ x: Math.max(acc.x, size.x), y: Math.max(acc.y, size.y) }), { x: 0, y: 0 });
    components.forEach((component, i) => {
      const size = sizes[i];
      const offset = {
        x: align(hAlignment, totalSize.x, size.x),
        y: align(vAlignment, totalSize.y, size.y),
      };
      translation(component, offset)(ctx, doRender);
    });
    return totalSize;
  };
}

/** Creates a primitive rectangle component with a fixed size. */
export function rectangle(
  size: Vec2,
  options: {
    fill?: string | CanvasGradient | CanvasPattern
  } = {}
): Component {
  return (ctx, doRender) => {
    if (doRender) {
      if (options.fill) {
        ctx.fillStyle = options.fill;
      }
      ctx.fillRect(0, 0, size.x, size.y);
    }
    return size;
  };
}

/** Creates a primitive ellipse component with a fixed radius. */
export function ellipse(
  radius: Vec2,
  options: {
    fill?: string | CanvasGradient | CanvasPattern
  } = {}
): Component {
  return (ctx, doRender) => {
    if (doRender) {
      if (options.fill) {
        ctx.fillStyle = options.fill;
      }
      ctx.beginPath();
      ctx.ellipse(radius.x, radius.y, radius.x, radius.y, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    return scale(radius, 2);
  };
}

/** Creates a primitive circle component with a fixed radius. */
export function circle(
  radius: number,
  options: {
    fill?: string | CanvasGradient | CanvasPattern
  } = {}
): Component {
  return ellipse({ x: radius, y: radius }, options);
}

/** Creates a primitive line component. */
export function line(
  start: Vec2,
  end: Vec2,
  options: {
    stroke?: string | CanvasGradient | CanvasPattern,
    lineWidth?: number,
    lineCap?: CanvasLineCap,
  } = {}
): Component {
  const min = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) };
  const max = { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) };
  const size = sub(max, min);
  return (ctx, doRender) => {
    if (doRender) {
      if (options.stroke) {
        ctx.strokeStyle = options.stroke;
      }
      if (options.lineWidth !== undefined) {
        ctx.lineWidth = options.lineWidth;
      }
      if (options.lineCap) {
        ctx.lineCap = options.lineCap;
      }
      ctx.beginPath();
      ctx.moveTo(min.x, min.y);
      ctx.lineTo(max.x, max.y);
      ctx.stroke();
    }
    return size;
  };
}

/** Creates a primitive empty component with a fixed size. */
export function spacer(size: Vec2 = { x: 0, y: 0 }): Component {
  return () => {
    return size;
  };
}

/** Creates a primitive text component. */
export function text(
  text: string,
  options: {
    font?: string,
    color?: string,
  } = {}
): Component {
  const font = options.font ?? '12px sans-serif';
  const color = options.color ?? 'black';
  return (ctx, doRender) => {
    ctx.font = font;
    ctx.fillStyle = color;
    const metrics = ctx.measureText(text);
    if (doRender) {
      ctx.fillText(text, 0, metrics.actualBoundingBoxAscent);
    }
    return { x: metrics.width, y: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent };
  };
}

/** Wraps the given component in padding. */
export function padding(
  component: Component,
  options: {
    size?: number,
    horizontal?: boolean,
    vertical?: boolean,
  } = {}
): Component {
  const size = options.size ?? 5;
  let wrapped = component;

  if (options.horizontal ?? true) {
    const hSpace = { x: size, y: 0 };
    wrapped = hStack([
      spacer(hSpace),
      wrapped,
      spacer(hSpace),
    ]);
  }

  if (options.vertical ?? true) {
    const vSpace = { x: 0, y: size };
    wrapped = vStack([
      spacer(vSpace),
      wrapped,
      spacer(vSpace),
    ]);
  }

  return wrapped;
}

/** Wraps the component in an offset. */
export function translation(
  component: Component,
  offset: Vec2
): Component {
  return (ctx, doRender) => {
    const size = componentSize(ctx, component);
    if (doRender) {
      ctx.translate(offset.x, offset.y);
      component(ctx, doRender);
      ctx.translate(-offset.x, -offset.y);
    }
    return add(size, offset);
  };
}

/** Rotates the component by a certain angle (in radians), optionally with a custom anchor (offset from the center). */
export function rotation(
  component: Component,
  angle: number,
  options: {
    anchorOffset?: Vec2,
  } = {}
): Component {
  return (ctx, doRender) => {
    const size = componentSize(ctx, component);
    if (doRender) {
      const center = add(scale(size, 0.5), options.anchorOffset ?? {});
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(angle);
      ctx.translate(-center.x, -center.y);
      component(ctx, doRender);
      ctx.restore();
    }
    return size;
  };
}
