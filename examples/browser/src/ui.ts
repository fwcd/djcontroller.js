import { circle, Component, hStack, line, padding, rectangle, rotation, spacer, translation, transpose, Vec2, vStack, zStack } from './components';
import { ControllerState, DeckState } from './state';

function faderView(
  value: number,
  options: {
    thumbWidth?: number;
    trackLength?: number,
    inverted?: boolean,
    horizontal?: boolean,
  } = {}
): Component {
  const directional = (v: Vec2) => options.horizontal ? transpose(v) : v;
  const thumbWidth = options.thumbWidth ?? 40;
  const thumbThickness = 10;
  const trackLength = options.trackLength ?? 100;
  const thumbSize = directional({ x: thumbWidth, y: thumbThickness });
  const trackSize = directional({ x: 5, y: trackLength });
  return zStack([
    rectangle(trackSize, { fill: 'gray' }),
    translation(
      rectangle(thumbSize, { fill: 'black' }),
      directional({ x: 0, y: (options.inverted ? (1 - value) : value) * (trackLength - thumbThickness) })
    ),
  ], {
    vAlignment: options.horizontal ? 'center' : 'top',
    hAlignment: options.horizontal ? 'leading' : 'center',
  });
}

function encoderView(
  value: number,
  options: {
    radius?: number;
    fill?: string;
    stroke?: string;
  } = {}
): Component {
  const radius = options.radius ?? 20;
  const fill = options.fill ?? 'black';
  const stroke = options.stroke ?? 'white';
  return rotation(
    zStack([
      circle(radius, { fill }),
      line({ x: 0, y: 0 }, { x: 0, y: radius }, {
        stroke,
        lineWidth: 3,
        lineCap: 'round',
      }),
    ], {
      vAlignment: 'top'
    }),
    1.5 * Math.PI * (value - 0.5)
  );
}

function deckView(deckState: DeckState): Component {
  return hStack([
    faderView(deckState.rate, { inverted: true }),
  ]);
}

function eqView(deckState: DeckState): Component {
  return vStack([
    encoderView(deckState.highs, { stroke: '#9670ff' }),
    encoderView(deckState.mids, { stroke: '#1aff00' }),
    encoderView(deckState.lows, { stroke: '#eb0000' }),
  ].map(c => padding(c, { size: 2, horizontal: false })));
}

function mixerView(deckState: DeckState): Component {
  return vStack([
    encoderView(deckState.gain),
    eqView(deckState),
    faderView(deckState.volume, { inverted: true }),
  ].map(c => padding(c, { size: 10, horizontal: false })));
}

export function controllerView(state: ControllerState): Component {
  return hStack([
    vStack([
      ...[0, 2].map(i => padding(deckView(state.decks[i]))),
    ]),
    vStack([
      hStack([
        ...[2, 0, 1, 3].map(i => padding(mixerView(state.decks[i]))),
      ]),
      faderView(state.crossfader, { horizontal: true }),
    ]),
    vStack([
      ...[1, 3].map(i => padding(deckView(state.decks[i]))),
    ]),
  ].map(c => padding(c, { size: 20, vertical: false })));
}
