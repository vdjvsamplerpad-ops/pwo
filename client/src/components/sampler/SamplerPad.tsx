import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PadData, StopMode } from './types/sampler';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { PadEditDialog } from './PadEditDialog';
import { PadTransferDialog } from './PadTransferDialog';
import { Play, Pause, MousePointer2, Zap, VolumeX } from 'lucide-react';

interface EqSettings {
  low: number;
  mid: number;
  high: number;
}

interface SamplerPadProps {
  pad: PadData;
  bankId: string;
  bankName: string;
  allPads?: PadData[];
  editMode: boolean;
  globalMuted: boolean;
  masterVolume: number;
  theme: 'light' | 'dark';
  stopMode: StopMode;
  eqSettings: EqSettings;
  padSize?: number;
  onUpdatePad: (bankId: string, id: string, updatedPad: PadData) => void;
  onRemovePad: (id: string) => void;
  onDragStart?: (e: React.DragEvent, pad: PadData, bankId: string) => void;
  onTransferPad?: (padId: string, sourceBankId: string, targetBankId: string) => void;
  availableBanks?: Array<{ id: string; name: string; }>;
  canTransferFromBank?: (bankId: string) => boolean;
}

export function SamplerPad({
  pad,
  bankId,
  bankName,
  allPads = [],
  editMode,
  globalMuted,
  masterVolume,
  theme,
  stopMode,
  eqSettings,
  padSize = 5,
  onUpdatePad,
  onRemovePad,
  onDragStart,
  onTransferPad,
  availableBanks = [],
  canTransferFromBank
}: SamplerPadProps) {
  const audioPlayer = useAudioPlayer(
    pad,
    bankId,
    bankName,
    globalMuted,
    masterVolume,
    eqSettings
  );

  const { isPlaying, progress, effectiveVolume, playAudio, stopAudio, queueNextPlaySettings } = audioPlayer;
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showTransferDialog, setShowTransferDialog] = React.useState(false);
  const [isHolding, setIsHolding] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const handlePadClick = (e: React.MouseEvent) => {
    // Don't handle pad click if clicking on the transfer indicator
    if ((e.target as HTMLElement).closest('.transfer-indicator')) {
      return;
    }

    if (editMode) {
      setShowEditDialog(true);
    } else if (pad.triggerMode === 'toggle') {
      if (isPlaying) stopAudio();
      else playAudio();
    } else if (pad.triggerMode !== 'hold') {
      playAudio();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editMode) return;
    if ((e.target as HTMLElement).closest('.transfer-indicator')) {
      return;
    }

    if (pad.triggerMode === 'hold') {
      e.preventDefault();
      setIsHolding(true);
      playAudio();
    }
  };

  const handleMouseUp = () => {
    if (editMode) return;
    if (pad.triggerMode === 'hold' && isHolding) {
      setIsHolding(false);
      stopAudio();
    }
  };

  const handleMouseLeave = () => {
    if (editMode) return;
    if (pad.triggerMode === 'hold' && isHolding) {
      setIsHolding(false);
      stopAudio();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (editMode) return;
    if (pad.triggerMode === 'hold') {
      e.preventDefault();
      setIsHolding(true);
      playAudio();
    }
  };

  const handleTouchEnd = () => {
    if (editMode) return;
    if (pad.triggerMode === 'hold' && isHolding) {
      setIsHolding(false);
      stopAudio();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!editMode) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';

    // Set both data formats for better compatibility
    const transferData = {
      type: 'pad-transfer',
      pad: pad,
      sourceBankId: bankId
    };

    e.dataTransfer.setData('application/json', JSON.stringify(transferData));
    e.dataTransfer.setData('text/plain', JSON.stringify(transferData));

    console.log('Drag started for pad:', pad.id, 'from bank:', bankId);

    if (onDragStart) {
      onDragStart(e, pad, bankId);
    }
  };

  const handleDragEnd = () => {
    console.log('Drag ended for pad:', pad.id);
    setIsDragging(false);
  };

  const handleTransferClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Check if this bank allows transfers
    if (canTransferFromBank && !canTransferFromBank(bankId)) {
      return;
    }
    
    if (availableBanks.length > 1) { // Current bank + other banks
      setShowTransferDialog(true);
    }
  };

  const handleTransfer = (targetBankId: string) => {
    if (onTransferPad && targetBankId !== bankId) {
      console.log('Transferring pad:', pad.id, 'from:', bankId, 'to:', targetBankId);
      onTransferPad(pad.id, bankId, targetBankId);
    }
    setShowTransferDialog(false);
  };

  const handleSave = async (updatedPad: PadData) => {
    try {
      await onUpdatePad(bankId, pad.id, updatedPad);
      queueNextPlaySettings(updatedPad);
      setShowEditDialog(false);
    } catch (error) {
      console.error('Failed to save pad:', error);
    }
  };


  const handleUnload = () => {
    onRemovePad(pad.id);
    setShowEditDialog(false);
  };

  const handleImageError = () => {
    console.warn('Image failed to load for pad:', pad.id, pad.name);
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const getTextProps = () => {
    let textSize = 'text-sm';
    let lineClamp = 'line-clamp-2';

    if (padSize <= 2) {
      textSize = 'text-lg';
      lineClamp = 'line-clamp-4';
    } else if (padSize <= 6) {
      textSize = 'text-base';
      lineClamp = 'line-clamp-3';
    } else if (padSize <= 10) {
      textSize = 'text-sm';
      lineClamp = 'line-clamp-2';
    } else {
      textSize = 'text-[10px]'; // Smaller for very dense grids
      lineClamp = 'line-clamp-2';
    }

    return { textSize, lineClamp };
  };

  const { textSize, lineClamp } = getTextProps();

  const getButtonOpacity = () => {
    if (pad.triggerMode === 'unmute' && isPlaying) {
      return 'opacity-60';
    }
    if (isDragging) {
      return 'opacity-50';
    }
    return '';
  };

  const shouldShowImage = pad.imageUrl && !imageError;
  const shouldShowText = !shouldShowImage;

  const getEditModeClasses = () => {
    if (editMode) {
      return 'ring-2 ring-orange-400 cursor-grab active:cursor-grabbing';
    }
    return 'cursor-pointer';
  };

  const getEditModeButtonClasses = () => {
    return editMode ? '' : '';
  };

  const getEditModeButtonStyle = () => {
    if (editMode) {
      return { animationDelay: `${Math.random()}s` };
    }
    return {};
  };

  const getTriggerModeIcon = () => {
    // Smaller icons on mobile to maximize text space
    const iconSize = 'w-2 h-2 sm:w-3 sm:h-3';
    switch (pad.triggerMode) {
      case 'toggle':
        if (isPlaying) {
          return <Pause className={`${iconSize} text-blue-400`} />;
        } else {
          return <Play className={`${iconSize} text-blue-400`} />;
        }
      case 'hold':
        return <MousePointer2 className={`${iconSize} text-green-400`} />;
      case 'stutter':
        return <Zap className={`${iconSize} text-orange-400`} />;
      case 'unmute':
        return <VolumeX className={`${iconSize} text-purple-400`} />;
      default:
        return null;
    }
  };

  // Filter out current bank from available banks for transfer
  const transferableBanks = availableBanks.filter(bank => bank.id !== bankId);

  return (
    <>
      <Button
        onClick={handlePadClick}
        onMouseDown={pad.triggerMode === 'hold' && !editMode ? handleMouseDown : undefined}
        onMouseUp={pad.triggerMode === 'hold' && !editMode ? handleMouseUp : undefined}
        onMouseLeave={pad.triggerMode === 'hold' && !editMode ? handleMouseLeave : undefined}
        onTouchStart={pad.triggerMode === 'hold' && !editMode ? handleTouchStart : undefined}
        onTouchEnd={pad.triggerMode === 'hold' && !editMode ? handleTouchEnd : undefined}
        draggable={editMode}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        // Added title for native browser tooltip on hover (shows full name)
        title={shouldShowText ? pad.name : undefined}
        className={`
          w-full h-full min-h-[80px] font-bold border-2 transition-colors duration-150 relative overflow-hidden select-none
          ${getButtonOpacity()} ${getEditModeClasses()} ${getEditModeButtonClasses()}
          ${isDragging ? 'z-50' : ''}
          ${isPlaying
            ? 'bg-green-400 border-green-300 text-white'
            : theme === 'dark'
              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500 text-white'
              : 'bg-white border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-900'
          }
        `}
        style={{
          backgroundColor: isPlaying ? undefined : `${pad.color}CC`,
          ...getEditModeButtonStyle()
        }}
      >
        {/* Drag/Transfer indicator for edit mode - smaller on mobile */}
        {editMode && (
          <div
            onClick={handleTransferClick}
            className={`transfer-indicator absolute top-0.5 left-0.5 sm:top-1 sm:left-1 p-0.5 sm:p-1 rounded-full transition-all hover:scale-110 z-10 ${
              transferableBanks.length > 0 && (!canTransferFromBank || canTransferFromBank(bankId))
                ? 'bg-orange-500 hover:bg-orange-400 cursor-pointer'
                : 'bg-gray-500 cursor-not-allowed'
              }`}
            title={
              transferableBanks.length > 0 && (!canTransferFromBank || canTransferFromBank(bankId))
                ? 'Click to transfer to another bank'
                : canTransferFromBank && !canTransferFromBank(bankId)
                  ? 'Transfers not allowed from this bank'
                  : 'No other banks available'
            }
            style={{ pointerEvents: 'auto' }}
          >
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 grid grid-cols-2 gap-0.5">
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full"></div>
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full"></div>
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full"></div>
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full"></div>
            </div>
          </div>
        )}

        {/* Trigger Mode Indicator - smaller on mobile to maximize text space */}
        <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 p-0.5 sm:p-1 rounded-full bg-black bg-opacity-20 pointer-events-none z-10">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex items-center justify-center">
            {getTriggerModeIcon()}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center h-full w-full pointer-events-none p-0 sm:p-2 overflow-hidden">
          {shouldShowImage ? (
            <div className="relative w-full max-w-[100%] aspect-square mb-1">
              <img
                src={pad.imageUrl}
                alt={pad.name}
                className="w-full h-full object-cover rounded object-center"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            </div>
          ) : shouldShowText ? (
            /* ENHANCED TEXT RENDERING - RESPONSIVE TO PAD SIZE:
               - Text fills entire pad space with absolute positioning
               - Viewport-relative font sizing for very small pads (uses clamp for min/max)
               - Zero padding on mobile to maximize space, minimal on desktop
               - Text scales with actual pad dimensions, not just padSize prop
               - Maximum lines allowed based on available space
               - Strong text shadows for readability
               - Tighter line height for better space utilization
            */
            <div className="absolute inset-0 flex items-center justify-center px-0 py-0 sm:relative sm:px-0 sm:py-0 sm:mb-1 w-full h-full overflow-hidden">
              <span 
                className={`text-center font-bold leading-[1.1] break-words whitespace-normal line-clamp-4 sm:${lineClamp} ${isPlaying
                  ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                  : theme === 'dark'
                    ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                    : 'text-gray-900 drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]'
                  }`}
                style={{
                  // Responsive font sizing that scales with viewport and pad size
                  // Uses clamp for min/max bounds, viewport units for scaling
                  // Minimum sizes ensure readability even on very small pads
                  fontSize: padSize <= 6 
                    ? 'clamp(11px, min(4.5vw, 4.5vh, 1.2em), 18px)' // Larger for small pad counts
                    : padSize <= 10
                      ? 'clamp(10px, min(4vw, 4vh, 1.1em), 16px)' // Medium
                      : 'clamp(9px, min(3.5vw, 3.5vh, 1em), 14px)', // Smaller for dense grids
                  padding: '1px 2px',
                  maxWidth: 'calc(100% - 4px)',
                  maxHeight: 'calc(100% - 18px)', // Reserve space for volume/progress
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {pad.name}
              </span>
            </div>
          ) : null}

          {/* Volume percentage - smaller and positioned at bottom on mobile, hidden if playing */}
          {!isPlaying && (
            <div 
              className={`absolute bottom-0 right-0 sm:relative sm:bottom-0 sm:right-0 sm:px-0 sm:py-0 opacity-60 sm:opacity-75 whitespace-nowrap z-10 ${theme === 'dark'
                ? 'text-gray-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                : 'text-gray-600 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]'
              }`}
              style={{ fontSize: 'clamp(7px, min(2vw, 2vh), 10px)', padding: '1px 2px' }}
            >
              {Math.round(pad.volume * 100)}%
            </div>
          )}

          {/* Progress bar - only show when playing, positioned at very bottom */}
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 px-0 sm:relative sm:bottom-0 sm:px-0 sm:mt-1 w-full z-10">
              <Progress value={progress} className="h-0.5 sm:h-1 rounded-full" />
              <div 
                className={`absolute bottom-0 right-0 opacity-75 whitespace-nowrap ${theme === 'dark'
                  ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                  : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                }`}
                style={{ fontSize: 'clamp(7px, min(2vw, 2vh), 10px)', padding: '1px 2px' }}
              >
                {Math.round(effectiveVolume * 100)}%
              </div>
            </div>
          )}
        </div>
      </Button>

      {showEditDialog && (
        <PadEditDialog
          pad={pad}
          allPads={allPads}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={handleSave}
          onUnload={handleUnload}
        />
      )}

      {showTransferDialog && (
        <PadTransferDialog
          pad={pad}
          availableBanks={transferableBanks}
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          onTransfer={handleTransfer}
          theme={theme}
        />
      )}
    </>
  );
}