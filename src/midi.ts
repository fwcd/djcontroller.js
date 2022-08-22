/** A MIDI controller message. */
export interface MidiMessage {
  /** The status byte. */
  status: number;
  /** Additionally data bytes, usually one or two. */
  data: number[];
}
