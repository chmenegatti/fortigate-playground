import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, ExternalLink, Code2 } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { EndpointDetail } from '@/components/EndpointDetail';
import { CodePlayground } from '@/components/CodePlayground';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UploadModal } from '@/components/UploadModal';
import { useOpenAPISpec } from '@/hooks/useOpenAPISpec';
import { useTheme } from '@/hooks/useTheme';
import type { ParsedEndpoint } from '@/types/openapi';

export default function ApiDocs() {
  useTheme(); // Initialize theme
  
  const { spec, tags, loading, error, loadFromUrl, loadFromFile, resetToSample } = useOpenAPISpec();
  const [selectedEndpoint, setSelectedEndpoint] = useState<ParsedEndpoint | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPlayground, setShowPlayground] = useState(true);

  // Select first endpoint on load
  useEffect(() => {
    if (tags.length > 0 && tags[0].endpoints.length > 0 && !selectedEndpoint) {
      setSelectedEndpoint(tags[0].endpoints[0]);
    }
  }, [tags, selectedEndpoint]);

  // Update selected endpoint when tags change (after loading new spec)
  useEffect(() => {
    if (tags.length > 0 && tags[0].endpoints.length > 0) {
      setSelectedEndpoint(tags[0].endpoints[0]);
    }
  }, [tags]);

  // Handle responsive playground visibility
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setShowPlayground(false);
      } else {
        setShowPlayground(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-3 lg:ml-0 ml-12">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground">
              <Book className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-foreground">{spec?.info.title || 'API Documentation'}</h1>
              <p className="text-xs text-muted-foreground">v{spec?.info.version || '1.0.0'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlayground(!showPlayground)}
              className="xl:hidden p-2 rounded-lg bg-muted hover:bg-accent transition-colors"
              aria-label="Toggle playground"
            >
              <Code2 className="h-5 w-5" />
            </button>
            
            <UploadModal
              onLoadFromUrl={loadFromUrl}
              onLoadFromFile={loadFromFile}
              onReset={resetToSample}
              loading={loading}
              error={error}
            />
            
            <ThemeToggle />

            {spec?.info.contact?.url && (
              <a
                href={spec.info.contact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Support
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          tags={tags}
          selectedEndpoint={selectedEndpoint}
          onSelectEndpoint={setSelectedEndpoint}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0 lg:ml-0">
          <div className="flex">
            {/* Documentation Panel */}
            <div className={`flex-1 min-w-0 ${showPlayground ? 'xl:max-w-[calc(100%-400px)]' : ''}`}>
              <div className="max-w-4xl mx-auto px-6 py-8">
                <AnimatePresence mode="wait">
                  {selectedEndpoint ? (
                    <EndpointDetail
                      key={selectedEndpoint.id}
                      endpoint={selectedEndpoint}
                      spec={spec!}
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <div className="p-4 rounded-2xl bg-muted mb-4">
                        <Book className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        Select an endpoint
                      </h2>
                      <p className="text-muted-foreground max-w-md">
                        Choose an endpoint from the sidebar to view its documentation and try it out.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Code Playground Panel */}
            <AnimatePresence>
              {showPlayground && selectedEndpoint && (
                <motion.aside
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="hidden xl:flex flex-col w-[400px] min-w-[400px] border-l border-border bg-card sticky top-16 h-[calc(100vh-4rem)] overflow-hidden"
                >
                  <CodePlayground
                    endpoint={selectedEndpoint}
                    spec={spec!}
                  />
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Playground Drawer */}
      <AnimatePresence>
        {showPlayground && selectedEndpoint && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="xl:hidden fixed inset-x-0 bottom-0 z-50 h-[70vh] bg-card border-t border-border rounded-t-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-center py-2">
              <div className="w-12 h-1.5 rounded-full bg-muted" />
            </div>
            <CodePlayground
              endpoint={selectedEndpoint}
              spec={spec!}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
