/**
 * The sky itself: a layered gradient with a warm glow sitting behind wherever
 * the hero of the screen stands. No motion — this is the stillest layer in the
 * game, and everything else reads as moving because this does not.
 */
export function Blobs() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-sky/45 via-cream to-cream" />
      <div className="absolute top-[14%] start-1/2 -translate-x-1/2 w-[130%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(255,244,214,0.85)_0%,rgba(255,244,214,0)_60%)]" />
    </>
  )
}
