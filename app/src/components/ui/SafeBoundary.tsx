import { Component, type ReactNode } from 'react'

/** Renders `fallback` when the child crashes (e.g. no WebGL for the 3D hero). */
export class SafeBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
