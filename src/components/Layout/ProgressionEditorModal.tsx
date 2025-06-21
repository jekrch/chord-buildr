import React, { useState, useEffect } from 'react';
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

    // When the modal opens, this effect syncs the textarea's content 
    // with the current progression from the app state.
    useEffect(() => {
        if (open) {
            setProgression(initialProgression);
        }
    }, [initialProgression, open]);

    // Calls the onSave callback and closes the modal
    const handleSaveClick = () => {
        onSave(progression);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-background text-foreground rounded-lg shadow-2xl">
                <DialogHeader className="border-b border-border px-2 pt-4 pb-6">
                    <DialogTitle className="text-xl font-semibold">Edit Progression</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Manually enter your chord progression below.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2 px-2 space-y-4">
                    <div className="grid w-full gap-4">
                        <Label htmlFor="progression-input" className="!text-sm font-normal">Progression</Label>
                        <Textarea
                            id="progression-input"
                            value={progression}
                            onChange={(e) => setProgression(e.target.value)}
                            className="min-h-[120px] text-base resize-none bg-gradient-to-tl from-bg-background/10 to-gray-900/80 border-border focus:ring-ring focus:ring-offset-background"
                            placeholder="e.g., Cmaj7 Am7 Dm7 G7"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Separate chords with spaces or commas. Example: <code className="font-mono ml-1 rounded-md">C, G, Am F</code>
                    </p>
                </div>
                <DialogFooter className="py-4 border-t border-border bg-transparent">
                    <div className="mx-auto space-x-4 -mb-2 mt-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSaveClick}>
                            Update
                        </Button>
                    </div>
                </DialogFooter>

            </DialogContent>

        </Dialog>
    );
};
