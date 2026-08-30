import ar from '../src/content/strings/ar.json'
import en from '../src/content/strings/en.json'

test('Arabic scratch tool cards use the requested child-friendly names', () => {
  expect(ar['tool.mirror.name']).toBe('المراية')
  expect(ar['tool.explorer.name']).toBe('عداد الاسنان')
  expect(ar['tool.spray.name']).toBe('العصير السحري')
  expect(ar['tool.brush.name']).toBe('الدش الصغنون')
})

test('Arabic visit copy refers to the child dentist without naming the dentist', () => {
  const visitCopy = Object.entries(ar)
    .filter(([id]) => id.startsWith('visit.'))
    .map(([, value]) => value)
    .join('\n')

  expect(visitCopy).not.toContain(`لي${'لي'}`)
  expect(ar['visit.meetDr']).toContain('دكتورتك')
})

test('English visit copy says your dentist without naming the dentist', () => {
  const visitCopy = Object.entries(en)
    .filter(([id]) => id.startsWith('visit.'))
    .map(([, value]) => value)
    .join('\n')

  expect(visitCopy).not.toContain(['Dr.', 'Li' + 'li'].join(' '))
  expect(visitCopy).not.toContain(`Li${'li'}`)
  expect(en['visit.meetDr']).toContain("Let's meet your dentist")
})
