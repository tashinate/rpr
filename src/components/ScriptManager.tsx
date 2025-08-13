
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DownloadAnalytics } from './analytics/DownloadAnalytics';
import { Upload, FileText, Trash2, Edit3, Package, BarChart3, Eye, TrendingUp } from 'lucide-react';
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

interface UploadForm {
  file: File | null;
  display_name: string;
  description: string;
  version: string;
  category: string;
}

const CATEGORIES = ['cpanel', 'automation', 'security', 'utilities', 'general'];

export const ScriptManager = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState<UploadForm>({
    file: null,
    display_name: '',
    description: '',
    version: '1.0.0',
    category: 'general'
  });

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('script_downloads')
        .select('*')
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        file,
        display_name: prev.display_name || file.name.replace(/\.[^/.]+$/, "")
      }));
    }
  };

  const uploadScript = async () => {
    if (!uploadForm.file || !uploadForm.display_name) {
      toast.error('Please select a file and provide a display name');
      return;
    }

    try {
      setIsUploading(true);

      // Upload file to storage
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${Date.now()}_${uploadForm.file.name}`;
      const filePath = `scripts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('script-files')
        .upload(filePath, uploadForm.file);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from('script_downloads')
        .insert({
          filename: uploadForm.file.name,
          display_name: uploadForm.display_name,
          description: uploadForm.description || null,
          file_path: filePath,
          file_size: uploadForm.file.size,
          file_type: uploadForm.file.type || 'application/octet-stream',
          version: uploadForm.version,
          category: uploadForm.category
        });

      if (dbError) throw dbError;

      toast.success('Script uploaded successfully');
      resetUploadForm();
      setShowUploadForm(false);
      fetchScripts();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload script');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteScript = async (script: Script) => {
    if (!confirm(`Are you sure you want to delete "${script.display_name}"?`)) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('script-files')
        .remove([script.file_path]);

      if (storageError) console.warn('Storage deletion error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('script_downloads')
        .delete()
        .eq('id', script.id);

      if (dbError) throw dbError;

      toast.success('Script deleted successfully');
      fetchScripts();

    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete script');
    }
  };

  const toggleScriptStatus = async (script: Script) => {
    try {
      console.log('Toggling script status for:', script.id, 'current status:', script.is_active);
      
      const newStatus = !script.is_active;
      const { data, error } = await supabase
        .from('script_downloads')
        .update({ is_active: newStatus })
        .eq('id', script.id)
        .select();

      if (error) {
        console.error('Toggle status error details:', error);
        throw error;
      }

      console.log('Toggle successful, updated data:', data);
      toast.success(`Script ${script.is_active ? 'deactivated' : 'activated'}`);
      fetchScripts();

    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error(`Failed to ${script.is_active ? 'deactivate' : 'activate'} script`);
    }
  };

  const updateScript = async () => {
    if (!editingScript || !editingScript.display_name) {
      toast.error('Please provide a display name');
      return;
    }

    try {
      const { error } = await supabase
        .from('script_downloads')
        .update({
          display_name: editingScript.display_name,
          description: editingScript.description || null,
          version: editingScript.version,
          category: editingScript.category
        })
        .eq('id', editingScript.id);

      if (error) throw error;

      toast.success('Script updated successfully');
      setEditingScript(null);
      fetchScripts();

    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update script');
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      file: null,
      display_name: '',
      description: '',
      version: '1.0.0',
      category: 'general'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'automation':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'security':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'utilities':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-400/30">
            <Package className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <h2 className="font-jetbrains text-xl font-bold text-white">Script Management</h2>
            <p className="text-sm text-blue-300/70">Upload and manage downloadable scripts</p>
          </div>
        </div>

        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-jetbrains"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Script
        </Button>
      </div>

      {/* Tabs for Management and Analytics */}
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="bg-slate-800/50 border border-cyan-400/30">
          <TabsTrigger 
            value="manage" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 font-jetbrains"
          >
            <Package className="w-4 h-4 mr-2" />
            Manage Files
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 font-jetbrains"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6 mt-6">
          {/* Upload Form */}
          {showUploadForm && (
            <Card className="bg-slate-800/50 border-blue-500/30">
              <CardHeader>
                <CardTitle className="font-jetbrains text-white">Upload New Script</CardTitle>
                <CardDescription>Add a new script for users to download</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="file-upload" className="font-jetbrains text-white">File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="bg-slate-700/50 border-blue-400/30 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="display-name" className="font-jetbrains text-white">Display Name</Label>
                    <Input
                      id="display-name"
                      value={uploadForm.display_name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="My Awesome Script"
                      className="bg-slate-700/50 border-blue-400/30 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="version" className="font-jetbrains text-white">Version</Label>
                    <Input
                      id="version"
                      value={uploadForm.version}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="1.0.0"
                      className="bg-slate-700/50 border-blue-400/30 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="font-jetbrains text-white">Category</Label>
                    <select
                      id="category"
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-blue-400/30 rounded-md text-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-slate-800">
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="font-jetbrains text-white">Description</Label>
                  <textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what this script does..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-blue-400/30 rounded-md text-white resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={uploadScript}
                    disabled={isUploading || !uploadForm.file || !uploadForm.display_name}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 font-jetbrains"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      resetUploadForm();
                      setShowUploadForm(false);
                    }}
                    variant="outline"
                    className="border-blue-400/30 text-blue-300 hover:bg-blue-500/10 font-jetbrains"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scripts List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                <span className="ml-3 text-cyan-300 font-jetbrains">Loading scripts...</span>
              </div>
            ) : scripts.length === 0 ? (
              <Card className="bg-slate-800/50 border-blue-500/30">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-blue-400/50 mx-auto mb-4" />
                  <h3 className="font-jetbrains text-lg font-semibold text-white mb-2">No Scripts</h3>
                  <p className="text-blue-300/70">Upload your first script to get started</p>
                </CardContent>
              </Card>
            ) : (
              scripts.map((script) => (
                <Card key={script.id} className="bg-slate-800/50 border-blue-500/30">
                  <CardContent className="p-6">
                    {editingScript?.id === script.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            value={editingScript.display_name}
                            onChange={(e) => setEditingScript(prev => prev ? { ...prev, display_name: e.target.value } : null)}
                            className="bg-slate-700/50 border-blue-400/30 text-white"
                          />
                          <Input
                            value={editingScript.version}
                            onChange={(e) => setEditingScript(prev => prev ? { ...prev, version: e.target.value } : null)}
                            className="bg-slate-700/50 border-blue-400/30 text-white"
                          />
                          <select
                            value={editingScript.category}
                            onChange={(e) => setEditingScript(prev => prev ? { ...prev, category: e.target.value } : null)}
                            className="px-3 py-2 bg-slate-700/50 border border-blue-400/30 rounded-md text-white"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat} className="bg-slate-800">
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          value={editingScript.description || ''}
                          onChange={(e) => setEditingScript(prev => prev ? { ...prev, description: e.target.value } : null)}
                          placeholder="Description..."
                          rows={2}
                          className="w-full px-3 py-2 bg-slate-700/50 border border-blue-400/30 rounded-md text-white resize-none"
                        />
                        <div className="flex gap-2">
                          <Button onClick={updateScript} size="sm" className="bg-green-600 hover:bg-green-500 font-jetbrains">
                            Save
                          </Button>
                          <Button onClick={() => setEditingScript(null)} variant="outline" size="sm" className="border-blue-400/30 text-blue-300 font-jetbrains">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-jetbrains text-lg font-semibold text-white truncate">
                              {script.display_name}
                            </h3>
                            <Badge variant="outline" className={`${getCategoryColor(script.category)} font-jetbrains text-xs`}>
                              {script.category}
                            </Badge>
                            <Badge variant="outline" className={script.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                              {script.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-blue-300/70 font-jetbrains">
                            <span>v{script.version}</span>
                            <span>{formatFileSize(script.file_size)}</span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {script.download_count} downloads
                            </span>
                            <span>{new Date(script.upload_date).toLocaleDateString()}</span>
                          </div>
                          
                          {script.description && (
                            <p className="text-blue-200/80 text-sm mt-2 line-clamp-2">
                              {script.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            onClick={() => setEditingScript(script)}
                            size="sm"
                            variant="outline"
                            className="border-blue-400/30 text-blue-300 hover:bg-blue-500/10"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            onClick={() => toggleScriptStatus(script)}
                            size="sm"
                            variant="outline"
                            className={script.is_active ? 'border-yellow-400/30 text-yellow-300' : 'border-green-400/30 text-green-300'}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            onClick={() => deleteScript(script)}
                            size="sm"
                            variant="outline"
                            className="border-red-400/30 text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <DownloadAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
