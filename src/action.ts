export interface BaseAction {
  type: string;
  deck?: number;
}

/** A value control type. */
export type ValueControl = 'crossfader'
                         | 'volume'
                         | 'lows'
                         | 'mids'
                         | 'highs'
                         | 'headphoneMix'
                         | 'sampler';

/** An action controlling a fader, encoder or similar. */
export interface SetValueAction extends BaseAction {
  type: 'setValue';
  control: ValueControl;
  value: number;
}

/** An action to take by the DJ application. */
export type Action = SetValueAction;

