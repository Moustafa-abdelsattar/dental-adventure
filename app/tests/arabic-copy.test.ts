import ar from '../src/content/strings/ar.json'

test('Arabic scratch tool cards use the requested child-friendly names', () => {
  expect(ar['tool.mirror.name']).toBe('المراية')
  expect(ar['tool.explorer.name']).toBe('عداد الاسنان')
  expect(ar['tool.spray.name']).toBe('العصير السحري')
  expect(ar['tool.brush.name']).toBe('الدش الصغنون')
})

test('Arabic visit copy refers to the child dentist, not Dr. Lili', () => {
  const visitCopy = Object.entries(ar)
    .filter(([id]) => id.startsWith('visit.'))
    .map(([, value]) => value)
    .join('\n')

  expect(visitCopy).not.toContain('ليلي')
  expect(ar['visit.meetDr']).toContain('دكتورتك')
})
