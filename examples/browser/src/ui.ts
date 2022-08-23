import { Component, hStack, padding, rectangle, spacer, translation, vStack, zStack } from './components';
import { ControllerState, DeckState } from './state';

function faderView(
  value: number,
  options: {
    thumbWidth?: number;
    trackHeight?: number,
    inverted?: boolean,
  } = {}
): Component {
  const thumbSize = { x: options.thumbWidth ?? 40, y: 10 };
  const trackSize = { x: 5, y: options.trackHeight ?? 100 };
  return zStack([
    rectangle(trackSize, { fill: 'gray' }),
    translation(
      rectangle(thumbSize, { fill: 'black' }),
      { y: (options.inverted ? value : (1 - value)) * (trackSize.y - thumbSize.y) }
    ),
  ], {
    vAlignment: 'top',
  });
}

function deckView(deckState: DeckState): Component {
  return hStack([
    faderView(deckState.rate),
  ]);
}

function eqView(deckState: DeckState): Component {
  // TODO
  return spacer();
}

function mixerView(deckState: DeckState): Component {
  return vStack([
    eqView(deckState),
    faderView(deckState.volume),
  ]);
}

export function controllerView(state: ControllerState): Component {
  return hStack([
    padding(vStack([
      ...[0, 2].map(i => padding(deckView(state.decks[i]))),
    ])),
    ...[2, 0, 1, 3].map(i => padding(mixerView(state.decks[i]))),
    padding(vStack([
      ...[1, 3].map(i => padding(deckView(state.decks[i]))),
    ])),
  ]);
}
