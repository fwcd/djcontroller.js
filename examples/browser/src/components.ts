export type Vec2 = { x: number; y: number; }
export type Component = (ctx: CanvasRenderingContext2D | undefined, start: Vec2) => Vec2;

function add(lhs: Vec2, rhs: Vec2): Vec2 {
  return { x: lhs.x + rhs.x, y: lhs.y + rhs.y };
}

export function hStack(
  components: Component[],
  options: {
    alignment?: 'top' | 'center' | 'bottom',
  } = {}
): Component {
  const alignment = options.alignment ?? 'center';
  const sizes = components.map(c => c(null, { x: 0, y: 0 }));
  const totalHeight = sizes.reduce((acc, size) => Math.max(acc, size.y), 0);
  return (ctx, start) => {
    let pos = start;
    let totalSize = { x: 0, y: 0 };
    components.forEach((component, i) => {
      let size = sizes[i];
      let offset: number;
      switch (alignment) {
      case 'top':    offset = 0;                            break;
      case 'center': offset = totalHeight / 2 - size.y / 2; break;
      case 'bottom': offset = totalHeight - size.y;         break;
      default:                                              break;
      }
      component(ctx, add(pos, { x: 0, y: offset }));
      pos = add(pos, { x: size.x, y: 0 });
      totalSize = {
        x: totalSize.x + size.x,
        y: Math.max(totalSize.y, size.y),
      };
    });
    return totalSize;
  };
}

export function vStack(
  components: Component[],
  options: {
    alignment?: 'leading' | 'center' | 'trailing',
  } = {}
): Component {
  const alignment = options.alignment ?? 'center';
  const sizes = components.map(c => c(null, { x: 0, y: 0 }));
  const totalWidth = sizes.reduce((acc, size) => Math.max(acc, size.x), 0);
  return (ctx, start) => {
    let pos = start;
    let totalSize = { x: 0, y: 0 };
    components.forEach((component, i) => {
      let size = sizes[i];
      let offset: number;
      switch (alignment) {
      case 'leading':  offset = 0;                           break;
      case 'center':   offset = totalWidth / 2 - size.x / 2; break;
      case 'trailing': offset = totalWidth - size.x;         break;
      default:                                               break;
      }
      component(ctx, add(pos, { x: offset, y: 0 }));
      pos = add(pos, { x: 0, y: size.y });
      totalSize = {
        x: Math.max(totalSize.x, size.x),
        y: totalSize.y + size.y,
      };
    });
    return totalSize;
  };
}

export function rectangle(
  size: Vec2,
  options: {
    fill?: string | CanvasGradient | CanvasPattern
  } = {}
): Component {
  return (ctx, start) => {
    if (ctx) {
      if (options.fill) {
        ctx.fillStyle = options.fill;
      }
      ctx.fillRect(start.x, start.y, size.x, size.y);
    }
    return size;
  };
}

export function spacer(size: Vec2): Component {
  return () => {
    return size;
  };
}

export function padding(
  component: Component,
  options: {
    size?: number,
    horizontal?: boolean,
    vertical?: boolean,
  } = {}
): Component {
  const size = options.size ?? 10;
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
