import type { MiloState } from './Milo'

/**
 * How a screen gets a reaction out of Milo.
 *
 * Milo rides in the HUD, which is a sibling of whatever module is playing, so
 * a screen cannot reach him through props. Rather than lift him into the store
 * — his pose is transient and has nothing to do with saved progress — this is
 * the same subscription shape the audio controller already uses for lip-sync:
 * a screen publishes what just happened, the HUD forwards it to the live rig
 * through `MiloHandle`, and nothing in between has to know either side exists.
 *
 * Publishing with no HUD mounted is a no-op, which is what makes a module
 * renderable on its own in a unit test.
 */
class MiloBus {
  private subs = new Set<(state: MiloState) => void>()

  /** Subscribe a live rig. Returns the unsubscribe, for use as an effect cleanup. */
  onReact(cb: (state: MiloState) => void) {
    this.subs.add(cb)
    return () => {
      this.subs.delete(cb)
    }
  }

  /** Ask Milo to play a state. Transient ones fall back to idle on their own. */
  react(state: MiloState) {
    this.subs.forEach(cb => cb(state))
  }

  _resetForTests() {
    this.subs.clear()
  }
}

export const milo = new MiloBus()
