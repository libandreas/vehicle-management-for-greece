import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../contexts/TranslationContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { supabase } from '../../forlang/src/lib/supabase'; // Make sure supabase is imported
import { highlightElement, cleanupHighlighters } from '../utils/highlighter';

// --- Style Definitions ---
const styles = {
  // Page & Controls
  pageContainer: { padding: '0px' },
  crudControlsBar: { display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px', position: 'relative' },
  pageTitle: { margin: 0, fontSize: '1.6em', color: 'var(--text-dark)', fontWeight: '600', flex: 1, textAlign: 'center' },
  actionsToolBar: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', alignItems: 'center' },
  actionButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 15px', fontSize: '0.9em' },
  printContainer: { marginTop: '20px' },
  printButton: { display: 'inline-flex', alignItems: 'center', gap: '8px' },

  // Table
  tableResponsiveContainer: { 
    overflowX: 'auto'
  },
  
  // ====================================================================================
  // FIX: Changed width to 'auto' to let the table size itself based on its content.
  // Added minWidth to ensure it doesn't get narrower than its container, which looks better.
  // ====================================================================================
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { position: 'relative', padding: '10px 12px', textAlign: 'left', backgroundColor: 'var(--table-header-bg, var(--background-dark))', color: 'var(--table-header-text, var(--text-dark))', borderBottom: '2px solid var(--primary-color)', fontSize: '0.9em', fontWeight: '600', whiteSpace: 'nowrap', verticalAlign: 'middle' },
  thContent: { display: 'flex', alignItems: 'center', gap: '8px' },
  thCheckbox: { padding: '10px 8px', width: '40px', textAlign: 'center' },
  td: { padding: '8px 12px', fontSize: '0.85em', verticalAlign: 'middle' },
  tdCheckbox: { padding: '8px', textAlign: 'center' },
  textCenter: { textAlign: 'center' },
  noDataRow: { textAlign: 'center', padding: '20px', color: 'var(--text-color-muted)', fontSize: '1em', borderTop: '1px solid var(--border-color)' },
  actionCell: { textAlign: 'center', whiteSpace: 'nowrap', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' },
  iconButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px 6px', fontSize: '0.8em', lineHeight: '1' },
  sortableHeader: { cursor: 'pointer', userSelect: 'none' },

  // Table Icons
  thIcons: { display: 'flex', gap: '4px', color: 'var(--text-color-muted)' },
  thIcon: { cursor: 'pointer', transition: 'color 0.2s' },
  thIconHover: { color: 'var(--primary-color)' },
  filterIconActive: { color: 'var(--primary-color, #007bff)' },

  // Search Row
  searchRow: { backgroundColor: 'var(--table-header-bg, var(--background-dark))' },
  searchInputContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: { width: '100%', padding: '4px 24px 4px 8px', fontSize: '0.8em', border: '1px solid var(--border-color, #dee2e6)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #fff)', color: 'var(--input-text-color)' },
  clearSearchButton: { position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-color-muted)', padding: '0', lineHeight: '1', fontSize: '16px' },

  // State Messages
  loadingMessage: { padding: '25px', textAlign: 'center', fontSize: '1.1em', color: 'var(--text-color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  errorMessage: { padding: '25px', textAlign: 'center', fontSize: '1em', color: 'var(--danger-color, #dc3545)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  retryButton: { marginTop: '10px' },
  
  // Generic Modal Styles
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 },
  modalContent: { background: 'var(--main-content-bg, #fff)', color: 'var(--text-dark, #212529)', padding: '0', borderRadius: '12px', width: '95%', maxWidth: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', border: '1px solid var(--border-color, #dee2e6)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color, #dee2e6)', padding: '15px 20px' },
  modalTitle: { margin: 0, fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-dark, #212529)', display: 'flex', alignItems: 'center', gap: '10px' },
  modalCloseButton: { background: 'transparent', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-color-muted)', padding: '0 5px', lineHeight: 1, transition: 'color 0.2s ease' },
  modalCloseButtonHover: { color: 'var(--text-dark)' },
  modalBody: { padding: '20px 25px', lineHeight: '1.6', fontSize: '1rem' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px 20px', backgroundColor: 'var(--background-dark, #f8f9fa)', borderTop: '1px solid var(--border-color, #dee2e6)' },
  
  // *** NEW/IMPROVED: Settings Modal Styles ***
  settingsModalContent: { padding: '25px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' },
  settingsModalHeader: { paddingBottom: '15px', marginBottom: '10px' },
  settingsModalBody: { flex: '1 1 auto', overflowY: 'auto', paddingRight: '15px', marginRight: '-15px' },
  // FIX: Reduced margins for compactness
  modalSectionTitle: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px', marginBottom: '10px', fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color, #007bff)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' },
  modalSectionTitleIcon: { fontSize: '1rem' },
  // FIX: Reduced gap for compactness
  modalCheckboxGroup: { display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '5px' },
  modalCheckboxItem: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', cursor: 'pointer', color: 'var(--text-dark)' },
  // FIX: Reduced margins for compactness
  modalHr: { border: 'none', borderTop: '1px solid var(--border-color)', margin: '15px 0' },
  
  // FIX: Reduced padding for compactness
  modalColumnManagerItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '4px 5px', borderRadius: '4px', transition: 'background-color 0.2s' },
  modalColumnManagerItemHover: { backgroundColor: 'var(--background-dark)' },
  modalColumnManagerLabel: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer', fontSize: '0.95rem' },
  modalColumnAlignControls: { display: 'flex', gap: '5px' },
  modalAlignButton: { background: 'var(--background-dark)', border: '1px solid transparent', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-color-muted)', transition: 'all 0.2s' },
  modalAlignButtonActive: { background: 'var(--primary-color)', color: 'var(--text-light)', borderColor: 'var(--primary-color)' },
  
  // Button Styles
  btnWarning: { backgroundColor: 'var(--warning-color, #ffc107)', color: 'var(--dark-color, #212529)', border: 'none' },
  btnSuccess: { backgroundColor: 'var(--success-color, #198754)', color: 'var(--white-color, #fff)', border: 'none' },
};

// --- Built-in SVG Icon Components ---
const SortIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"> <path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L3.5 3.707V12.5zm10-9a.5.5 0 0 1 .5.5v8.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L12.5 12.293V3.5a.5.5 0 0 1 .5-.5z"/> </svg> );
const SortAscIcon = ({ style }) => ( <svg style={{...style, color: 'var(--primary-color, #007bff)'}} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"> <path d="M7.247 4.86l-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/> </svg> );
const SortDescIcon = ({ style }) => ( <svg style={{...style, color: 'var(--primary-color, #007bff)'}} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"> <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/> </svg> );
const FilterIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"> <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/> </svg> );
const ResizeHandleIcon = ({ style, autoFit = false }) => (
  <div style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', transform: 'scale(1.2)' }}>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
      <div style={{ width: '1.5px', height: '12px', backgroundColor: 'currentColor' }} />
      <div style={{ 
        position: 'absolute', left: '3px', top: '50%', transform: 'translateY(-50%)',
        width: '0', height: '0', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderRight: '4px solid currentColor'
      }} />
      <div style={{ 
        position: 'absolute', right: '3px', top: '50%', transform: 'translateY(-50%)',
        width: '0', height: '0', borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: '4px solid currentColor'
      }} />
    </div>
    {autoFit && <div style={{ width: '8px', height: '1.5px', backgroundColor: 'var(--primary-color)', borderRadius: '1px' }} />}
  </div>
);
const HelpIcon = ({ style }) => ( <svg style={style} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"> <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/> <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/> </svg> );
const ResizeHandle = ({ style, onMouseDown, onDoubleClick, columnKey, autoFitColumns = [] }) => ( 
  <div 
    className="sct-resize-handle"
    style={{
      ...style,
      width: '8px',
      height: '20px',
      cursor: 'col-resize',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      right: '0px',
      top: '50%',
      transform: 'translateY(-50%)',
      userSelect: 'none',
      color: 'var(--primary-color, #007bff)',
      transition: 'color 0.2s ease, opacity 0.2s ease',
      zIndex: 10
    }}
    onMouseDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onMouseDown(e);
    }}
    onDoubleClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onDoubleClick(e);
    }}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
    title="Drag to resize column | Double-click to auto-fit"
  >
    {/* Vertical bar with left-right arrows */}
    <div style={{ 
      position: 'relative',
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: autoFitColumns.includes(columnKey) ? '2px' : '0'
    }}>
      {/* Vertical bar */}
      <div style={{ 
        width: '1px', 
        height: '12px', 
        backgroundColor: 'currentColor'
      }} />
      
      {/* Left arrow */}
      <div style={{ 
        position: 'absolute',
        left: '-3px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '0',
        height: '0',
        borderTop: '2px solid transparent',
        borderBottom: '2px solid transparent',
        borderRight: '3px solid currentColor'
      }} />
      
      {/* Right arrow */}
      <div style={{ 
        position: 'absolute',
        right: '-3px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '0',
        height: '0',
        borderTop: '2px solid transparent',
        borderBottom: '2px solid transparent',
        borderLeft: '3px solid currentColor'
      }} />
    </div>
    
    {/* Auto-fit indicator - small horizontal bar */}
    {autoFitColumns.includes(columnKey) && (
      <div 
        style={{
          width: '6px',
          height: '1px',
          backgroundColor: 'var(--primary-color, #007bff)',
          borderRadius: '0.5px',
          marginTop: '1px'
        }}
      />
    )}
  </div>
);

// --- Helper Components for States (Loading, Error) ---
const LoadingState = ({ message }) => ( <div style={styles.loadingMessage}> <i className="fas fa-spinner fa-spin"></i> <span>{message}</span> </div> );
const ErrorState = ({ message, onRetry, retryMessage }) => ( <div style={styles.errorMessage}> <div> <div> <i className="fas fa-exclamation-triangle"></i> {message} </div> {onRetry && ( <button onClick={onRetry} className="btn btn-sm btn-outline-secondary" style={styles.retryButton}> {retryMessage} </button> )} </div> </div> );

// --- Interactive Help Modal Component ---
function HelpModal({ isOpen, onClose, tableRef }) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0, width: 0 });

  const helpSteps = [
    {
      title: t('tableHelp.sorting.title', 'Sorting Features'),
      description: t('tableHelp.sorting.description', 'Click on any column header to sort the data. Use the sorting icons to see the current sort direction.'),
      icon: 'fas fa-sort-amount-up-alt',
      highlight: { 
        selector: '.sct-sort-icon-wrapper', 
        options: { type: 'icon', padding: 3 } 
      },
      visualIcons: [
        { icon: <SortIcon style={{ color: 'var(--text-color-muted)' }} />, label: t('tableHelp.sorting.iconDefault', 'Default') },
        { icon: <SortAscIcon />, label: t('tableHelp.sorting.iconAscending', 'Ascending') },
        { icon: <SortDescIcon />, label: t('tableHelp.sorting.iconDescending', 'Descending') }
      ],
      details: [
        t('tableHelp.sorting.detail1', '• Click header once for ascending sort.'),
        t('tableHelp.sorting.detail2', '• Click again for descending sort.'),
        t('tableHelp.sorting.detail3', '• Click a third time to remove sorting.'),
        t('tableHelp.sorting.detail4', '• The arrow icon shows the current sort direction.')
      ]
    },
    {
      title: t('tableHelp.filtering.title', 'Search & Filtering'),
      description: t('tableHelp.filtering.description', 'Use the filter icon to show/hide search fields. Type in any search field to filter the data in real-time.'),
      icon: 'fas fa-search',
      highlight: { 
        selector: '.sct-filter-icon, .sct-search-row', 
        options: { type: 'subtle', padding: 3, radius: 4 } 
      },
      visualIcons: [
        { icon: <FilterIcon style={{ color: 'var(--text-color-muted)' }} />, label: t('tableHelp.filtering.iconFilter', 'Filter') },
        { icon: <FilterIcon style={{ color: 'var(--primary-color)' }} />, label: t('tableHelp.filtering.iconActive', 'Active') }
      ],
      details: [
        t('tableHelp.filtering.detail1', '• Click the filter icon (≡) to toggle the search row.'),
        t('tableHelp.filtering.detail2', '• Type in the search fields to filter data instantly.'),
        t('tableHelp.filtering.detail3', '• Click the × in a field to clear that specific search.'),
        t('tableHelp.filtering.detail4', '• Use the "Clear Filters" button to reset all searches at once.')
      ]
    },
    {
      title: t('tableHelp.columns.title', 'Adjustable Columns'),
      description: t('tableHelp.columns.description', 'Drag the resize handles to adjust column widths, or double-click to auto-fit content.'),
      icon: 'fas fa-arrows-alt-h',
      highlight: { 
        selector: '.sct-resize-handle', 
        options: { type: 'button', padding: 8, radius: 2 } 
      },
      visualIcons: [
        { 
          icon: <ResizeHandleIcon style={{ color: 'var(--text-color-muted)' }} />, 
          label: t('tableHelp.columns.iconResize', 'Resize') 
        },
        { 
          icon: <ResizeHandleIcon style={{ color: 'var(--primary-color)' }} autoFit={true} />, 
          label: t('tableHelp.columns.iconAutoFit', 'Auto-Fit') 
        }
      ],
      details: [
        t('tableHelp.columns.detail1', '• The resize handle appears on the right edge of headers.'),
        t('tableHelp.columns.detail2', '• Drag the handle to manually resize the column.'),
        t('tableHelp.columns.detail3', '• Double-click the handle to auto-fit the column to its content.'),
        t('tableHelp.columns.detail4', '• A blue line indicates a column has been auto-fitted.')
      ]
    },
    {
      title: t('tableHelp.settings.title', 'Table Settings'),
      description: t('tableHelp.settings.description', 'Access advanced options through the settings button to customize your table view.'),
      icon: 'fas fa-cog',
      highlight: { 
        selector: '.sct-settings-btn', 
        options: { type: 'button', padding: 4, radius: 6 } 
      },
      visualIcons: [
        { icon: <i className="fas fa-cog" style={{ color: 'var(--text-color-muted)', fontSize: '16px' }}></i>, label: t('tableHelp.settings.iconSettings', 'Settings') },
        { icon: <i className="fas fa-columns" style={{ color: 'var(--primary-color)', fontSize: '16px' }}></i>, label: t('tableHelp.settings.iconColumns', 'Columns') },
        { icon: <i className="fas fa-sliders-h" style={{ color: 'var(--primary-color)', fontSize: '16px' }}></i>, label: t('tableHelp.settings.iconDisplay', 'Display') }
      ],
      details: [
        t('tableHelp.settings.detail1', '• Hide or show columns based on your needs.'),
        t('tableHelp.settings.detail2', '• Toggle indicators for sorting and filtering.'),
        t('tableHelp.settings.detail3', '• Adjust the text alignment for columns.'),
        t('tableHelp.settings.detail4', '• Control the visibility of the actions column.')
      ]
    }
  ];
  
  // Calculate modal position relative to table
  useEffect(() => {
    if (isOpen && tableRef.current) {
      const tableRect = tableRef.current.getBoundingClientRect();
      setModalPosition({
        top: Math.max(20, tableRect.top - 280), // Position above table, but minimum 20px from top
        left: tableRect.left,
        width: tableRect.width
      });
    }
  }, [isOpen, tableRef]);

  // This useEffect hook handles the highlighting logic for the help modal.
  useEffect(() => {
    cleanupHighlighters();
    if (isOpen) {
      // Add class to body to create space above table
      document.body.classList.add('sct-help-modal-open');
      
      // Wait for margin transition to complete, then apply highlighting
      setTimeout(() => {
        const currentHighlight = helpSteps[currentStep]?.highlight;
        if (currentHighlight) {
          highlightElement(currentHighlight.selector, currentHighlight.options);
        }
      }, 450); // Wait for 400ms margin transition + 50ms buffer
    } else {
      // Remove class when modal is closed
      document.body.classList.remove('sct-help-modal-open');
    }
    return () => {
      cleanupHighlighters();
      // Cleanup: remove class on unmount
      document.body.classList.remove('sct-help-modal-open');
    };
  }, [isOpen, currentStep]);

  const nextStep = () => {
    if (currentStep < helpSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeModal = () => {
    setCurrentStep(0);
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = helpSteps[currentStep];

  return createPortal(
    <>
      <style>{`
        /* Smart modal positioning - create space above the table */
        body.sct-help-modal-open .print-section {
          margin-top: 280px;
          transition: margin-top 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Reset margin when modal is closed */
        body:not(.sct-help-modal-open) .print-section {
          margin-top: 0;
          transition: margin-top 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Create backdrop blur overlay */
        body.sct-help-modal-open::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          backdrop-filter: blur(3px);
          background-color: rgba(0, 0, 0, 0.1);
          z-index: 9000;
          transition: backdrop-filter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Ensure CRUD table and modal are above the backdrop */
        body.sct-help-modal-open .print-section {
          position: relative;
          z-index: 9500;
        }

        body.sct-help-modal-open [class*="sct-help-modal"] {
          z-index: 10000;
        }

        /* Modal positioned above the table content */
        .sct-help-modal-positioned {
          position: fixed;
          z-index: 10000;
          height: 280px;
        }

        /* --- Reusable Help Highlighter System --- */
        .help-highlighter-overlay {
          position: fixed;
          pointer-events: none;
          z-index: 9997;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 6px;
        }

        /* Golden highlights for icons and buttons - draws attention */
        .help-highlighter-overlay--icon {
          animation: help-pulse-icon 1.8s infinite;
          box-shadow: 0 0 12px 3px rgba(255, 193, 7, 0.8);
          border: 1px solid rgba(255, 193, 7, 0.5);
          background-color: rgba(255, 193, 7, 0.2);
          border-radius: 50%;
        }

        .help-highlighter-overlay--button {
          animation: help-pulse-button 1.8s infinite;
          box-shadow: 0 0 15px 4px rgba(255, 193, 7, 0.7);
          border: 2px solid rgba(255, 193, 7, 0.6);
          background-color: rgba(255, 193, 7, 0.15);
        }

        .help-highlighter-overlay--subtle {
          animation: help-pulse-subtle 2s infinite;
          box-shadow: 0 0 8px 2px rgba(255, 193, 7, 0.5);
          border: 1px solid rgba(255, 193, 7, 0.4);
          background-color: rgba(255, 193, 7, 0.1);
        }
        
        /* Blue highlights for layout elements - less intrusive */
        .help-highlighter-overlay--column {
          animation: help-pulse-column 1.8s infinite;
          background-color: rgba(0, 123, 255, 0.15);
          border: 1.5px solid rgba(0, 123, 255, 0.6);
          box-shadow: 0 0 15px 4px rgba(0, 123, 255, 0.4);
        }

        /* Default blue highlight */
        .help-highlighter-overlay--glow {
          animation: help-pulse-glow 1.8s infinite;
          background-color: rgba(0, 123, 255, 0.15);
          border: 1.5px solid rgba(0, 123, 255, 0.6);
          box-shadow: 0 0 15px 4px rgba(0, 123, 255, 0.4);
        }
        
        @keyframes help-pulse-icon {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 12px 3px rgba(255, 193, 7, 0.8);
          }
          50% {
            transform: scale(1.15);
            box-shadow: 0 0 20px 6px rgba(255, 193, 7, 1);
          }
        }

        @keyframes help-pulse-button {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 15px 4px rgba(255, 193, 7, 0.7);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 25px 8px rgba(255, 193, 7, 0.9);
          }
        }

        @keyframes help-pulse-subtle {
          0%, 100% {
            box-shadow: 0 0 8px 2px rgba(255, 193, 7, 0.5);
          }
          50% {
            box-shadow: 0 0 12px 3px rgba(255, 193, 7, 0.7);
          }
        }

        @keyframes help-pulse-column {
          0%, 100% {
            box-shadow: 0 0 15px 4px rgba(0, 123, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 22px 7px rgba(0, 123, 255, 0.6);
          }
        }

        @keyframes help-pulse-glow {
          0%, 100% {
            box-shadow: 0 0 15px 4px rgba(0, 123, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 22px 7px rgba(0, 123, 255, 0.6);
          }
        }
      `}</style>
      <div className="sct-help-modal-positioned" style={{
        top: modalPosition.top,
        left: modalPosition.left,
        width: modalPosition.width,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '20px',
        backgroundColor: 'transparent'
      }} onClick={closeModal}>
        <div style={{
          ...styles.modalContent,
          maxWidth: '700px',
          width: '95%'
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{...styles.modalHeader, padding: '12px 18px'}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className={currentStepData.icon} style={{ color: 'var(--primary-color, #007bff)', fontSize: '1.3rem' }}></i>
              <h5 style={{ ...styles.modalTitle, fontSize: '1.2rem', margin: 0 }}>{currentStepData.title}</h5>
            </div>
            <button
              style={{ ...styles.modalCloseButton, ...(isCloseHovered ? styles.modalCloseButtonHover : {}) }}
              onClick={closeModal}
              onMouseEnter={() => setIsCloseHovered(true)}
              onMouseLeave={() => setIsCloseHovered(false)}
            >×</button>
          </div>
          
          <div style={{
            padding: '18px 20px',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: 'var(--background-light, #f8f9fa)',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '15px',
              borderLeft: '3px solid var(--primary-color, #007bff)'
            }}>
              <p style={{
                fontSize: '1rem',
                lineHeight: '1.5',
                margin: '0 0 12px 0',
                color: 'var(--text-dark, #212529)'
              }}>
                {currentStepData.description}
              </p>
              
              {/* Visual Icons Section */}
              {currentStepData.visualIcons && (
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  marginBottom: '12px',
                  padding: '10px',
                  backgroundColor: 'var(--main-content-bg, #fff)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color, #dee2e6)',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {currentStepData.visualIcons.map((iconData, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'var(--background-light, #f8f9fa)',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color, #dee2e6)'
                      }}>
                        {iconData.icon}
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-color-secondary, #6c757d)',
                        textAlign: 'center'
                      }}>
                        {iconData.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <ul style={{
                margin: 0,
                paddingLeft: '0',
                listStyle: 'none'
              }}>
                {currentStepData.details.map((detail, index) => (
                  <li key={index} style={{
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    marginBottom: '6px',
                    color: 'var(--text-color-secondary, #6c757d)'
                  }}>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>

            {/* Step Progress */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '15px'
            }}>
              {helpSteps.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: index === currentStep ? 'var(--primary-color, #007bff)' : 'var(--border-color, #dee2e6)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>

            {/* Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'auto'
            }}>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                style={{ opacity: currentStep === 0 ? 0.5 : 1 }}
              >
                <i className="fas fa-chevron-left"></i> {t('tableHelp.navigation.previous', 'Previous')}
              </button>

              <span style={{
                fontSize: '0.85rem',
                color: 'var(--text-color-muted, #6c757d)'
              }}>
                {currentStep + 1} / {helpSteps.length}
              </span>

              {currentStep < helpSteps.length - 1 ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={nextStep}
                >
                  {t('tableHelp.navigation.next', 'Next')} <i className="fas fa-chevron-right"></i>
                </button>
              ) : (
                <button
                  className="btn btn-success btn-sm"
                  onClick={closeModal}
                >
                  <i className="fas fa-check"></i> {t('tableHelp.navigation.finish', 'Got it!')}
                </button>
              )}
            </div>
          </div>
        </div>
              </div>
      </>,
      document.body
    );
  }

// --- NEW/IMPROVED: Settings Modal Component ---
function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  columnConfigs, // Use the new state
  onColumnConfigChange, // Use the new handler
  visibleColumnKeys,
  onVisibleColumnsChange,
  showActionsColumn,
  onShowActionsColumnChange,
}) {
    const { t } = useTranslation();
    const [isCloseHovered, setIsCloseHovered] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);

    if (!isOpen) return null;

    const handleColumnVisibilityChange = (columnKey, isVisible) => {
      const newVisibleKeys = new Set(visibleColumnKeys);
      if (isVisible) newVisibleKeys.add(columnKey);
      else newVisibleKeys.delete(columnKey);
      
      const orderedVisibleKeys = columnConfigs.filter(col => newVisibleKeys.has(col.key)).map(col => col.key);
      onVisibleColumnsChange(orderedVisibleKeys);
    };

    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={{ ...styles.modalContent, ...styles.settingsModalContent }} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, ...styles.settingsModalHeader }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <i className="fas fa-cog" style={{ color: 'var(--primary-color, #007bff)', fontSize: '1.5rem' }}></i>
                <h5 style={{ ...styles.modalTitle, fontSize: '1.4rem' }}>{t('tableSettings.title', 'Table Settings')}</h5>
              </div>
              <button
                style={{ ...styles.modalCloseButton, ...(isCloseHovered ? styles.modalCloseButtonHover : {}) }}
                onClick={onClose}
                onMouseEnter={() => setIsCloseHovered(true)}
                onMouseLeave={() => setIsCloseHovered(false)}
              >×</button>
            </div>
            
            <div style={styles.settingsModalBody}>
              <div style={styles.modalSectionTitle}>
                <i className="fas fa-sliders-h" style={styles.modalSectionTitleIcon}></i>
                {t('tableSettings.displayOptions', 'Display Options')}
              </div>
              <div style={styles.modalCheckboxGroup}>
                <label style={styles.modalCheckboxItem}>
                  <input type="checkbox" checked={settings.showOrdering} onChange={(e) => onSettingsChange({ ...settings, showOrdering: e.target.checked })} />
                  {t('tableSettings.showOrdering', 'Show Ordering Indicators')}
                </label>
                <label style={styles.modalCheckboxItem}>
                  <input type="checkbox" checked={settings.showFiltering} onChange={(e) => onSettingsChange({ ...settings, showFiltering: e.target.checked })} />
                  {t('tableSettings.showFiltering', 'Show Filtering Indicators')}
                </label>
                <label style={styles.modalCheckboxItem}>
                  <input type="checkbox" checked={settings.showSearchRow} onChange={(e) => onSettingsChange({ ...settings, showSearchRow: e.target.checked })} />
                  {t('tableSettings.showSearchRow', 'Show Search Row')}
                </label>
              </div>

              <div style={styles.modalSectionTitle}>
                <i className="fas fa-columns" style={styles.modalSectionTitleIcon}></i>
                {t('tableSettings.manageColumns', 'Manage Columns')}
              </div>
              <div style={styles.modalCheckboxGroup}>
                {columnConfigs.map(col => (
                  <div
                    key={col.key}
                    style={{ ...styles.modalColumnManagerItem, ...(hoveredItem === col.key ? styles.modalColumnManagerItemHover : {}) }}
                    onMouseEnter={() => setHoveredItem(col.key)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <label style={styles.modalColumnManagerLabel}>
                      <input type="checkbox" checked={visibleColumnKeys.includes(col.key)} onChange={(e) => handleColumnVisibilityChange(col.key, e.target.checked)} />
                      {col.header}
                    </label>
                    <div style={styles.modalColumnAlignControls}>
                      <button
                        style={{ ...styles.modalAlignButton, ...(col.textAlign === 'left' ? styles.modalAlignButtonActive : {}) }}
                        onClick={() => onColumnConfigChange(col.key, { textAlign: 'left' })}
                        title={t('tableSettings.alignLeft', 'Align Left')}
                      >
                        <i className="fas fa-align-left"></i>
                      </button>
                      <button
                        style={{ ...styles.modalAlignButton, ...(col.textAlign === 'center' ? styles.modalAlignButtonActive : {}) }}
                        onClick={() => onColumnConfigChange(col.key, { textAlign: 'center' })}
                        title={t('tableSettings.alignCenter', 'Align Center')}
                      >
                        <i className="fas fa-align-center"></i>
                      </button>
                    </div>
                  </div>
                ))}
                <hr style={styles.modalHr} />
                <label style={styles.modalCheckboxItem}>
                  <input type="checkbox" checked={showActionsColumn} onChange={(e) => onShowActionsColumnChange(e.target.checked)} />
                  {t('tableSettings.showActionsColumn', 'Show Actions Column')}
                </label>
              </div>
            </div>
        </div>
      </div>
    );
}

// Self-contained Confirmation Dialog component
function ConfirmationDialog({ isOpen, onCancel, onConfirm, message, title, confirmText, cancelText }) {
  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h5 style={styles.modalTitle}>
            <i className="fas fa-exclamation-triangle" style={{ color: 'var(--button-warning-bg)' }}></i>
            {title}
          </h5>
        </div>
        <div style={styles.modalBody}>
          <p style={{ margin: 0 }}>{message}</p>
        </div>
        <div style={styles.modalFooter}>
          <button className="btn btn-secondary" onClick={onCancel}> {cancelText} </button>
          <button className="btn btn-danger" onClick={onConfirm}> {confirmText} </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced FormModal component with section support
function SmartFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  titleKey,
  icon, 
  fields = [], 
  submitButtonText = "Save",
  isSubmitting = false,
  initialData = null,
  submitError = null,
  onErrorDismiss = null,
  getNewRecordData,
}) {
  const { t } = useTranslation();
  
  // Get the actual title - prioritize titleKey over title
  const modalTitle = titleKey ? t(titleKey) : title;
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Initialize form data
  const initializeForm = (dataToUse) => {
    const initialFormData = {};
    fields.forEach(field => {
      if (field.type === 'section') return; // Skip sections
      initialFormData[field.name] = dataToUse?.[field.name] ?? field.defaultValue ?? '';
    });
    setFormData(initialFormData);
    setErrors({});
  };

  useEffect(() => {
    if (isOpen) {
      initializeForm(initialData);
    }
  }, [isOpen, initialData, fields]);

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
    if (submitError && onErrorDismiss) {
      onErrorDismiss();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    fields.forEach(field => {
      if (field.type === 'section') return; // Skip sections
      const value = formData[field.name];
      if (field.required && (!value || value.toString().trim() === '')) {
        const fieldLabel = field.labelKey ? t(field.labelKey) : field.label;
        newErrors[field.name] = field.requiredMessage || `${fieldLabel} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const processedData = {};
    fields.forEach(field => {
      if (field.type === 'section') return; // Skip sections
      let value = formData[field.name];
      if (field.type === 'number' && value !== '') value = Number(value);
      else if (field.type === 'checkbox') value = Boolean(value);
      else if (typeof value === 'string') value = value.trim();
      processedData[field.name] = value;
    });
    
    onSubmit(processedData);
  };

  const renderField = (field) => {
    const fieldValue = formData[field.name] ?? '';
    const hasError = errors[field.name];
    
          const fieldProps = {
        id: field.name,
        value: fieldValue,
        placeholder: field.placeholderKey ? t(field.placeholderKey) : (field.placeholder ? t(field.placeholder) : ''),
        disabled: isSubmitting,
      style: { 
        padding: '10px 14px', 
        border: `1px solid ${hasError ? '#dc3545' : 'var(--border-color, #dee2e6)'}`,
        borderRadius: '6px',
        backgroundColor: 'var(--input-bg, #fff)',
        color: 'var(--input-text-color)',
        width: '100%',
        fontSize: '0.95rem',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
      }
    };

    const commonFieldStyles = {
      ...fieldProps.style,
      '&:focus': {
        borderColor: 'var(--primary-color, #007bff)',
        boxShadow: '0 0 0 2px rgba(0, 123, 255, 0.25)',
        outline: 'none'
      }
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input 
            {...fieldProps} 
            type={field.type} 
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color, #007bff)';
              e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = hasError ? '#dc3545' : 'var(--border-color, #dee2e6)';
              e.target.style.boxShadow = 'none';
            }}
          />
        );
      case 'number':
        return (
          <input 
            {...fieldProps} 
            type="number" 
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color, #007bff)';
              e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = hasError ? '#dc3545' : 'var(--border-color, #dee2e6)';
              e.target.style.boxShadow = 'none';
            }}
          />
        );
      case 'textarea':
        return (
          <textarea 
            {...fieldProps} 
            rows={field.rows || 3} 
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color, #007bff)';
              e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = hasError ? '#dc3545' : 'var(--border-color, #dee2e6)';
              e.target.style.boxShadow = 'none';
            }}
          />
        );
      case 'select':
        return (
          <select 
            {...fieldProps} 
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color, #007bff)';
              e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = hasError ? '#dc3545' : 'var(--border-color, #dee2e6)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="">{field.placeholderKey ? t(field.placeholderKey) : (field.placeholder ? t(field.placeholder) : 'Select...')}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.labelKey ? t(option.labelKey) : (option.translateLabel !== false ? t(option.label) : option.label)}
              </option>
            ))}
          </select>
        );
      case 'date':
        return (
          <DatePicker
            id={field.name}
            selected={fieldValue ? new Date(fieldValue) : null}
            onChange={(date) => handleFieldChange(field.name, date ? format(date, 'yyyy-MM-dd') : '')}
            dateFormat="dd / MM / yyyy"
            placeholderText={field.placeholderKey ? t(field.placeholderKey) : (field.placeholder ? t(field.placeholder) : '')}
            disabled={isSubmitting}
            showYearDropdown
            className={hasError ? 'error' : ''}
            style={{
              padding: '10px 14px',
              border: `1px solid ${hasError ? '#dc3545' : 'var(--border-color, #dee2e6)'}`,
              borderRadius: '6px',
              backgroundColor: 'var(--input-bg, #fff)',
              color: 'var(--input-text-color)',
              width: '100%',
              fontSize: '0.95rem',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
            }}
          />
        );
      case 'checkbox':
        return (
          <input 
            type="checkbox" 
            id={field.name}
            checked={Boolean(fieldValue)}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
            disabled={isSubmitting}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer'
            }}
          />
        );
      default:
        return (
          <input 
            {...fieldProps} 
            type="text" 
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color, #007bff)';
              e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = hasError ? '#dc3545' : 'var(--border-color, #dee2e6)';
              e.target.style.boxShadow = 'none';
            }}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{
        ...styles.modalContent, 
        maxWidth: '720px', 
        width: '90%',
        maxHeight: '85vh', 
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h5 style={styles.modalTitle}>
            {icon && <i className={icon}></i>}
            {modalTitle}
          </h5>
          <button style={styles.modalCloseButton} onClick={onClose} disabled={isSubmitting}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{
            padding: '24px 32px', 
            maxHeight: '60vh', 
            overflowY: 'auto',
            backgroundColor: 'var(--main-content-bg, #fff)'
          }}>
            {submitError && (
              <div style={{
                background: '#fee', border: '1px solid #fcc', borderRadius: '4px',
                padding: '12px', marginBottom: '20px', color: '#c33',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <i className="fas fa-exclamation-triangle"></i>
                <span>{submitError}</span>
                {onErrorDismiss && (
                  <button type="button" onClick={onErrorDismiss} style={{
                    background: 'none', border: 'none', color: '#c33', cursor: 'pointer',
                    marginLeft: 'auto', padding: '0 4px'
                  }}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            )}

            {fields.map((field, index) => {
              // Handle section headers
              if (field.type === 'section') {
                return (
                  <div 
                    key={`section-${index}`}
                    style={{
                      marginTop: index === 0 ? '0' : '32px',
                      marginBottom: '20px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid var(--border-color, #e9ecef)',
                      fontSize: '1.05rem',
                      fontWeight: '600',
                      color: 'var(--text-dark, #2c3e50)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      letterSpacing: '0.3px'
                    }}
                  >
                    {field.icon && <i className={field.icon} style={{
                      fontSize: '1rem',
                      color: 'var(--primary-color, #007bff)',
                      opacity: 0.8
                    }}></i>}
                    {field.labelKey ? t(field.labelKey) : field.label}
                  </div>
                );
              }

              // Handle regular form fields
              return (
                <div key={field.name} style={{
                  display: 'grid',
                  gridTemplateColumns: '200px 1fr',
                  gap: '16px',
                  alignItems: field.type === 'textarea' ? 'flex-start' : 'center',
                  marginBottom: '18px'
                }}>
                  {field.type === 'checkbox' ? (
                    <>
                      <div style={{gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '12px'}}>
                        {renderField(field)}
                        <label htmlFor={field.name} style={{
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '0.95rem'
                        }}>
                          {field.icon && <i className={field.icon} style={{marginRight: '6px'}}></i>} 
                          {field.labelKey ? t(field.labelKey) : field.label}
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <label htmlFor={field.name} style={{
                        fontWeight: '500',
                        fontSize: '0.95rem',
                        color: 'var(--text-dark, #495057)',
                        textAlign: 'right',
                        paddingTop: field.type === 'textarea' ? '12px' : '0'
                      }}>
                        {field.icon && <i className={field.icon} style={{marginRight: '6px', opacity: 0.7}}></i>}
                        {field.labelKey ? t(field.labelKey) : field.label}{field.required ? <span style={{color: '#dc3545', marginLeft: '2px'}}>*</span> : ''}
                      </label>
                      <div>
                        {renderField(field)}
                        {errors[field.name] && (
                          <div style={{
                            color: '#dc3545', 
                            fontSize: '0.85rem', 
                            marginTop: '6px',
                            fontWeight: '500'
                          }}>
                            {errors[field.name]}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div style={styles.modalFooter}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel', 'Άκυρο')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> {t('common.saving', 'Αποθήκευση...')}
                </>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- Main SmartCrudTable Component ---
function SmartCrudTable({
  config,
  // Keep other props for backwards compatibility or overrides
  data: staticData,
  isLoading: isLoadingProp,
  error: errorProp,
  onRetry: onRetryProp,
  ...otherProps
}) {
  const tableRef = React.useRef(null);
  const { 
    title, 
    tableName, 
    columns, 
    permissions = { create: true, read: true, update: true, delete: true }, 
    defaultSort = { column: 'created_at', direction: 'desc' },
    pageSize = 20,
    itemKey = 'id',
    emptyStateContent,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onCopyItem,
    onEditSelectedItem,
    onDeleteSelectedItems,
    onCopySelectedItem,
    customActions = [],
    customToolbarActions = [],
    formConfig = null,
    getNewRecordData,
    // External modal control props
    showFormModal: externalShowFormModal,
    onCloseFormModal: externalOnCloseFormModal,
    formInitialData: externalFormInitialData,
    formIsSubmitting: externalFormIsSubmitting,
    formSubmitError: externalFormSubmitError,
    onFormErrorDismiss: externalOnFormErrorDismiss,
  } = { ...config, ...otherProps };

  const { t } = useTranslation();
  
  // Memoize defaultSort to prevent infinite loops
  const memoizedDefaultSort = useMemo(() => defaultSort, [defaultSort?.column, defaultSort?.direction]);
  
  // --- Internal Data State ---
  const [data, setData] = useState(staticData || []);
  const [isLoading, setIsLoading] = useState(isLoadingProp !== undefined ? isLoadingProp : !!tableName);
  const [error, setError] = useState(errorProp || null);

  // Data fetching effect
  const fetchData = useCallback(async () => {
    if (!tableName) {
      setData(staticData || []);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase.from(tableName).select('*');
      
      if (memoizedDefaultSort && memoizedDefaultSort.column) {
        query = query.order(memoizedDefaultSort.column, { ascending: memoizedDefaultSort.direction === 'asc' });
      }
      
      const { data: fetchedData, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      setData(fetchedData || []);
    } catch (err) {
      console.error(`Error fetching data from ${tableName}:`, err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, memoizedDefaultSort, staticData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update data when staticData changes (for static mode)
  useEffect(() => {
    if (!tableName) {
      setData(staticData || []);
      // Use parent-provided loading/error states when in static mode
      if (isLoadingProp !== undefined) setIsLoading(isLoadingProp);
      if (errorProp !== undefined) setError(errorProp);
    }
  }, [staticData, tableName, isLoadingProp, errorProp]);

  const handleRetry = () => {
    if (onRetryProp) {
      onRetryProp();
    } else {
      fetchData();
    }
  };

  // Component State
  const [selectedItemIds, setSelectedItemIds] = useState(() => new Set());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchFilters, setSearchFilters] = useState({});
  
  // Confirmation Dialog State
  const [confirmationState, setConfirmationState] = useState({ isOpen: false, message: '', onConfirm: () => {} });
  
  // Table Visual Settings State
  const [visibleColumnKeys, setVisibleColumnKeys] = useState([]);
  const [showActionsColumn, setShowActionsColumn] = useState(true);
  const [tableSettings, setTableSettings] = useState({ showOrdering: true, showFiltering: true, showSearchRow: true });
  
  // *** NEW: Column configuration state (for visibility, alignment, etc.) ***
  const [columnConfigs, setColumnConfigs] = useState([]);
  
  // Column resizing state
  const [columnWidths, setColumnWidths] = useState({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [autoFitColumns, setAutoFitColumns] = useState(new Set()); // Track auto-fitted columns
  
  // Form Modal State - use external props if provided, otherwise use internal state
  const [internalShowFormModal, setInternalShowFormModal] = useState(false);
  const [internalFormInitialData, setInternalFormInitialData] = useState(null);
  const [internalFormIsSubmitting, setInternalFormIsSubmitting] = useState(false);
  const [internalFormSubmitError, setInternalFormSubmitError] = useState(null);
  
  // Use external props if provided, otherwise fall back to internal state
  const showFormModal = externalShowFormModal !== undefined ? externalShowFormModal : internalShowFormModal;
  const formInitialData = externalFormInitialData !== undefined ? externalFormInitialData : internalFormInitialData;
  const formIsSubmitting = externalFormIsSubmitting !== undefined ? externalFormIsSubmitting : internalFormIsSubmitting;
  const formSubmitError = externalFormSubmitError !== undefined ? externalFormSubmitError : internalFormSubmitError;

  // Initialize and update column configurations when props change
  useEffect(() => {
    const initialConfigs = columns.map(c => ({
      textAlign: 'left',
      ...c,
      // Use 'header' if it exists, otherwise fall back to 'label'
      header: c.header || c.label,
    }));
    setColumnConfigs(initialConfigs);
    
    const initialVisibleKeys = initialConfigs.filter(col => col.visible !== false).map(col => col.key);
    setVisibleColumnKeys(initialVisibleKeys);
  }, [columns]);

  const handleColumnConfigChange = useCallback((key, newConfig) => {
    setColumnConfigs(prev => prev.map(c => c.key === key ? { ...c, ...newConfig } : c));
  }, []);

  // Column resizing handlers
  const handleResizeStart = useCallback((e, columnKey) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizingColumn(columnKey);
    setStartX(e.clientX);
    
    // Get current width of the column
    const th = e.target.closest('th');
    const currentWidth = th ? th.getBoundingClientRect().width : 150;
    setStartWidth(currentWidth);
    
    // Add resizing class to body
    document.body.classList.add('sct-resizing');
  }, []);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !resizingColumn) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff); // Minimum width of 50px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
    
    // Remove from auto-fitted columns when manually resizing
    setAutoFitColumns(prev => {
      const newSet = new Set(prev);
      newSet.delete(resizingColumn);
      return newSet;
    });
  }, [isResizing, resizingColumn, startX, startWidth]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizingColumn(null);
    setStartX(0);
    setStartWidth(0);
    
    // Remove resizing class from body
    document.body.classList.remove('sct-resizing');
  }, []);



  // Add mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const showConfirmation = useCallback((message, onConfirmAction) => {
    setConfirmationState({ isOpen: true, message, onConfirm: () => onConfirmAction() });
  }, []);

  const handleConfirm = () => {
    confirmationState.onConfirm();
    setConfirmationState({ isOpen: false, message: '', onConfirm: () => {} });
  };

  const handleCancel = () => {
    setConfirmationState({ isOpen: false, message: '', onConfirm: () => {} });
  };

  // Form Modal Handlers
  const onCloseFormModal = () => {
    if (externalOnCloseFormModal) {
      externalOnCloseFormModal();
    } else {
      setInternalShowFormModal(false);
      setInternalFormInitialData(null);
      setInternalFormSubmitError(null);
    }
  };

  const onFormErrorDismiss = () => {
    if (externalOnFormErrorDismiss) {
      externalOnFormErrorDismiss();
    } else {
      setInternalFormSubmitError(null);
    }
  };

  const handleFormSubmit = async (formData) => {
    if (externalFormIsSubmitting === undefined) {
      setInternalFormIsSubmitting(true);
    }
    if (externalFormSubmitError === undefined) {
      setInternalFormSubmitError(null);
    }

    // If there is no custom onSubmit, perform default Supabase operation
    if (!formConfig?.onSubmit) {
      try {
        let finalData = { ...formData };
        let response;
        
        if (formInitialData) { // This is an UPDATE
          response = await supabase.from(tableName).update(finalData).eq(itemKey, formInitialData[itemKey]);
        } else { // This is a CREATE
          // Use getNewRecordData to add default/hidden values
          if (getNewRecordData) {
            finalData = { ...finalData, ...getNewRecordData() };
          }
          response = await supabase.from(tableName).insert(finalData);
        }

        const { error } = response;
        if (error) throw error;

        onCloseFormModal();
        fetchData(); // Refresh data

      } catch (err) {
        if (externalFormSubmitError === undefined) {
          setInternalFormSubmitError(err.message || 'An error occurred.');
        }
      } finally {
        if (externalFormIsSubmitting === undefined) {
          setInternalFormIsSubmitting(false);
        }
      }
      return;
    }
    
    // Logic for custom onSubmit prop (existing logic)
    try {
      // Pass the editing item (formInitialData) as the second parameter
      const result = await formConfig.onSubmit(formData, formInitialData);
      if (result && result.success !== false) {
        onCloseFormModal();
        // Refresh data if we have a table name
        if (tableName) {
          fetchData();
        }
      } else if (result && result.error) {
        if (externalFormSubmitError === undefined) {
          setInternalFormSubmitError(result.error);
        }
      }
    } catch (error) {
      if (externalFormSubmitError === undefined) {
        setInternalFormSubmitError(error.message || 'An error occurred while saving.');
      }
    } finally {
      if (externalFormIsSubmitting === undefined) {
        setInternalFormIsSubmitting(false);
      }
    }
  };

  const visibleColumns = useMemo(() => {
    const visibleSet = new Set(visibleColumnKeys);
    return columnConfigs.filter(col => visibleSet.has(col.key));
  }, [columnConfigs, visibleColumnKeys]);

  useEffect(() => {
    setSelectedItemIds(new Set());
  }, [data, searchFilters]);

  // *** NEW: Handle responsive padding for containers ***
  useEffect(() => {
    const handleResponsivePadding = () => {
      const isSmallScreen = window.innerWidth <= 480;
      
      if (isSmallScreen) {
        // Find all divs with 2rem padding and add responsive class
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(el => {
          const style = el.getAttribute('style') || '';
          if (style.includes('2rem') && style.includes('padding')) {
            el.classList.add('sct-mobile-padding-override');
          }
        });
      } else {
        // Remove responsive class on larger screens
        document.querySelectorAll('.sct-mobile-padding-override').forEach(el => {
          el.classList.remove('sct-mobile-padding-override');
        });
      }
    };
    
    // Check on mount and after a slight delay to ensure DOM is ready
    setTimeout(handleResponsivePadding, 100);
    
    // Add event listener
    window.addEventListener('resize', handleResponsivePadding);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResponsivePadding);
  }, []);

    // Inject dynamic styles (print + responsive buttons)
  useEffect(() => {
    const styleId = 'smart-crud-dynamic-styles';
    if (document.getElementById(styleId)) return;
    const dynamicStyles = `
      /* Table row borders */
      .sct-row-with-border { 
        border-top: 1px solid var(--border-color, #dee2e6) !important; 
      }
      
      /* Header Button Styles - Help & Settings */
      .sct-header-buttons {
        display: flex;
        gap: 10px;
        flex: 0 0 auto;
        min-width: 180px;
        justify-content: flex-end;
      }
      
      .sct-header-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        padding: 10px 16px !important;
        font-size: 0.9rem !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        border-radius: 6px !important;
        transition: all 0.2s ease !important;
        min-width: 0 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
      }
      
      .sct-header-btn:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
      }
      
      /* Desktop - Control h2 width to prevent wrapping */
      .sct-crud-controls-bar h2 {
        flex: 1 1 auto;
        max-width: calc(100% - 200px);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      /* Remove hover animations on touch devices */
      @media (hover: none) and (pointer: coarse) {
        .sct-header-btn:hover {
          transform: none !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
      }
      
      /* Action Button Base Styles */
      .sct-action-btn, .sct-settings-btn:not(.sct-header-btn) {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        padding: 8px 15px !important;
        font-size: 0.9em !important;
        white-space: nowrap !important;
      }
      
      /* Keep table action buttons (Edit, Copy, Delete in rows) small and compact */
      .btn-sm {
        min-width: auto !important;
        width: auto !important;
      }
      
      /* Action buttons container for better alignment */
      .sct-actions-container {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 10px !important;
        align-items: flex-start !important;
      }
      
      @media screen and (max-width: 768px) {
        /* Controls bar responsive behavior - keep on same line */
        .sct-crud-controls-bar {
          gap: 10px !important;
          align-items: center !important;
        }
        
        .sct-crud-controls-bar h2 {
          flex: 1 1 50% !important;
          font-size: 1.3em !important;
          margin: 0 !important;
          min-width: 0 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        
        /* Header buttons responsive behavior - circular icons */
        .sct-header-buttons {
          gap: 8px;
          flex: 0 0 auto;
          justify-content: flex-end;
        }
        
        .sct-header-btn {
          width: 40px !important;
          height: 40px !important;
          border-radius: 50% !important;
          padding: 0 !important;
          font-size: 1rem !important;
          gap: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 40px !important;
          flex-shrink: 0 !important;
        }
        
        .sct-header-btn .sct-btn-text {
          display: none !important;
        }
        
        /* Override global button icon margin for perfect centering */
        .sct-header-btn i {
          margin-right: 0 !important;
          margin-left: 0 !important;
        }
        
        .sct-header-btn:hover {
          transform: none !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        .sct-actions-container {
          justify-content: flex-start !important;
        }
        .sct-action-btn, .sct-settings-btn:not(.sct-header-btn) {
          flex: 0 0 calc(50% - 5px) !important;
          max-width: calc(50% - 5px) !important;
          min-width: 0 !important;
          justify-content: center !important;
        }
        
        /* Special case: when there are 5 buttons, make the last one span both columns */
        .sct-actions-container:has(.sct-action-btn:nth-child(5)) .sct-action-btn:nth-child(5) {
          flex: 0 0 100% !important;
          max-width: 100% !important;
        }
        
        /* Fallback for browsers that don't support :has() - use a specific class */
        .sct-actions-container.sct-five-buttons .sct-action-btn:nth-child(5) {
          flex: 0 0 100% !important;
          max-width: 100% !important;
        }
        
        /* Smart responsive padding override for containers */
        .sct-mobile-padding-override {
          padding-left: 0.5rem !important;
          padding-right: 0.5rem !important;
        }
        
        /* Keep table action buttons small on all screens */
        .btn-sm {
          min-width: auto !important;
          width: auto !important;
        }
      }
      
      /* Color variants */
      .sct-action-btn.sct-btn-warning {
        background-color: var(--warning-color, #ffc107) !important;
        color: var(--dark-color, #212529) !important;
        border: none !important;
      }
      
      .sct-action-btn.sct-btn-success {
        background-color: var(--success-color, #198754) !important;
        color: var(--white-color, #fff) !important;
        border: none !important;
      }
      
      /* Simplified responsive - only 2 breakpoints */
      @media screen and (max-width: 768px) {
        .sct-action-btn, .sct-settings-btn:not(.sct-header-btn) {
          min-width: auto !important;
          width: auto !important;
          padding: 6px 10px !important;
          font-size: 0.85em !important;
          gap: 4px !important;
        }
      }
      
      /* Column Resize Styles */
      .sct-resize-handle {
        opacity: 0.6;
        transition: opacity 0.2s ease, color 0.2s ease;
      }
      
      .sct-resize-handle:hover {
        opacity: 1 !important;
        color: var(--primary-color, #007bff) !important;
      }
      
      .sct-resize-handle:active {
        opacity: 1 !important;
        color: var(--primary-color, #007bff) !important;
      }
      
      /* Extend resize handle clickable area */
      .sct-resize-handle::before {
        content: '';
        position: absolute;
        top: -5px;
        bottom: -5px;
        left: -4px;
        right: -4px;
        cursor: col-resize;
      }
      
      /* Prevent text selection during resize */
      .sct-resizing {
        user-select: none !important;
        cursor: col-resize !important;
      }
      
      .sct-resizing * {
        user-select: none !important;
      }
      
      /* Help highlighting styles */
      .sct-help-highlight {
        position: relative !important;
        box-shadow: 0 0 15px 3px rgba(0, 123, 255, 0.6) !important;
        border-radius: 4px !important;
        z-index: 999 !important;
        animation: sct-pulse-highlight 2s infinite !important;
      }
      
      /* Special highlighting for small icons like sort icons */
      .sct-help-highlight-icon {
        filter: drop-shadow(0 0 15px rgba(255, 193, 7, 1)) drop-shadow(0 0 25px rgba(255, 193, 7, 0.8)) drop-shadow(0 0 35px rgba(255, 193, 7, 0.6)) !important;
        animation: sct-pulse-highlight-icon 2s infinite !important;
        z-index: 999 !important;
        opacity: 1 !important;
        transform: scale(1.3) !important;
        outline: 3px solid rgba(255, 193, 7, 0.8) !important;
        outline-offset: 2px !important;
        background: rgba(255, 193, 7, 0.2) !important;
        border-radius: 4px !important;
      }
      
      /* Special highlighting for buttons that preserves original styling */
      .sct-help-highlight-button {
        position: relative !important;
        z-index: 999 !important;
        animation: sct-pulse-highlight-button 2s infinite !important;
      }
      
      .sct-help-highlight-button::before {
        content: '';
        position: absolute !important;
        top: -4px !important;
        left: -4px !important;
        right: -4px !important;
        bottom: -4px !important;
        border: 3px solid rgba(255, 193, 7, 0.8) !important;
        border-radius: inherit !important;
        pointer-events: none !important;
        z-index: -1 !important;
        animation: inherit !important;
      }
      
      /* Special highlighting for column resize handles that doesn't break layout */
      .sct-help-highlight-column {
        position: relative !important;
        z-index: 999 !important;
        animation: sct-pulse-highlight-column 2s infinite !important;
      }
      
      @keyframes sct-pulse-highlight {
        0%, 100% { box-shadow: 0 0 15px 3px rgba(0, 123, 255, 0.6); }
        50% { box-shadow: 0 0 20px 5px rgba(0, 123, 255, 0.8); }
      }
      
      @keyframes sct-pulse-highlight-icon {
        0%, 100% { 
          filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.9)) drop-shadow(0 0 12px rgba(255, 193, 7, 0.6));
        }
        50% { 
          filter: drop-shadow(0 0 12px rgba(255, 193, 7, 1)) drop-shadow(0 0 16px rgba(255, 193, 7, 0.8));
        }
      }
      
      @keyframes sct-pulse-highlight-button {
        0%, 100% { 
          transform: scale(1);
        }
        50% { 
          transform: scale(1.05);
        }
      }
      
      @keyframes sct-pulse-highlight-button::before {
        0%, 100% { 
          border-color: rgba(255, 193, 7, 0.8);
          box-shadow: 0 0 10px rgba(255, 193, 7, 0.6);
        }
        50% { 
          border-color: rgba(255, 193, 7, 1);
          box-shadow: 0 0 15px rgba(255, 193, 7, 0.8);
        }
      }
      
      @keyframes sct-pulse-highlight-column {
        0%, 100% { 
          filter: drop-shadow(0 0 10px rgba(0, 123, 255, 0.8));
        }
        50% { 
          filter: drop-shadow(0 0 15px rgba(0, 123, 255, 1));
        }
      }
      
      @media print { 
        body, #root, .app-container, .content-area, .app-main, .app-content { height: auto !important; overflow: visible !important; position: static !important; } 
        body * { visibility: hidden !important; background: #fff !important; color: #000 !important; box-shadow: none !important; text-shadow: none !important; } 
        .print-section, .print-section * { visibility: visible !important; } 
        .print-section { position: static !important; width: 100% !important; margin: 0 !important; padding: 0 !important; } 
        .print-section .no-print { display: none !important; } 
        .print-section .table-responsive-container { overflow-x: visible !important; } 
        .print-section table { width: 100% !important; border-collapse: collapse !important; font-size: 11pt !important; page-break-inside: auto; } 
        .print-section table tr { page-break-inside: avoid !important; page-break-after: auto; } 
        .print-section table thead { display: table-header-group !important; } 
        .print-section table tbody tr td { border: none !important; border-bottom: 1px solid #aaa !important; padding: 8px 10px !important; text-align: left !important; background-color: #fff !important; } 
        .print-section table thead tr th { border: none !important; border-bottom: 2px solid #000 !important; padding: 8px 10px !important; font-weight: 600 !important; text-align: left !important; background-color: #fff !important; } 
      }`;
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.innerHTML = dynamicStyles;
    document.head.appendChild(styleEl);
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key !== key) return { key, direction: 'asc' };
      if (prevConfig.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: 'asc' };
    });
  }, []);

  const handleSearchChange = useCallback((columnKey, value) => {
    setSearchFilters(prev => ({ ...prev, [columnKey]: value }));
  }, []);

  const clearSearch = useCallback((columnKey) => {
    setSearchFilters(prev => { const newFilters = { ...prev }; delete newFilters[columnKey]; return newFilters; });
  }, []);

  const clearAllSearches = useCallback(() => setSearchFilters({}), []);
  const toggleSearchRow = useCallback(() => setTableSettings(prev => ({...prev, showSearchRow: !prev.showSearchRow})), []);
  const getColumnSortKey = (column) => column.accessor || column.key;

  const displayedData = useMemo(() => {
    let filteredData = [...data];
    const activeFilters = Object.entries(searchFilters).filter(([, value]) => value && value.trim());

    if (activeFilters.length > 0) {
      filteredData = filteredData.filter(item => 
        activeFilters.every(([key, searchValue]) => {
          // Find the column configuration for this key
          const column = visibleColumns.find(col => getColumnSortKey(col) === key);
          
          // Use custom search function if available
          if (column && column.searchValue) {
            const searchText = column.searchValue(item);
            return String(searchText ?? '').toLowerCase().includes(searchValue.toLowerCase().trim());
          }
          
          // Default search behavior
          return String(item[key] ?? '').toLowerCase().includes(searchValue.toLowerCase().trim());
        })
      );
    }

    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        // Find the column configuration for this sort key
        const column = visibleColumns.find(col => getColumnSortKey(col) === sortConfig.key);
        
        // Use custom sort function if available
        if (column && column.sortValue) {
          const aValue = column.sortValue(a);
          const bValue = column.sortValue(b);
          if (aValue == null) return 1; 
          if (bValue == null) return -1;
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Default sort behavior
        const aValue = a[sortConfig.key], bValue = b[sortConfig.key];
        if (aValue == null) return 1; 
        if (bValue == null) return -1;
        if (typeof aValue === 'string') return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    return filteredData;
  }, [data, sortConfig, searchFilters, visibleColumns]);

  // Auto-resize column to fit content
  const handleAutoResize = useCallback((columnKey) => {
    // Create a temporary element to measure text width
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.style.fontSize = '0.85em'; // Match table cell font size
    tempDiv.style.fontFamily = getComputedStyle(document.body).fontFamily;
    document.body.appendChild(tempDiv);

    let maxWidth = 100; // Minimum width

    // Check header width
    const column = visibleColumns.find(col => col.key === columnKey);
    if (column) {
      tempDiv.textContent = column.header;
      maxWidth = Math.max(maxWidth, tempDiv.offsetWidth + 60); // Add padding for icons
    }

    // Check content width in visible rows
    displayedData.forEach(item => {
      const value = column?.render ? 
        (typeof column.render(item) === 'string' ? column.render(item) : String(item[columnKey] || '')) :
        (item[columnKey] || '');
      
      tempDiv.textContent = String(value);
      maxWidth = Math.max(maxWidth, tempDiv.offsetWidth + 24); // Add padding
    });

    document.body.removeChild(tempDiv);

    // Apply the calculated width
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: Math.min(maxWidth, 400) // Cap at 400px
    }));
    
    // Mark this column as auto-fitted
    setAutoFitColumns(prev => new Set(prev).add(columnKey));
  }, [visibleColumns, displayedData]);

  const handleSelectRow = useCallback((itemId) => {
    setSelectedItemIds(prev => { const newSelectedIds = new Set(prev); if (newSelectedIds.has(itemId)) newSelectedIds.delete(itemId); else newSelectedIds.add(itemId); return newSelectedIds; });
  }, []);

  const handleSelectAllRows = useCallback(() => {
    if (selectedItemIds.size === displayedData.length && displayedData.length > 0) setSelectedItemIds(new Set());
    else setSelectedItemIds(new Set(displayedData.map(item => item[itemKey])));
  }, [displayedData, itemKey, selectedItemIds.size]);
  
  const handleDeleteWithConfirmation = useCallback((item) => {
    const message = t('smartCrud.confirmDeleteItemPrompt', 'Are you sure you want to delete this item?');
    showConfirmation(message, () => onDeleteItem?.(item));
  }, [t, onDeleteItem, showConfirmation]);

  const handleGlobalAction = useCallback((type) => {
    const selectedCount = selectedItemIds.size;
    if (type === 'EDIT' || type === 'COPY') {
      if (selectedCount !== 1) {
        alert(t(`smartCrud.prompts.selectOneItemTo${type}`, `Please select exactly one item to ${type.toLowerCase()}.`)); return;
      }
      const selectedItem = data.find(item => item[itemKey] === selectedItemIds.values().next().value);
      if (selectedItem) {
        if (type === 'EDIT') {
          // If formConfig is provided, use the built-in form modal for editing
          if (formConfig) {
            setInternalFormInitialData(selectedItem);
            setInternalShowFormModal(true);
          } else {
            // Otherwise, use the external edit handler
            onEditSelectedItem?.(selectedItem);
          }
        }
        if (type === 'COPY') onCopySelectedItem?.(selectedItem);
      }
    } else if (type === 'DELETE') {
      if (selectedCount === 0) {
        alert(t('smartCrud.prompts.selectItemsToDelete', 'Please select at least one item to delete.')); return;
      }
      let message;
      if (selectedCount === 1) {
        message = t('smartCrud.confirmDeleteSelectedItemsPrompt_one');
      } else {
        message = t('smartCrud.confirmDeleteSelectedItemsPrompt_other', { count: selectedCount });
      }
      showConfirmation(message, () => onDeleteSelectedItems?.(Array.from(selectedItemIds)));
    }
  }, [selectedItemIds, data, itemKey, t, onEditSelectedItem, onCopySelectedItem, onDeleteSelectedItems, showConfirmation]);

  // NEW: Handle custom toolbar actions
  const handleCustomToolbarAction = useCallback((action) => {
    const selectedCount = selectedItemIds.size;
    const selectedItems = data.filter(item => selectedItemIds.has(item[itemKey]));
    
    // Check if action has selection requirements
    if (action.requiresSelection && selectedCount === 0) {
      alert(t('smartCrud.prompts.selectItemsForAction', 'Please select at least one item for this action.'));
      return;
    }
    
    if (action.requiresSingleSelection && selectedCount !== 1) {
      alert(t('smartCrud.prompts.selectOneItemForAction', 'Please select exactly one item for this action.'));
      return;
    }
    
    // Call the action with selected items
    action.onClick(selectedItems, selectedItemIds);
  }, [selectedItemIds, data, itemKey, t]);

  const handlePrint = () => window.print();

  const isAllSelected = displayedData.length > 0 && selectedItemIds.size === displayedData.length;
  const canEditSelected = selectedItemIds.size === 1;
  const canCopySelected = selectedItemIds.size === 1;
  const canDeleteSelected = selectedItemIds.size > 0;
  const tableColSpan = visibleColumns.length + 1 + (showActionsColumn && (onEditItem || formConfig || onDeleteItem || onCopyItem || customActions.length > 0) ? 1 : 0);
  const isColumnSortable = (column) => column.sortable !== false;
  const isColumnSearchable = (column) => column.searchable !== false;
  const hasActiveSearches = Object.values(searchFilters).some(v => v);
  
  // Count total buttons in actions toolbar
  const totalActionButtons = [
    onAddItem || formConfig,
    onEditSelectedItem || formConfig,
    onCopySelectedItem,
    onDeleteSelectedItems,
    ...customToolbarActions,
    hasActiveSearches ? true : false
  ].filter(Boolean).length;

  const getSortIcon = (columnKey) => {
    if (!tableSettings.showOrdering) return null;
    const iconStyle = { ...styles.thIcon, ...styles.thIconHover };
    if (sortConfig.key !== columnKey) return <SortIcon style={{...iconStyle, opacity: 0.5}} />;
    if (sortConfig.direction === 'asc') return <SortAscIcon style={iconStyle} />;
    return <SortDescIcon style={iconStyle} />;
  };

  return (
    <div ref={tableRef} style={{...styles.pageContainer, position: 'relative'}} className="print-section">
      <div style={styles.crudControlsBar} className="no-print sct-crud-controls-bar">
        {title && <h2 style={styles.pageTitle}>{title}</h2>}
        <div className="sct-header-buttons">
          <button className="btn btn-outline-info sct-header-btn sct-help-btn" onClick={() => setIsHelpModalOpen(true)} title={t('tableHelp.button.title', 'Show table help and features')}>
            <HelpIcon />
            <span className="sct-btn-text">{t('tableHelp.button.text', 'Help')}</span>
          </button>
          <button className="btn btn-outline-secondary sct-header-btn sct-settings-btn" onClick={() => setIsSettingsModalOpen(true)} title={t('tableSettings.button', 'Settings')}>
            <i className="fas fa-cog"></i>
            <span className="sct-btn-text">{t('tableSettings.button', 'Settings')}</span>
          </button>
        </div>
      </div>

      <div style={styles.actionsToolBar} className={`no-print sct-actions-container ${totalActionButtons === 5 ? 'sct-five-buttons' : ''}`}>
        {(onAddItem || formConfig) && <button className="btn btn-primary sct-action-btn" onClick={onAddItem || (() => setInternalShowFormModal(true))}><i className="fas fa-plus"></i>{t('smartCrud.addNewButtonText', 'Add New')}</button>}
        {(onEditSelectedItem || formConfig) && <button className="btn sct-action-btn sct-btn-warning" onClick={() => handleGlobalAction('EDIT')} disabled={!canEditSelected}><i className="fas fa-edit"></i>{t('smartCrud.actions.editSelectedButtonText', 'Edit Selected')}</button>}
        {onCopySelectedItem && <button className="btn sct-action-btn sct-btn-success" onClick={() => handleGlobalAction('COPY')} disabled={!canCopySelected}><i className="fas fa-copy"></i>{t('smartCrud.actions.copySelectedButtonText', 'Copy Selected')}</button>}
        {onDeleteSelectedItems && <button className="btn btn-danger sct-action-btn" onClick={() => handleGlobalAction('DELETE')} disabled={!canDeleteSelected}><i className="fas fa-trash"></i>{t('smartCrud.actions.deleteSelectedButtonText', 'Delete Selected')}</button>}
        {customToolbarActions.map((action, index) => {
          const isDisabled = (action.requiresSelection && selectedItemIds.size === 0) || 
                            (action.requiresSingleSelection && selectedItemIds.size !== 1);
          return (
            <button 
              key={index}
              className={`btn ${action.className || 'btn-secondary'} sct-action-btn`} 
              onClick={() => handleCustomToolbarAction(action)}
              disabled={isDisabled}
              title={action.title}
            >
              <i className={action.icon}></i>
              {action.label}
            </button>
          );
        })}
        {hasActiveSearches && <button className="btn btn-outline-secondary sct-action-btn" onClick={clearAllSearches}><i className="fas fa-times-circle"></i>{t('smartCrud.actions.clearFilters', 'Clear Filters')}</button>}
      </div>

      <div style={styles.tableResponsiveContainer} className="table-responsive-container">
        {isLoading ? (
          <LoadingState message={t('common.loading', 'Loading...')} />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRetry} retryMessage={t('common.retry', 'Retry')} />
        ) : (
          <table style={styles.table} className="table table-hover table-sm">
            <thead>
              <tr>
                <th style={{...styles.th, ...styles.thCheckbox}} className="no-print"><input type="checkbox" title={t('smartCrud.table.selectAllRowsTitle', 'Select All Rows')} checked={isAllSelected} onChange={handleSelectAllRows} /></th>
                {visibleColumns.map(col => (
                  <th key={col.key} 
                    className={isColumnSortable(col) ? 'sct-sortable-header' : ''}
                    style={{
                    ...styles.th, 
                    ...(col.headerStyle || {}), 
                    ...(isColumnSortable(col) ? styles.sortableHeader : {}),
                    width: columnWidths[col.key] ? `${columnWidths[col.key]}px` : 'auto',
                    minWidth: columnWidths[col.key] ? `${columnWidths[col.key]}px` : 'auto',
                    position: 'relative'
                  }} onClick={isColumnSortable(col) ? () => handleSort(getColumnSortKey(col)) : undefined}>
                    <div style={styles.thContent} className="sct-th-content">
                      <span>{col.header}</span>
                      <div style={styles.thIcons}>
                        {isColumnSortable(col) && (
                          <div className="sct-sort-icon-wrapper">
                            {getSortIcon(getColumnSortKey(col))}
                          </div>
                        )}
                        {tableSettings.showFiltering && isColumnSearchable(col) && (
                          <div className="sct-filter-icon" onClick={(e) => { e.stopPropagation(); toggleSearchRow(); }}>
                            <FilterIcon style={{ ...styles.thIcon, ...styles.thIconHover, ...(tableSettings.showSearchRow ? styles.filterIconActive : {}) }} title={t('tableActions.toggleSearch', 'Toggle Search')} />
                          </div>
                        )}
                      </div>
                    </div>
                    <ResizeHandle
                      onMouseDown={(e) => handleResizeStart(e, col.key)}
                      onDoubleClick={(e) => {
                        handleAutoResize(col.key);
                      }}
                      columnKey={col.key}
                      autoFitColumns={Array.from(autoFitColumns)}
                    />
                  </th>
                ))}
                {(showActionsColumn && (onEditItem || formConfig || onDeleteItem || onCopyItem || customActions.length > 0)) && (<th style={{...styles.th, ...styles.textCenter}} className="no-print">{t('smartCrud.table.actionsHeader', 'Actions')}</th>)}
              </tr>
              {tableSettings.showSearchRow && (
                <tr style={styles.searchRow} className="no-print sct-search-row">
                  <td style={{ ...styles.td, ...styles.tdCheckbox }}></td>
                  {visibleColumns.map(col => (
                    <td key={`${col.key}-search`} style={{
                      ...styles.td,
                      width: columnWidths[col.key] ? `${columnWidths[col.key]}px` : 'auto',
                      minWidth: columnWidths[col.key] ? `${columnWidths[col.key]}px` : 'auto',
                      maxWidth: columnWidths[col.key] ? `${columnWidths[col.key]}px` : 'none'
                    }}>
                      {isColumnSearchable(col) && (
                        <div style={styles.searchInputContainer}>
                          <input type="text" style={styles.searchInput} placeholder={t('tableActions.searchPlaceholder', 'Search {header}...').replace('{header}', col.header)} value={searchFilters[getColumnSortKey(col)] || ''} onChange={e => handleSearchChange(getColumnSortKey(col), e.target.value)} onClick={e => e.stopPropagation()} />
                          {searchFilters[getColumnSortKey(col)] && (<button style={styles.clearSearchButton} onClick={() => clearSearch(getColumnSortKey(col))} title={t('tableActions.clearSearch', 'Clear search')}>×</button>)}
                        </div>
                      )}
                    </td>
                  ))}
                  {(showActionsColumn && (onEditItem || formConfig || onDeleteItem || onCopyItem || customActions.length > 0)) && <td style={styles.td}></td>}
                </tr>
              )}
            </thead>
            <tbody>
              {displayedData.length > 0 ? (
                displayedData.map((item, index) => (
                  <tr key={item[itemKey]} className={index > 0 ? 'sct-row-with-border' : ''}>
                    <td style={{...styles.td, ...styles.tdCheckbox}} className="no-print"><input type="checkbox" checked={selectedItemIds.has(item[itemKey])} onChange={() => handleSelectRow(item[itemKey])} /></td>
                    {visibleColumns.map(col => (
                      <td key={`${item[itemKey]}-${col.key}`} style={{
                        ...styles.td, 
                        ...(col.cellStyle || {}), 
                        textAlign: col.textAlign,
                        width: columnWidths[col.key] ? `${columnWidths[col.key]}px` : 'auto',
                        minWidth: columnWidths[col.key] ? `${columnWidths[col.key]}px` : 'auto',
                        maxWidth: columnWidths[col.key] ? `${columnWidths[col.key]}px` : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {col.render ? col.render(item) : (item[getColumnSortKey(col)] ?? '-')}
                      </td>
                    ))}
                    {(showActionsColumn && (onEditItem || formConfig || onDeleteItem || onCopyItem || customActions.length > 0)) && (
                      <td style={{...styles.td, ...styles.actionCell}} className="no-print">
                        {(onEditItem || formConfig) && <button className="btn btn-sm" style={{...styles.iconButton, ...styles.btnWarning}} onClick={() => {
                          // If formConfig is provided, use the built-in form modal for editing
                          if (formConfig) {
                            setInternalFormInitialData(item);
                            setInternalShowFormModal(true);
                          } else {
                            // Otherwise, use the external edit handler
                            onEditItem(item);
                          }
                        }} title={t('smartCrud.actions.editItemTitle', 'Edit')}><i className="fas fa-edit" style={{marginRight: 0}}></i></button>}
                        {onCopyItem && <button className="btn btn-sm" style={{...styles.iconButton, ...styles.btnSuccess}} onClick={() => onCopyItem(item)} title={t('smartCrud.actions.copyItemTitle', 'Copy')}><i className="fas fa-copy" style={{marginRight: 0}}></i></button>}
                        {customActions.map((action, index) => (
                          <button 
                            key={index}
                            className={`btn btn-sm ${action.className || 'btn-info'}`} 
                            style={styles.iconButton} 
                            onClick={() => action.onClick(item)} 
                            title={action.title}
                          >
                            <i className={action.icon} style={{marginRight: 0}}></i>
                          </button>
                        ))}
                        {onDeleteItem && <button className="btn btn-sm btn-danger" style={styles.iconButton} onClick={() => handleDeleteWithConfirmation(item)} title={t('smartCrud.actions.deleteItemTitle', 'Delete')}><i className="fas fa-trash-alt" style={{marginRight: 0}}></i></button>}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableColSpan} style={styles.noDataRow}>
                    {hasActiveSearches ? t('smartCrud.noResultsFoundText', 'No results found.') : (emptyStateContent || t('smartCrud.noDataFoundText', 'Δεν βρέθηκαν δεδομένα.'))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.printContainer} className="no-print">
        <button className="btn btn-outline-secondary" style={styles.printButton} onClick={handlePrint}><i className="fas fa-print"></i>{t('smartCrud.printButtonText', 'Print')}</button>
      </div>

      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)}
        tableRef={tableRef}
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        settings={tableSettings} 
        onSettingsChange={setTableSettings} 
        columnConfigs={columnConfigs} 
        onColumnConfigChange={handleColumnConfigChange}
        visibleColumnKeys={visibleColumnKeys} 
        onVisibleColumnsChange={setVisibleColumnKeys} 
        showActionsColumn={showActionsColumn} 
        onShowActionsColumnChange={setShowActionsColumn} 
      />
      
      <ConfirmationDialog
        isOpen={confirmationState.isOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        title={t('smartCrud.confirmDeleteTitle')}
        message={confirmationState.message}
        cancelText={t('cancel')}
        confirmText={t('delete')}
      />
      
      {formConfig && (
        <SmartFormModal
          isOpen={showFormModal}
          onClose={onCloseFormModal}
          onSubmit={handleFormSubmit}
          title={formConfig.title}
          titleKey={formConfig.titleKey}
          icon={formConfig.icon}
          fields={formConfig.fields}
          submitButtonText={formConfig.submitButtonText}
          isSubmitting={formIsSubmitting}
          initialData={formInitialData}
          submitError={formSubmitError}
          onErrorDismiss={onFormErrorDismiss}
          getNewRecordData={getNewRecordData}
        />
      )}
    </div>
  );
}

export default React.memo(SmartCrudTable);