import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { ProgressDialog } from '@/components/ui/progress-dialog';
import { Trash2, Download, Crown } from 'lucide-react';
import { SamplerBank, PadData } from './types/sampler';
import { useAuth } from '@/hooks/useAuth';
import { isReservedShortcutCombo, normalizeShortcutKey, RESERVED_SHORTCUT_KEYS } from '@/lib/keyboard-shortcuts';

interface BankEditDialogProps {
  bank: SamplerBank;
  allBanks: SamplerBank[];
  allPads: PadData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: 'light' | 'dark';
  onSave: (updates: Partial<SamplerBank>) => void;
  onDelete: () => void;
  onExport: () => void;
  onExportAdmin?: (id: string, title: string, description: string, transferable: boolean, addToDatabase: boolean, allowExport: boolean, onProgress?: (progress: number) => void) => Promise<string>;
}

const colorOptions = [
  { label: 'Red', value: '#ef4444', textColor: '#ffffff' },
  { label: 'Orange', value: '#f97316', textColor: '#ffffff' },
  { label: 'Amber', value: '#f59e0b', textColor: '#ffffff' },
  { label: 'Yellow', value: '#eab308', textColor: '#000000' },
  { label: 'Lime', value: '#84cc16', textColor: '#000000' },
  { label: 'Green', value: '#22c55e', textColor: '#ffffff' },
  { label: 'Emerald', value: '#10b981', textColor: '#ffffff' },
  { label: 'Teal', value: '#14b8a6', textColor: '#ffffff' },
  { label: 'Cyan', value: '#06b6d4', textColor: '#ffffff' },
  { label: 'Sky', value: '#0ea5e9', textColor: '#ffffff' },
  { label: 'Blue', value: '#3b82f6', textColor: '#ffffff' },
  { label: 'Indigo', value: '#6366f1', textColor: '#ffffff' },
  { label: 'Violet', value: '#8b5cf6', textColor: '#ffffff' },
  { label: 'Purple', value: '#a855f7', textColor: '#ffffff' },
  { label: 'Fuchsia', value: '#d946ef', textColor: '#ffffff' },
  { label: 'Pink', value: '#ec4899', textColor: '#ffffff' },
  { label: 'Rose', value: '#f43f5e', textColor: '#ffffff' },
  { label: 'Gray', value: '#6b7280', textColor: '#ffffff' },
  { label: 'Black', value: '#1f2937', textColor: '#ffffff' },
  { label: 'White', value: '#f9fafb', textColor: '#000000' },
  // New colors
  { label: 'Brown', value: '#92400e', textColor: '#ffffff' },
  { label: 'Neon Green', value: '#39ff14', textColor: '#000000' },
  { label: 'Neon Yellow', value: '#ffff00', textColor: '#000000' },
  { label: 'Hot Pink', value: '#ff0095', textColor: '#ffffff' },
  { label: 'Gold', value: '#ffd700', textColor: '#000000' },
  { label: 'Maroon', value: '#800000', textColor: '#ffffff' },
  { label: 'Turquoise', value: '#40e0d0', textColor: '#000000' },
  { label: 'Coral', value: '#ff6600', textColor: '#ffffff' },
];

export function BankEditDialog({ bank, allBanks, allPads, open, onOpenChange, theme, onSave, onDelete, onExport, onExportAdmin }: BankEditDialogProps) {
  const { profile } = useAuth();
  const [name, setName] = React.useState(bank.name);
  const [defaultColor, setDefaultColor] = React.useState(bank.defaultColor);
  const [shortcutKey, setShortcutKey] = React.useState(bank.shortcutKey || '');
  const [shortcutError, setShortcutError] = React.useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showAdminExport, setShowAdminExport] = React.useState(false);
  const [adminTitle, setAdminTitle] = React.useState(bank.name);
  const [adminDescription, setAdminDescription] = React.useState('');
  const [adminTransferable, setAdminTransferable] = React.useState(false);
  const [adminAddToDatabase, setAdminAddToDatabase] = React.useState(false);
  const [adminAllowExport, setAdminAllowExport] = React.useState(false);
  const [showAdminExportProgress, setShowAdminExportProgress] = React.useState(false);
  const [adminExportProgress, setAdminExportProgress] = React.useState(0);
  const [adminExportStatus, setAdminExportStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [adminExportError, setAdminExportError] = React.useState<string>('');

  React.useEffect(() => {
    if (open) {
      setName(bank.name);
      setDefaultColor(bank.defaultColor);
      setShortcutKey(bank.shortcutKey || '');
      setShortcutError(null);
      setAdminTitle(bank.name);
      setAdminDescription('');
      setAdminTransferable(false);
      setAdminAddToDatabase(false);
      setAdminAllowExport(true); // Default to true when Add to Database is disabled
    }
  }, [open, bank]);

  const handleSave = () => {
    if (shortcutError) {
      return;
    }

    onSave({
      name,
      defaultColor,
      shortcutKey: shortcutKey || undefined,
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
  };

  const handleAdminExport = async () => {
    if (!onExportAdmin) return;

    setShowAdminExportProgress(true);
    setAdminExportStatus('loading');
    setAdminExportProgress(0);
    setAdminExportError('');

    try {
      const exportMessage = await onExportAdmin(bank.id, adminTitle, adminDescription, adminTransferable, adminAddToDatabase, adminAllowExport, (progress) => {
        setAdminExportProgress(progress);
      });
      setAdminExportStatus('success');
      // Store the message to show in ProgressDialog (reuse errorMessage field for success message)
      setAdminExportError(exportMessage || '');
    } catch (error) {
      console.error('Admin export failed:', error);
      setAdminExportStatus('error');
      setAdminExportError(error instanceof Error ? error.message : 'Admin export failed');
    }
  };

  const isAdmin = profile?.role === 'admin';

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const applyShortcutKey = (nextKey: string | null) => {
    if (!nextKey) {
      setShortcutKey('');
      setShortcutError(null);
      return;
    }

    if (isReservedShortcutCombo(nextKey)) {
      setShortcutError(`"${nextKey}" is reserved for global controls.`);
      return;
    }

    const duplicateBank = allBanks.find((otherBank) => {
      if (otherBank.id === bank.id) return false;
      const existingKey = otherBank.shortcutKey ? normalizeShortcutKey(otherBank.shortcutKey) : '';
      return existingKey === nextKey;
    });

    if (duplicateBank) {
      setShortcutError(`"${nextKey}" is already assigned to bank "${duplicateBank.name}".`);
      return;
    }

    const duplicatePad = allPads.find((pad) => {
      const existingKey = pad.shortcutKey ? normalizeShortcutKey(pad.shortcutKey) : '';
      return existingKey === nextKey;
    });

    if (duplicatePad) {
      setShortcutError(`"${nextKey}" is already assigned to pad "${duplicatePad.name}".`);
      return;
    }

    setShortcutKey(nextKey);
    setShortcutError(null);
  };

  const handleShortcutKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab') return;
    event.preventDefault();

    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Escape') {
      applyShortcutKey(null);
      return;
    }

    const normalized = normalizeShortcutKey(event.key, {
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey
    });
    if (!normalized) {
      setShortcutError('Please press a letter or number key.');
      return;
    }

    applyShortcutKey(normalized);
  };

  const reservedKeysText = RESERVED_SHORTCUT_KEYS.join(', ');

  const shortcutAssignments = React.useMemo(() => {
    return bank.pads
      .map((pad) => ({
        name: pad.name,
        key: pad.shortcutKey ? normalizeShortcutKey(pad.shortcutKey) : null
      }))
      .filter((pad) => !!pad.key) as { name: string; key: string }[];
  }, [bank.pads]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`sm:max-w-md backdrop-blur-md ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
          }`} aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Bank</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
 

            <div className="space-y-2">
              <Label>Bank Color</Label>
              <div className="flex gap-1 flex-wrap">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    onClick={() => setDefaultColor(colorOption.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${defaultColor === colorOption.value ? 'border-white scale-110 shadow-lg' : 'border-gray-400'
                      }`}
                    style={{ 
                      backgroundColor: colorOption.value,
                      color: colorOption.textColor
                    }}
                    title={colorOption.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Bank Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  if (e.target.value.length <= 18) {
                    setName(e.target.value);
                  }
                }}
                placeholder="Enter bank name"
                className="backdrop-blur-sm"
                maxLength={24}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                onFocus={(e) => {
                  // Prevent immediate focus on mobile
                  if (window.innerWidth <= 768) {
                    setTimeout(() => e.target.focus(), 100);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankShortcutKey">Bank Shortcut Key</Label>
              <Input
                id="bankShortcutKey"
                value={shortcutKey}
                onKeyDown={handleShortcutKeyDown}
                placeholder="Press a key"
                readOnly
              />
              {shortcutError && (
                <p className="text-xs text-red-500">{shortcutError}</p>
              )}
              {!shortcutError && (
                <p className="text-xs text-gray-500">
                  Reserved keys: {reservedKeysText}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Keyboard Shortcuts (Pads)</Label>
              {shortcutAssignments.length > 0 ? (
                <div className="max-h-32 overflow-y-auto rounded border p-2 text-sm">
                  {shortcutAssignments.map((assignment) => (
                    <div key={`${assignment.key}-${assignment.name}`} className="flex items-center justify-between">
                      <span className="truncate">{assignment.name}</span>
                      <span className="ml-3 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                        {assignment.key}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No shortcuts assigned in this bank.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Bank Information</Label>
              <div className={`text-sm space-y-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <div>Created: {formatDate(bank.createdAt)}</div>
                <div>Pads: {bank.pads.length}</div>
                <div>Created by: {bank.isAdminBank ? (
                  <span className="text-yellow-500 font-medium">ADMIN DJ V</span>
                ) : bank.creatorEmail ? (
                  <span>{bank.creatorEmail}</span>
                ) : (
                  <span className="italic text-gray-400">Unknown</span>
                )}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
              <Button
                onClick={() => {
                  // Block export if exportable is false
                  if (bank.exportable === false) {
                    return;
                  }
                  if (isAdmin && onExportAdmin) {
                    setShowAdminExport(true);
                  } else {
                    onExport();
                  }
                }}
                variant="outline"
                disabled={bank.exportable === false}
                className={`px-3 ${bank.exportable === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={bank.exportable === false ? 'Export disabled for this bank' : (isAdmin ? 'Export (admin)' : 'Export')}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button onClick={onDelete} variant="destructive" className="px-3">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Export Dialog */}
      <Dialog open={showAdminExport} onOpenChange={setShowAdminExport}>
        <DialogContent className={`sm:max-w-md backdrop-blur-md ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
          }`} aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Export as Admin Bank
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="adminTitle">Bank Title</Label>
              <Input
                id="adminTitle"
                value={adminTitle}
                onChange={(e) => setAdminTitle(e.target.value)}
                placeholder="Enter bank title"
                className="backdrop-blur-sm"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminDescription">Description</Label>
              <textarea
                id="adminDescription"
                value={adminDescription}
                onChange={(e) => setAdminDescription(e.target.value)}
                placeholder="Enter bank description"
                className={`w-full min-h-[80px] p-3 rounded-md border backdrop-blur-sm resize-none ${
                  theme === 'dark' 
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                maxLength={200}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="adminTransferable">Allow Pad Transfers</Label>
              <Switch
                id="adminTransferable"
                checked={adminTransferable}
                onCheckedChange={setAdminTransferable}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="adminAddToDatabase">Add to Database</Label>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Official bank with user access control (export automatically disabled)
                </p>
              </div>
              <Switch
                id="adminAddToDatabase"
                checked={adminAddToDatabase}
                onCheckedChange={(checked) => {
                  setAdminAddToDatabase(checked);
                  if (checked) {
                    // When Add to Database is enabled, export is automatically blocked
                    setAdminAllowExport(false);
                  }
                }}
              />
            </div>

            {!adminAddToDatabase && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="adminAllowExport">Allow Export</Label>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Users can export this bank after importing
                  </p>
                </div>
                <Switch
                  id="adminAllowExport"
                  checked={adminAllowExport}
                  onCheckedChange={setAdminAllowExport}
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAdminExport} className="flex-1" disabled={!adminTitle.trim()}>
                Export Admin Bank
              </Button>
              <Button onClick={() => setShowAdminExport(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Export Progress Dialog */}
      <ProgressDialog
        open={showAdminExportProgress}
        onOpenChange={(open) => {
          setShowAdminExportProgress(open);
          if (!open && adminExportStatus === 'success') {
            setShowAdminExport(false);
          }
        }}
        title="Exporting Admin Bank"
        description="Creating encrypted bank file and updating database..."
        progress={adminExportProgress}
        status={adminExportStatus}
        type="export"
        theme={theme}
        errorMessage={adminExportError}
        onRetry={handleAdminExport}
      />

    </>
  );
}
