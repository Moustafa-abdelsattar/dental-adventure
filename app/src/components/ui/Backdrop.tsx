import { Blobs } from '../../backgrounds/Blobs'
import { Clouds } from '../../backgrounds/Clouds'
import { Sparkles } from '../../backgrounds/Sparkles'
import { Waves } from '../../backgrounds/Waves'

/**
 * The sky behind every screen, composed from the background layers in
 * `src/backgrounds/`: gradient and glow, parallax clouds, slow gold glints,
 * and the two-tone water along the bottom.
 *
 * Fixed rather than absolute so it stays put while screens hand over — and
 * because `.app-column` establishes a containing block, "fixed" here means
 * fixed to the phone panel, not to the desktop window.
 */
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <Blobs />
      <Clouds />
      <Sparkles />
      <Waves />
    </div>
  )
}
