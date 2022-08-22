export interface BaseAction {
  type: string;
  deck?: number;
}

/** A value control type. */
export type ValueControl = { type: 'crossfader' }
                         | { type: 'volume' }
                         | { type: 'gain' }
                         | { type: 'lows' }
                         | { type: 'mids' }
                         | { type: 'highs' }
                         | { type: 'headphoneMix' }
                         | { type: 'sampler' }
                         | { type: 'rate' };

/** An action controlling a fader, encoder or similar. */
export interface ValueAction extends BaseAction {
  type: 'value';
  control: ValueControl;
  value: number;
}

/** A control that can either be on or off. */
export type PressControl = { type: 'play' }
                         | { type: 'cue' }
                         | { type: 'stopAtStart' }
                         | { type: 'slip' }
                         | { type: 'sync' }
                         | { type: 'headphoneCue' }
                         | { type: 'hotcue', index: number }
                         | { type: 'roll', beats: number }
                         | { type: 'jump', beats: number }
                         | { type: 'loopToggle', beats?: number }
                         | { type: 'loopResize', factor: number };

/** An action controlling an on/off value. */
export interface PressAction extends BaseAction {
  type: 'press';
  control: PressControl;
  down: boolean;
}

/** An action to take by the DJ application. */
export type Action = ValueAction
                   | PressAction;

