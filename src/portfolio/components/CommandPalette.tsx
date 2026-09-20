import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import '../assets/styles/CommandPalette.scss';

export interface CommandPaletteCommand {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  group?: string;
  keywords?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  commands: CommandPaletteCommand[];
  contextLabel?: string;
  onOpen?: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  contextLabel = 'COMMAND PALETTE',
  onOpen,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return commands;

    return commands.filter((command) => {
      const haystack = [
        command.label,
        command.description ?? '',
        command.group ?? '',
        ...(command.keywords ?? []),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [commands, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const execute = useCallback(
    (command: CommandPaletteCommand) => {
      close();
      command.action();
    },
    [close],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';

      if (isShortcut) {
        event.preventDefault();
        setOpen((value) => {
          const next = !value;
          if (next) onOpen?.();
          return next;
        });
        return;
      }

      if (!open) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((value) =>
          filteredCommands.length ? (value + 1) % filteredCommands.length : 0,
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((value) =>
          filteredCommands.length
            ? (value - 1 + filteredCommands.length) % filteredCommands.length
            : 0,
        );
      } else if (event.key === 'Enter' && filteredCommands[selectedIndex]) {
        event.preventDefault();
        execute(filteredCommands[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close, execute, filteredCommands, onOpen, open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <>
      <button
        type="button"
        className="command-palette-trigger"
        onClick={() => {
          onOpen?.();
          setOpen(true);
        }}
        aria-label="Open command palette"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon icon="mdi:magnify" aria-hidden="true" />
        <span className="command-palette-trigger-label">COMMAND</span>
        <kbd>⌘K</kbd>
      </button>

      {open &&
        createPortal(
          <div className="command-palette" role="presentation">
            <button
              type="button"
              className="command-palette-backdrop"
              onClick={close}
              aria-label="Close command palette"
            />
            <section
              className="command-palette-panel"
              role="dialog"
              aria-modal="true"
              aria-label={contextLabel}
            >
              <div className="command-palette-header">
                <div>
                  <span className="command-palette-kicker">{contextLabel}</span>
                  <span className="command-palette-hint">JUMP TO ANYWHERE</span>
                </div>
                <button
                  type="button"
                  className="command-palette-close"
                  onClick={close}
                  aria-label="Close"
                >
                  ESC
                </button>
              </div>

              <label className="command-palette-search">
                <Icon icon="mdi:magnify" aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search pages, sections, actions..."
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd>↵</kbd>
              </label>

              <div className="command-palette-results" role="listbox" aria-label="Commands">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((command, index) => (
                    <button
                      type="button"
                      key={command.id}
                      className={`command-palette-item ${index === selectedIndex ? 'is-selected' : ''}`}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => execute(command)}
                      role="option"
                      aria-selected={index === selectedIndex}
                    >
                      <span className="command-palette-item-icon">
                        <Icon icon={command.icon ?? 'mdi:arrow-right'} aria-hidden="true" />
                      </span>
                      <span className="command-palette-item-copy">
                        <strong>{command.label}</strong>
                        {command.description && <small>{command.description}</small>}
                      </span>
                      <span className="command-palette-item-group">{command.group ?? 'NAV'}</span>
                      <Icon
                        className="command-palette-item-arrow"
                        icon="mdi:arrow-top-right"
                        aria-hidden="true"
                      />
                    </button>
                  ))
                ) : (
                  <div className="command-palette-empty">
                    <span>NO MATCHES</span>
                    <small>Try a page name, section, or keyword.</small>
                  </div>
                )}
              </div>

              <div className="command-palette-footer">
                <span>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd> NAVIGATE
                </span>
                <span>
                  <kbd>ENTER</kbd> SELECT
                </span>
                <span>
                  <kbd>ESC</kbd> CLOSE
                </span>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
};

export default CommandPalette;
