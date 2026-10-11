import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Compass, Link2, Music } from "lucide-react"

interface AboutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const linkClass = "text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-primary"

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>About Chord Buildr</DialogTitle>
          <DialogDescription>
            An easy way for musicians and music lovers to create and share
            chord progressions.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-auto">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md border border-border bg-secondary text-primary">
                <Music className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Transpose</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Mark a chord as the key and the rest of your progression will
                  transpose as you change its root note.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md border border-border bg-secondary text-primary">
                <Link2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Share</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  To share a progression, simply copy the URL. No account needed!
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-border pt-4">
            <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md border border-border bg-secondary text-primary">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium">
                <a className={linkClass} href="https://modal.chordbuildr.com">
                  modal.chordbuildr.com
                </a>
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                I also created this companion app for exploring modes and
                scales and managing song sheets.
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4 text-sm text-muted-foreground">
            <p>
              Chord Buildr is an{" "}
              <a
                className={linkClass}
                href="https://github.com/jekrch/chord-buildr"
              >
                open source
              </a>{" "}
              project started by{" "}
              <a
                className={linkClass}
                href="https://www.jacobkrch.com"
              >
                Jacob Krch
              </a>{" "}
              and{" "}
              <a
                className={linkClass}
                href="https://www.linkedin.com/in/teran-keith-210941107/"
              >
                Teran Keith
              </a>
              .
            </p>

            <p className="text-xs">
              &copy; 2020-{new Date().getFullYear()} Jacob Krch. All rights reserved.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AboutModal
