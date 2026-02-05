import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link, FileJson, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UploadModalProps {
  onLoadFromUrl: (url: string) => Promise<void>;
  onLoadFromFile: (file: File) => void;
  onReset: () => void;
  loading: boolean;
  error: string | null;
}

export function UploadModal({ onLoadFromUrl, onLoadFromFile, onReset, loading, error }: UploadModalProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      await onLoadFromUrl(url);
      if (!error) {
        setOpen(false);
        setUrl('');
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
      onLoadFromFile(file);
      setOpen(false);
    }
  }, [onLoadFromFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadFromFile(file);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload/Sync</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            Load OpenAPI Spec
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="file" className="flex-1 gap-2">
              <Upload className="h-4 w-4" />
              File Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1 gap-2">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="mt-4">
            <motion.div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Drop your file here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports JSON and YAML (OpenAPI 3.0/3.1)
                  </p>
                </div>
              </label>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-4">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://api.example.com/openapi.json"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL of your OpenAPI specification file
                </p>
              </div>
              
              <Button type="submit" className="w-full gap-2" disabled={loading || !url}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4" />
                    Fetch Spec
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            Reset to Sample
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
