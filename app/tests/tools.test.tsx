import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { TOOLS, type ToolId } from '../src/game/tools/tools'
import { ToolsScreen } from '../src/screens/ToolsScreen'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'
import checkup from '../src/content/paths/checkup.json'
import treatment from '../src/content/paths/treatment.json'
import type { ModuleDef } from '../src/content/types'

const ALL_IDS: ToolId[] = ['mirror', 'explorer', 'suction', 'syringe', 'brush', 'xray', 'ring', 'umbrella', 'spray']

beforeEach(() => {
  cleanup()
  localStorage.clear()
  useGame.getState().reset()
  useGame.getState().setLang('en')
  vi.spyOn(audio, 'say').mockResolvedValue()
})
afterEach(() => vi.restoreAllMocks())

test('every tool id has an entry and renders its art asset', () => {
  for (const id of ALL_IDS) {
    const { Svg } = TOOLS[id]
    const { container, unmount } = render(<Svg />)
    const img = container.querySelector('img')
    expect(img, `tool ${id} must render its art image`).toBeTruthy()
    expect(img!.getAttribute('src')).toBe(`/art/tool-${id}.webp`)
    unmount()
  }
})

async function meetAll(roster: ToolId[]) {
  for (const id of roster) {
    await act(async () => {
      fireEvent.click(screen.getByTestId(`tool-${id}`))
    })
  }
}

test('checkup roster shows 6 tools in 2 groups and completes after meeting all', async () => {
  const module = checkup.modules.find(m => m.kind === 'tools')! as ModuleDef
  const onComplete = vi.fn()
  render(<ToolsScreen module={module} onComplete={onComplete} />)
  expect(screen.getByTestId('tool-group-0').querySelectorAll('button')).toHaveLength(3)
  await meetAll(module.toolIds! as ToolId[])
  expect(onComplete).toHaveBeenCalledTimes(1)
  expect(audio.say).toHaveBeenCalledWith('en', 'tools.done')
})

test('treatment roster spans 3 groups including care tools', async () => {
  const module = treatment.modules.find(m => m.kind === 'tools')! as ModuleDef
  const onComplete = vi.fn()
  render(<ToolsScreen module={module} onComplete={onComplete} />)
  expect(screen.getByTestId('group-progress').children).toHaveLength(3)
  await meetAll(module.toolIds! as ToolId[])
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('tapping a tool narrates description then fun fact', async () => {
  const module = checkup.modules.find(m => m.kind === 'tools')! as ModuleDef
  render(<ToolsScreen module={module} onComplete={vi.fn()} />)
  await act(async () => {
    fireEvent.click(screen.getByTestId('tool-mirror'))
  })
  expect(audio.say).toHaveBeenCalledWith('en', 'tool.mirror.desc')
  expect(audio.say).toHaveBeenCalledWith('en', 'tool.mirror.fact')
  expect(screen.getByTestId('met-mirror')).toBeInTheDocument()
})
