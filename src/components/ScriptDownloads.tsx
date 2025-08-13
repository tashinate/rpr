import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Download, FileText, Package, Clock, Users, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

interface Script {
  id: string;
  filename: string;
  display_name: string;
  description: string | null;
  file_path: string;
  file_size: number;
  file_type: string;
  version: string;
  category: string;
  upload_date: string;
  download_count: number;
  is_active: boolean;
}

export const ScriptDownloads = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('script_downloads')
        .select('*')
        .eq('is_active', true)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast.error('Failed to load scripts');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadScript = async (script: Script) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(script.id));

      // Get current session token from localStorage with correct key
      const sessionToken = localStorage.getItem('license_session_token');
      if (!sessionToken) {
        toast.error('Session expired. Please login again.');
        return;
      }

      // Validate session before attempting download
      const sessionExpiresAt = localStorage.getItem('license_session_expires');
      if (sessionExpiresAt && new Date(sessionExpiresAt) < new Date()) {
        toast.error('Session expired. Please login again.');
        // Clear expired session
        localStorage.removeItem('license_session_token');
        localStorage.removeItem('license_session_expires');
        return;
      }

      // Download file from storage
      const { data, error } = await supabase.storage
        .from('script-files')
        .download(script.file_path);

      if (error) {
        console.error('Storage download error:', error);
        if (error.message.includes('not found')) {
          toast.error('File not found or has been removed');
        } else if (error.message.includes('permission')) {
          toast.error('Access denied. Please check your permissions.');
        } else {
          toast.error('Failed to download file from storage');
        }
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = script.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log download (get license key ID from session)
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('user_sessions')
          .select('license_key_id')
          .eq('session_token', sessionToken)
          .eq('is_active', true)
          .single();

        if (sessionError) {
          console.error('Session validation error:', sessionError);
          toast.error('Session validation failed. Please login again.');
          return;
        }

        if (sessionData?.license_key_id) {
          const { error: logError } = await supabase.rpc('log_script_download', {
            script_id_input: script.id,
            license_key_id_input: sessionData.license_key_id,
            ip_address_input: null,
            user_agent_input: navigator.userAgent
          });

          if (logError) {
            console.error('Download logging error:', logError);
            // Don't show error to user as download was successful
          }
        }
      } catch (error) {
        console.error('Download logging failed:', error);
        // Don't show error to user as download was successful
      }

      toast.success(`Downloaded ${script.display_name}`);
      
      // Refresh scripts to update download count
      fetchScripts();

    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download script');
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(script.id);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cpanel':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/50';
      case 'automation':
        return 'bg-green-500/20 text-green-300 border-green-400/50';
      case 'security':
        return 'bg-red-500/20 text-red-300 border-red-400/50';
      case 'utilities':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/50';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        <span className="ml-3 text-cyan-300 font-jetbrains tracking-wider uppercase">Loading Phantom Files...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-400/30 animate-pulse blur-sm rounded-xl"></div>
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 border border-cyan-400/30 backdrop-blur-sm flex items-center justify-center">
            <Package className="w-6 h-6 text-cyan-300" />
          </div>
        </div>
        <div>
          <h2 className="font-jetbrains text-2xl font-bold text-white tracking-wider uppercase">PHANTOM DOWNLOADS</h2>
          <p className="text-cyan-300/80 font-jetbrains tracking-wide uppercase text-sm">SECURE FILE TRANSMISSION PROTOCOL</p>
        </div>
      </div>

      {/* Scripts Grid */}
      {scripts.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 border-cyan-400/30">
          <CardContent className="p-6 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-cyan-400/20 animate-pulse blur-md rounded-full"></div>
              <FileText className="relative w-12 h-12 text-cyan-400/70 mx-auto" />
            </div>
            <h3 className="font-jetbrains text-lg font-bold text-white mb-2 tracking-wider uppercase">NO PHANTOM FILES DETECTED</h3>
            <p className="text-cyan-300/70 font-jetbrains tracking-wide uppercase text-sm">TRANSMISSION QUEUE EMPTY</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {scripts.map((script) => (
            <Card 
              key={script.id} 
              className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 border-cyan-400/30 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 group overflow-hidden"
            >
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent group-hover:animate-scan-line"></div>
              
              <CardHeader className="pb-2 p-3 relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-jetbrains text-xs text-white group-hover:text-cyan-300 transition-colors truncate tracking-wider uppercase">
                      {script.display_name}
                    </CardTitle>
                    <CardDescription className="text-cyan-300/80 font-jetbrains text-xs mt-1 truncate tracking-wider uppercase">
                      V{script.version}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${getCategoryColor(script.category)} font-jetbrains text-xs flex-shrink-0 tracking-wider uppercase backdrop-blur-sm px-2 py-0`}
                  >
                    {script.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 p-3 pt-0 relative z-10">
                {/* Description - Single line */}
                {script.description && (
                  <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/50 border border-cyan-400/20 rounded-lg p-2">
                    <p className="text-blue-200/90 text-xs font-inter leading-relaxed truncate">
                      {script.description}
                    </p>
                  </div>
                )}

                {/* Compact File Info Row - Single line */}
                <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/50 border border-cyan-400/20 rounded-lg p-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-cyan-300/80">
                      <HardDrive className="w-3 h-3" />
                      <span className="font-jetbrains font-bold">{formatFileSize(script.file_size)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-cyan-300/80">
                      <Users className="w-3 h-3" />
                      <span className="font-jetbrains font-bold">{script.download_count}</span>
                    </div>

                    <div className="flex items-center gap-1 text-blue-300/80">
                      <Clock className="w-3 h-3" />
                      <span className="font-jetbrains font-bold">
                        {new Date(script.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compact Download Button */}
                <div className="relative group/btn">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-lg opacity-40 blur group-hover/btn:opacity-80 transition duration-300"></div>
                  <Button
                    onClick={() => downloadScript(script)}
                    disabled={downloadingIds.has(script.id)}
                    className="relative z-10 w-full bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-500 text-white font-jetbrains font-bold transition-all duration-300 tracking-wider uppercase text-xs py-1 h-7"
                  >
                    {downloadingIds.has(script.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        TRANSMITTING...
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 mr-2 group-hover/btn:animate-bounce" />
                        DOWNLOAD
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
