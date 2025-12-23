
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTempoFlow } from '@/contexts/tempo-flow-context';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit3, Repeat, Trash2 } from 'lucide-react';
import SectionEditorModal from './section-editor-modal';
import type { TempoSection } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea

const SWIPE_DELETE_THRESHOLD = 80; 
const SWIPE_REVEAL_OFFSET_MAX = 100; 
const HORIZONTAL_SWIPE_INIT_THRESHOLD = 10;

const TempoSectionList: React.FC = () => {
  const {
    sections,
    reorderSections,
    activeSectionId,
    setActiveSectionId,
    updateSection,
    deleteSection,
    isPlaying, 
    setCurrentBeat,
    setCurrentMeasure,
    setCurrentSubdivisionTick,
    isPrecountEnabled,
    precountBars
  } = useTempoFlow();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<TempoSection | null>(null);

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<'before-all' | 'after-all' | null>(null);

  const [activeSwipe, setActiveSwipe] = useState<{ id: string | null; startX: number; startY: number; currentOffset: number; isSwiping: boolean; isHorizontal: boolean | null }>({ 
    id: null,
    startX: 0,
    startY: 0,
    currentOffset: 0,
    isSwiping: false,
    isHorizontal: null,
  });
  const [itemToDeleteAnim, setItemToDeleteAnim] = useState<string | null>(null);
  const wasSwipedRef = useRef(false);
  const dragOverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sectionItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Populate refs for scrolling
    sections.forEach(section => {
      sectionItemRefs.current[section.id] = null; 
    });
  }, [sections]);

  useEffect(() => {
    // When first section is active, always scroll to top
    if (activeSectionId === sections[0]?.id && scrollViewportRef.current) {
      requestAnimationFrame(() => {
        scrollViewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return; // Early return to avoid other scroll logic
    }
    
    // For all other sections (playing or not), scroll into view
    if (activeSectionId && sectionItemRefs.current[activeSectionId]) {
      const activeElement = sectionItemRefs.current[activeSectionId];
      if (activeElement) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        });
      }
    }
  }, [isPlaying, activeSectionId, sections]);

  useEffect(() => {
    // Listen for add section event from page.tsx
    const handleAddSection = () => {
      handleAddSectionClick();
    };
    
    // Listen for scroll to top event from stop button
    const handleScrollToTop = () => {
      if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    
    window.addEventListener('addSection', handleAddSection);
    window.addEventListener('scrollToTop', handleScrollToTop);
    return () => {
      window.removeEventListener('addSection', handleAddSection);
      window.removeEventListener('scrollToTop', handleScrollToTop);
    };
  }, []);


  const handleAddSectionClick = () => {
    setEditingSection(null);
    setIsModalOpen(true);
  };

  const handleEditSectionClick = (section: TempoSection) => {
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const handleToggleSectionLoop = (e: React.MouseEvent, section: TempoSection) => {
    e.stopPropagation();
    updateSection(section.id, { isLoopable: !section.isLoopable });
  };

  const handleSectionCardClick = (sectionId: string) => {
    if (draggedItemId || wasSwipedRef.current) {
      if (wasSwipedRef.current) { 
        setTimeout(() => { wasSwipedRef.current = false; }, 0);
      }
      return;
    }
    setActiveSectionId(sectionId);
    setCurrentBeat(0);
    setCurrentMeasure(0);
    setCurrentSubdivisionTick(0);
  };

  const getTempoDisplay = (section: TempoSection) => {
    if (section.endTempo && section.endTempo !== section.tempo) {
      return `${section.tempo} → ${section.endTempo} BPM`;
    }
    return `${section.tempo} BPM`;
  };

  const getBeatsDisplay = (timeSignature: string) => {
    const beats = Number(timeSignature);
    return `${beats} Beat${beats === 1 ? '' : 's'}`;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, sectionId: string) => {
    if (activeSwipe.id === sectionId && activeSwipe.isSwiping) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', sectionId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(sectionId);
  };

  const handleDragEnd = () => {
    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current);
      dragOverTimeoutRef.current = null;
    }
    setDraggedItemId(null);
    setDragOverItemId(null);
    setDropZone(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, sectionId: string) => {
    if (activeSwipe.id === sectionId && activeSwipe.isSwiping) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (sectionId !== draggedItemId && dragOverItemId !== sectionId) {
      if (dragOverTimeoutRef.current) {
        clearTimeout(dragOverTimeoutRef.current);
      }
      dragOverTimeoutRef.current = setTimeout(() => {
        setDragOverItemId(sectionId);
        setDropZone(null);
      }, 10);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, sectionId: string) => {
     if (activeSwipe.id === sectionId && activeSwipe.isSwiping) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    if (sectionId !== draggedItemId && dragOverItemId !== sectionId) {
      if (dragOverTimeoutRef.current) {
        clearTimeout(dragOverTimeoutRef.current);
      }
      setDragOverItemId(sectionId);
      setDropZone(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (activeSwipe.id === e.currentTarget.dataset.sectionId && activeSwipe.isSwiping) return;
    // Only clear if we're actually leaving the element (not entering a child)
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as Node;
    if (!currentTarget.contains(relatedTarget)) {
      if (dragOverTimeoutRef.current) {
        clearTimeout(dragOverTimeoutRef.current);
        dragOverTimeoutRef.current = null;
      }
    }
  };
  

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetSectionId: string) => {
    if (activeSwipe.id === targetSectionId && activeSwipe.isSwiping) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const sourceSectionId = e.dataTransfer.getData('text/plain');
    if (!sourceSectionId || sourceSectionId === targetSectionId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      setDropZone(null);
      return;
    }
    const sourceIndex = sections.findIndex(s => s.id === sourceSectionId);
    const targetIndex = sections.findIndex(s => s.id === targetSectionId);
    if (sourceIndex !== -1 && targetIndex !== -1) {
      reorderSections(sourceIndex, targetIndex);
    }
    setDraggedItemId(null);
    setDragOverItemId(null);
    setDropZone(null);
  };

  const handleDropZoneDrop = (e: React.DragEvent<HTMLDivElement>, zone: 'before-all' | 'after-all') => {
    e.preventDefault();
    const sourceSectionId = e.dataTransfer.getData('text/plain');
    if (!sourceSectionId) {
      setDraggedItemId(null);
      setDropZone(null);
      return;
    }
    const sourceIndex = sections.findIndex(s => s.id === sourceSectionId);
    if (sourceIndex !== -1) {
      const targetIndex = zone === 'before-all' ? 0 : sections.length - 1;
      if (sourceIndex !== targetIndex) {
        reorderSections(sourceIndex, targetIndex);
      }
    }
    setDraggedItemId(null);
    setDropZone(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, sectionId: string) => {
    if (itemToDeleteAnim || (activeSwipe.id && activeSwipe.id !== sectionId)) return;
    
    wasSwipedRef.current = false;
    setActiveSwipe({
      id: sectionId,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      currentOffset: 0,
      isSwiping: false,
      isHorizontal: null,
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!activeSwipe.id || !e.touches.length) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - activeSwipe.startX;
    const deltaY = currentY - activeSwipe.startY;

    // Determine swipe direction if not yet determined
    if (activeSwipe.isHorizontal === null && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      setActiveSwipe(prev => ({ ...prev, isHorizontal }));
      
      // If it's a vertical scroll, let it pass through
      if (!isHorizontal) {
        return;
      }
    }

    // If determined to be vertical, don't interfere with scroll
    if (activeSwipe.isHorizontal === false) {
      return;
    }

    // Only proceed with horizontal swipe logic
    if (!activeSwipe.isSwiping) {
      if (Math.abs(deltaX) > HORIZONTAL_SWIPE_INIT_THRESHOLD && activeSwipe.isHorizontal !== false) {
        setActiveSwipe(prev => ({ ...prev, isSwiping: true }));
        wasSwipedRef.current = true;
      } else {
        return;
      }
    }
    
    if (activeSwipe.isSwiping && activeSwipe.isHorizontal !== false) {
      if (e.cancelable) e.preventDefault();
      const newOffset = Math.min(Math.max(0, deltaX), SWIPE_REVEAL_OFFSET_MAX);
      setActiveSwipe(prev => ({ ...prev, currentOffset: newOffset }));
    }
  };

  const handleTouchEnd = () => {
    if (!activeSwipe.id) return;

    const finalOffset = activeSwipe.currentOffset;
    const wasASwipe = activeSwipe.isSwiping; 

    if (wasASwipe && finalOffset > SWIPE_DELETE_THRESHOLD) {
      setItemToDeleteAnim(activeSwipe.id);
      setTimeout(() => {
        deleteSection(activeSwipe.id!);
        setActiveSwipe({ id: null, startX: 0, startY: 0, currentOffset: 0, isSwiping: false, isHorizontal: null });
        setItemToDeleteAnim(null);
        wasSwipedRef.current = false;
      }, 300);
    } else {
      setActiveSwipe({ id: null, startX: 0, startY: 0, currentOffset: 0, isSwiping: false, isHorizontal: null });
      if (wasASwipe) { 
        setTimeout(() => { wasSwipedRef.current = false; }, 0);
      }
    }
  };

  const handleMouseDownForSwipe = (e: React.MouseEvent<HTMLDivElement>, sectionId: string) => {
    if (itemToDeleteAnim || (activeSwipe.id && activeSwipe.id !== sectionId) || e.button !== 0) return;

    wasSwipedRef.current = false;
    setActiveSwipe({
      id: sectionId,
      startX: e.clientX,
      startY: e.clientY,
      currentOffset: 0,
      isSwiping: false,
      isHorizontal: null,
    });

    const handleMouseMove = (ev: MouseEvent) => {
        if (!activeSwipe.id || activeSwipe.id !== sectionId || !(ev.buttons & 1)) { 
            handleMouseUp(); 
            return;
        }

        const currentX = ev.clientX;
        const currentY = ev.clientY;
        const deltaX = currentX - activeSwipe.startX;
        const deltaY = currentY - activeSwipe.startY;

        // Determine swipe direction if not yet determined
        if (activeSwipe.isHorizontal === null && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
          const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
          setActiveSwipe(prev => ({ ...prev, isHorizontal }));
          
          if (!isHorizontal) {
            return;
          }
        }

        // If determined to be vertical, don't interfere
        if (activeSwipe.isHorizontal === false) {
          return;
        }

        if (!activeSwipe.isSwiping) {
            if (Math.abs(deltaX) > HORIZONTAL_SWIPE_INIT_THRESHOLD && activeSwipe.isHorizontal !== false) {
                setActiveSwipe(prev => ({ ...prev, isSwiping: true }));
                wasSwipedRef.current = true;
            } else {
                return;
            }
        }

        if (activeSwipe.isSwiping && activeSwipe.isHorizontal !== false) {
            if (ev.cancelable) ev.preventDefault();
            const newOffset = Math.min(Math.max(0, deltaX), SWIPE_REVEAL_OFFSET_MAX);
            setActiveSwipe(prev => ({ ...prev, currentOffset: newOffset }));
        }
    };

    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        if (!activeSwipe.id || activeSwipe.id !== sectionId) return; 

        const finalOffset = activeSwipe.currentOffset;
        const wasASwipe = activeSwipe.isSwiping; 

        if (wasASwipe && finalOffset > SWIPE_DELETE_THRESHOLD) {
            setItemToDeleteAnim(activeSwipe.id);
            setTimeout(() => {
                deleteSection(activeSwipe.id!);
                setActiveSwipe({ id: null, startX: 0, startY: 0, currentOffset: 0, isSwiping: false, isHorizontal: null });
                setItemToDeleteAnim(null);
                wasSwipedRef.current = false;
            }, 300);
        } else {
            setActiveSwipe({ id: null, startX: 0, startY: 0, currentOffset: 0, isSwiping: false, isHorizontal: null });
             if (wasASwipe) { 
                setTimeout(() => { wasSwipedRef.current = false; }, 0);
            }
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };


  return (
    <div id="tempo-section-list-container" className="w-full h-full max-h-full flex flex-col">
      {isPrecountEnabled && sections.length > 0 && (
        <div className="mb-1 flex-shrink-0">
          {precountBars >= 1 && (
            <div className="h-1 bg-primary mx-4 rounded-full" aria-hidden="true"></div>
          )}
          {precountBars === 2 && (
            <div className="h-1 bg-primary mx-4 rounded-full mt-1" aria-hidden="true"></div>
          )}
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {sections.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 flex-shrink-0">No sections yet. Add one to get started!</p>
        ) : (
          <ScrollArea className="flex-1 min-h-0 pr-4 touch-pan-y" viewportRef={scrollViewportRef}>
            <div className="space-y-2 sm:space-y-4 p-2 pb-2">
            {/* Drop zone at start */}
            {draggedItemId && (
              <div
                className="h-2 sm:h-3 transition-all duration-150"
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropZone('before-all'); setDragOverItemId(null); }}
                onDragEnter={(e) => { e.preventDefault(); setDropZone('before-all'); setDragOverItemId(null); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropZone(null); }}
                onDrop={(e) => handleDropZoneDrop(e, 'before-all')}
              >
                {dropZone === 'before-all' && (
                  <div className="h-full w-full rounded-full bg-primary/40"></div>
                )}
              </div>
            )}
            {sections.map((section, index) => {
              const isCurrentlyActiveSwipe = activeSwipe.id === section.id;
              const currentOffset = isCurrentlyActiveSwipe ? activeSwipe.currentOffset : 0;
              const showDeleteIndicator = isCurrentlyActiveSwipe && activeSwipe.isSwiping && currentOffset > 20;
              const isBeingDeleted = itemToDeleteAnim === section.id;
              const isBeingSwipedForDelete = isCurrentlyActiveSwipe && activeSwipe.isSwiping;
              const isSectionActive = section.id === activeSectionId && !isBeingSwipedForDelete;
              const showDropGapBefore = dragOverItemId === section.id && draggedItemId !== section.id && !isBeingSwipedForDelete;

              return (
                <React.Fragment key={section.id}>
                  {/* Drop gap indicator */}
                  {showDropGapBefore && (
                    <div className="h-2 sm:h-3 transition-all duration-150">
                      <div className="h-full w-full rounded-full bg-primary/40"></div>
                    </div>
                  )}
                  
                <div
                  ref={el => sectionItemRefs.current[section.id] = el}
                  data-section-id={section.id}
                  className={cn(
                    "relative rounded-lg overflow-visible transition-all duration-200", 
                    'border-l-4',
                    draggedItemId === section.id && !isBeingSwipedForDelete ? 'opacity-50 scale-95' : '',
                    isSectionActive ? 'ring-2 ring-primary ring-offset-4 ring-offset-background shadow-lg' : 'shadow-sm'
                  )}
                  style={{ borderColor: section.color }}
                  draggable={!(isBeingSwipedForDelete || isBeingDeleted)} // Prevent drag while swiping or deleting
                  onDragStart={(e) => {
                    if (isBeingSwipedForDelete || isBeingDeleted) { e.preventDefault(); return; }
                    handleDragStart(e, section.id);
                  }}
                  onDragEnd={isBeingSwipedForDelete || isBeingDeleted ? undefined : handleDragEnd}
                  onDragOver={(e) => {
                     if (isBeingSwipedForDelete || isBeingDeleted) { e.preventDefault(); return; }
                     handleDragOver(e, section.id);
                  }}
                  onDragEnter={(e) => {
                     if (isBeingSwipedForDelete || isBeingDeleted) { e.preventDefault(); return; }
                     handleDragEnter(e, section.id);
                  }}
                  onDragLeave={isBeingSwipedForDelete || isBeingDeleted ? undefined : handleDragLeave}
                  onDrop={(e) => {
                     if (isBeingSwipedForDelete || isBeingDeleted) { e.preventDefault(); return; }
                     handleDrop(e, section.id);
                  }}
                >
                  <div className={cn(
                    "absolute inset-0 bg-destructive text-destructive-foreground flex items-center justify-start px-6 transition-opacity duration-200 z-0 rounded-md", 
                    showDeleteIndicator ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}>
                    <Trash2 className="h-6 w-6" />
                  </div>

                  <div
                    onMouseDown={(e) => handleMouseDownForSwipe(e, section.id)}
                    onTouchStart={(e) => handleTouchStart(e, section.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => handleSectionCardClick(section.id)}
                    className={cn(
                      "relative p-3 sm:p-4 flex items-center justify-between z-10 rounded-md select-none", 
                      "bg-background",
                      (draggedItemId === section.id && !isBeingSwipedForDelete) || isBeingDeleted 
                        ? 'opacity-50 scale-95' 
                        : '',
                      isBeingDeleted 
                        ? 'animate-slide-out-delete' 
                        : (!isBeingSwipedForDelete && !isBeingDeleted 
                            ? 'transition-transform duration-300 ease-out' 
                            : ''),
                      (!isBeingSwipedForDelete && !isBeingDeleted) 
                        ? 'cursor-grab'
                        : ''
                    )}
                    style={{
                      backgroundColor: `${section.color}20`, 
                      transform: `translateX(${currentOffset}px)`,
                    }}
                  >
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-base sm:text-lg truncate" style={{ color: section.color }}>{section.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate whitespace-normal">
                        {section.measures} bars | {getTempoDisplay(section)}
                      </p>
                       <p className="text-xs sm:text-sm text-muted-foreground truncate whitespace-normal">
                         {getBeatsDisplay(section.timeSignature)} | {section.subdivision} Note
                       </p>
                    </div>
                    <div className="flex items-center space-x-0.5 sm:space-x-1 flex-shrink-0 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={(e) => handleToggleSectionLoop(e, section)} title={section.isLoopable ? "Disable section loop" : "Enable section loop"}>
                        <Repeat className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", section.isLoopable ? "text-primary" : "text-muted-foreground")} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={(e) => { e.stopPropagation(); handleEditSectionClick(section);}} title="Edit Section">
                        <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                </React.Fragment>
              );
            })}
            {/* Drop zone at end */}
            {draggedItemId && (
              <div
                className="h-2 sm:h-3 transition-all duration-150"
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropZone('after-all'); setDragOverItemId(null); }}
                onDragEnter={(e) => { e.preventDefault(); setDropZone('after-all'); setDragOverItemId(null); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropZone(null); }}
                onDrop={(e) => handleDropZoneDrop(e, 'after-all')}
              >
                {dropZone === 'after-all' && (
                  <div className="h-full w-full rounded-full bg-primary/40"></div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
        )}
      </div>
      {isModalOpen && (
        <SectionEditorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          section={editingSection}
        />
      )}
    </div>
  );
};

export default TempoSectionList;
    
