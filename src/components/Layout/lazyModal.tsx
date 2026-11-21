import { Component, Suspense, lazy, useState, type ComponentType, type ReactNode } from "react"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ModalModule<P> = { default: ComponentType<P> }

const loaders: (() => Promise<unknown>)[] = []

interface LoadBoundaryProps {
  children: ReactNode
  onError: () => void
}

/**
 * catches a modal whose code failed to load (offline, or a deploy replaced
 * its chunk), which would otherwise take down the whole app
 */
class LoadBoundary extends Component<LoadBoundaryProps, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override componentDidCatch(error: unknown) {
    console.error("failed to load modal:", error)
    this.props.onError()
  }

  override render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * a modal whose code is split out of the main bundle. nothing is rendered
 * until it first opens, and it stays mounted after that so it can animate
 * closed and open again without waiting
 */
export function lazyModal<P extends ModalProps>(load: () => Promise<ModalModule<P>>): ComponentType<P> {
  loaders.push(load)
  let Modal = lazy(load) as ComponentType<P>

  const LazyModal = (props: P) => {
    const [opened, setOpened] = useState(props.open)
    if (props.open && !opened) setOpened(true)
    if (!opened) return null

    // lazy() keeps a failed load, so the next open starts a fresh one
    const handleError = () => {
      Modal = lazy(load) as ComponentType<P>
      setOpened(false)
      props.onOpenChange(false)
    }

    return (
      <LoadBoundary onError={handleError}>
        <Suspense fallback={null}>
          <Modal {...props} />
        </Suspense>
      </LoadBoundary>
    )
  }
  return LazyModal
}

/**
 * fetches every lazy modal's code once the page is idle, so they open at
 * once without having been part of the first load
 */
export function preloadModalsWhenIdle(): void {
  const preload = () => loaders.forEach((load) => load().catch(() => {}))
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(preload, { timeout: 5000 })
  } else {
    setTimeout(preload, 2000)
  }
}
