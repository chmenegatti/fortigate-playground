import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ChevronDown, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MethodBadge } from './MethodBadge';
import type { ParsedTag, ParsedEndpoint } from '@/types/openapi';
import { cn } from '@/lib/utils';

interface SidebarProps {
  tags: ParsedTag[];
  selectedEndpoint: ParsedEndpoint | null;
  onSelectEndpoint: (endpoint: ParsedEndpoint) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ tags, selectedEndpoint, onSelectEndpoint, isOpen, onToggle }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set(tags.map(t => t.name)));

  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags;
    
    const query = searchQuery.toLowerCase();
    return tags
      .map(tag => ({
        ...tag,
        endpoints: tag.endpoints.filter(ep =>
          ep.path.toLowerCase().includes(query) ||
          ep.operation.summary?.toLowerCase().includes(query) ||
          ep.method.toLowerCase().includes(query)
        ),
      }))
      .filter(tag => tag.endpoints.length > 0);
  }, [tags, searchQuery]);

  const toggleTag = (tagName: string) => {
    setExpandedTags(prev => {
      const next = new Set(prev);
      if (next.has(tagName)) {
        next.delete(tagName);
      } else {
        next.add(tagName);
      }
      return next;
    });
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-lg"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -320 }}
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-sidebar border-r border-sidebar-border',
          'flex flex-col overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-sidebar-accent border-sidebar-border"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-2">
          <AnimatePresence mode="popLayout">
            {filteredTags.map(tag => (
              <motion.div
                key={tag.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-1"
              >
                {/* Tag Header */}
                <button
                  onClick={() => toggleTag(tag.name)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <motion.div
                    animate={{ rotate: expandedTags.has(tag.name) ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                  <span>{tag.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-sidebar-accent px-1.5 py-0.5 rounded">
                    {tag.endpoints.length}
                  </span>
                </button>

                {/* Endpoints */}
                <AnimatePresence>
                  {expandedTags.has(tag.name) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {tag.endpoints.map(endpoint => (
                        <motion.button
                          key={endpoint.id}
                          onClick={() => {
                            onSelectEndpoint(endpoint);
                            if (window.innerWidth < 1024) onToggle();
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 ml-4 rounded-lg text-sm transition-colors',
                            selectedEndpoint?.id === endpoint.id
                              ? 'bg-sidebar-accent text-sidebar-foreground'
                              : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                          )}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <MethodBadge method={endpoint.method} size="sm" />
                          <span className="truncate font-mono text-xs">
                            {endpoint.path}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTags.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No endpoints found
            </div>
          )}
        </nav>
      </motion.aside>
    </>
  );
}
