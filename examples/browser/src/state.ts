export interface DeckState {
  lows: number;
  mids: number;
  highs: number;
  volume: number;
  rate: number;
}

export interface ControllerState {
  crossfader: number;
  decks: DeckState[];
}
