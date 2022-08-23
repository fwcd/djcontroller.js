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
      { y: options.inverted ? value * trackSize.y : (1 - value) * trackSize.y }
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
      deckView(state.decks[0]),
      deckView(state.decks[1]),
    ])),
    ...state.decks.map(d => padding(mixerView(d))),
    padding(vStack([
      deckView(state.decks[1]),
      deckView(state.decks[2]),
    ])),
  ]);
}
