import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../../components/ui/dialog"
import { Music, Music2Icon } from "lucide-react"

interface AboutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="border-b pb-4">
          <div className=" inset-0" />
        </DialogHeader>
        
        <div className="space-y-4 relative overflow-auto max-h-[60vh] px-4">
          <p className="text-sm text-center">
            Chord Buildr provides an easy way for musicians and music lovers to
            create and share chord progressions.
          </p>
          
        <div className="border-t border-border" />
          
          <div className="space-y-6">
            <div className="space-y-2">
              <h6 className="text-sm font-semibold flex items-center">
                <Music className="mr-1 h-4 w-4" /> transpose
              </h6>
              <div className="text-sm text-muted-foreground ml-6">
                Mark a chord as the key and the rest of your progression will
                transpose as you change its root note.
              </div>
            </div>

            <div className="space-y-2">
              <h6 className="text-sm font-semibold flex items-center">
                <Music2Icon className="mr-1 h-4 w-4" /> share
              </h6>
              <div className="text-sm text-muted-foreground ml-6">
                To share a progression, simply copy the URL. No account needed!
              </div>
            </div>
          </div>

          <div className="pt-[0.7em] text-center text-sm">
            <p className="text-muted-foreground">
              Chord Buildr is an{" "}
              <a
                className="text-primary hover:underline"
                href="https://github.com/jekrch/chord-buildr"
              >
                open source
              </a>{" "}
              project <br /> by{" "}
              <a 
                className="text-primary hover:underline" 
                href="https://www.jacobkrch.com"
              >
                Jacob Krch
              </a>{" "}
              and{" "}
              <a
                className="text-primary hover:underline"
                href="https://www.linkedin.com/in/teran-keith-210941107/"
              >
                Teran Keith
              </a>
            </p>
            
            <p className="text-xs text-muted-foreground !mt-[2em]">
              &copy; 2020-{new Date().getFullYear()} Jacob Krch All Rights Reserved
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AboutModal