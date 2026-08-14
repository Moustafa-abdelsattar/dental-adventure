import { springs } from '../src/motion/springs'

test('motion tokens match the approach doc verbatim', () => {
  expect(springs.soft).toEqual({ type: 'spring', stiffness: 180, damping: 20 })
  expect(springs.playful).toEqual({ type: 'spring', stiffness: 350, damping: 16 })
  expect(springs.snappy).toEqual({ type: 'spring', stiffness: 500, damping: 28 })
})
