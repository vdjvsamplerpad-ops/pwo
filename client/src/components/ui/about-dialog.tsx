import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DEFAULT_DESCRIPTION =
  'VDJV Sampler Pad is a fast, performance-ready sampler for launching audio clips, banks, and live mixes across web and mobile.';

const DEFAULT_KEY_GUIDE = [
  'Space — Stop All',
  'M — Mixer',
  'Z — Edit Mode',
  'X — Mute/Unmute',
  'B — Banks Menu',
  'N — Upload',
  'ArrowDown — Master Volume -5%',
  'ArrowUp — Master Volume +5%'
];

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string;
  version: string;
}

export function AboutDialog({ open, onOpenChange, displayName, version }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>VDJV Sampler Pad</DialogTitle>
          <DialogDescription>{DEFAULT_DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border p-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">User</div>
            <div className="font-medium">{displayName}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Version</div>
            <div className="font-medium">{version}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Keyboard Guide</div>
            <ul className="space-y-1">
              {DEFAULT_KEY_GUIDE.map((item) => (
                <li key={item} className="text-sm text-gray-700 dark:text-gray-200">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
