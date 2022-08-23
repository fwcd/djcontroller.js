import { Action } from '../action';
import { MidiMessage } from '../midi';
import { Output } from '../output';

/** Metadata about a controller mapping. */
export interface MappingInfo {
  name?: string;
  author?: string;
  description?: string;
}

/**
 * Represents a DJ controller mapping.
 * Usually a long-lived object since many controller scripts
 * maintain internal state.
 */
export interface ControllerMapping {
  /** Metadata about the mapping. */
  info: MappingInfo;

  /**
   * Determines the actions to take based on the
   * given MIDI message. Note that this method is
   * _not_ pure and may update internal state.
   * 
   * @param msg The received MIDI message
   */
  handleIncoming(msg: MidiMessage): Action[];

  /**
   * Converts the given output action to MIDI
   * messages. Note that this method is
   * _not_ pure and may update internal state.
   * 
   * @param output The output action to be sent
   */
  prepareOutgoing(output: Output): MidiMessage[];
}
