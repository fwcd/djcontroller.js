import { circle, Component, hStack, padding, rectangle, spacer, translation, transpose, Vec2, vStack, zStack } from './components';
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
  options: {} = {}
): Component {
  return circle(20, { fill: 'blue' });
}

function deckView(deckState: DeckState): Component {
  return hStack([
    faderView(deckState.rate, { inverted: true }),
  ]);
}

function eqView(deckState: DeckState): Component {
  return vStack([
    encoderView(deckState.highs),
    encoderView(deckState.mids),
    encoderView(deckState.lows),
  ]);
}

function mixerView(deckState: DeckState): Component {
  return vStack([
    encoderView(deckState.gain),
    eqView(deckState),
    faderView(deckState.volume, { inverted: true }),
  ]);
}

export function controllerView(state: ControllerState): Component {
  return hStack([
    padding(vStack([
      ...[0, 2].map(i => padding(deckView(state.decks[i]))),
    ])),
    vStack([
      hStack([
        ...[2, 0, 1, 3].map(i => padding(mixerView(state.decks[i]))),
      ]),
      faderView(state.crossfader, { horizontal: true }),
    ]),
    padding(vStack([
      ...[1, 3].map(i => padding(deckView(state.decks[i]))),
    ])),
  ]);
}
