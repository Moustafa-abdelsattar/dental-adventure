import { simulateTeeter } from '../src/three/ClinicScene/Chair'

// The PPTX drives the chair with five keyframes 200ms apart at ±2°; the motion
// spec keeps that rhythm but amplifies to ±7° and asks for a spring rather than
// keyframes. These assert the spring actually lands on the client's intent.

const trace = simulateTeeter(2)
const peaks = () => {
  const out: { t: number; deg: number }[] = []
  for (let i = 1; i < trace.length - 1; i++) {
    const { deg: a } = trace[i - 1]
    const { deg: b } = trace[i]
    const { deg: c } = trace[i + 1]
    if (((b > a && b >= c) || (b < a && b <= c)) && Math.abs(b) > 0.2) out.push(trace[i])
  }
  return out
}

test('the first swing reaches the ±7° the spec asks for', () => {
  const peak = Math.max(...trace.map(p => Math.abs(p.deg)))
  // damping bleeds off a fifth of the first swing, so the impulse is solved for
  // rather than guessed — a naive peak×omega lands near 5.2°
  expect(peak).toBeGreaterThan(6.8)
  expect(peak).toBeLessThan(7.2)
})

test('it teeters — alternating swings, each smaller than the last', () => {
  const p = peaks()
  expect(p.length).toBeGreaterThanOrEqual(5)
  for (let i = 1; i < p.length; i++) {
    // alternating sides
    expect(Math.sign(p[i].deg)).toBe(-Math.sign(p[i - 1].deg))
    // and decaying, so it settles instead of ringing forever
    expect(Math.abs(p[i].deg)).toBeLessThan(Math.abs(p[i - 1].deg))
  }
})

test("the beats land on the PPTX's ~200ms cadence", () => {
  const p = peaks()
  for (let i = 1; i < Math.min(p.length, 5); i++) {
    const gap = (p[i].t - p[i - 1].t) * 1000
    expect(gap).toBeGreaterThan(140)
    expect(gap).toBeLessThan(220)
  }
})

test('it comes to rest rather than drifting', () => {
  const tail = trace.filter(p => p.t > 1.5)
  expect(Math.max(...tail.map(p => Math.abs(p.deg)))).toBeLessThan(0.1)
})
