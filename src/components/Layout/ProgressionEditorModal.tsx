import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '../../components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';


interface ProgressionEditorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialProgression: string;
    onSave: (newProgression: string) => void;
}

export const ProgressionEditorModal: React.FC<ProgressionEditorModalProps> = ({
    open,
    onOpenChange,
    initialProgression,
    onSave,
}) => {
    const [progression, setProgression] = useState(initialProgression);

    // a saved progression waiting for the close animation to finish.
    // rebuilding the board in the same frame as the close would stall
    // the main thread and the dialog would vanish instead of fading out
    const pendingSave = useRef<string | null>(null);

    const flushPendingSave = () => {
        if (pendingSave.current === null) return;
        const saved = pendingSave.current;
        pendingSave.current = null;
        onSave(saved);
    };

    // When the modal opens, this effect syncs the textarea's content 
    // with the current progression from the app state.
    useEffect(() => {
        if (open) {
            // reopened before the previous close finished animating
            flushPendingSave();
            setProgression(initialProgression);
        }
    }, [initialProgression, open]);

    // Closes the modal; onSave runs once it has animated out
    const handleSaveClick = () => {
        pendingSave.current = progression;
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-lg"
                // fires after the content unmounts, i.e. after the exit animation
                onCloseAutoFocus={flushPendingSave}
            >
                <DialogHeader>
                    <DialogTitle>Edit progression</DialogTitle>
                    <DialogDescription>
                        Type or paste chords. Separate them with spaces or commas,
                        and start a new section with a <code className="text-foreground">/</code>.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="progression-input" className="sr-only">Progression</Label>
                    <Textarea
                        id="progression-input"
                        value={progression}
                        onChange={(e) => setProgression(e.target.value)}
                        className="min-h-[120px] resize-none font-mono text-sm md:text-sm"
                        placeholder="e.g. Cmaj7 Am7 Dm7 G7"
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                    />
                    <p className="text-xs text-muted-foreground">
                        Example: <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">C, G, Am F / Dm G C</code>
                    </p>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSaveClick}>
                        Update
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
