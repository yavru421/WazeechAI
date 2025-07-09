/**
 * Advanced File Handling Service for PWA
 * Handles files launched from OS and provides AI-powered file analysis
 */


import { llamaService } from './llama-api';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

export interface FileAnalysis {
  fileName: string;
  fileType: string;
  fileSize: number;
  contentSummary: string;
  aiInsights: string[];
  detectedLanguage?: string;
  structure?: any;
  keywords: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  readabilityScore?: number;
}

export interface ProcessedFile {
  file: File;
  content: string;
  analysis: FileAnalysis;
  timestamp: Date;
}

export class FileHandlingService {
  private processedFiles: ProcessedFile[] = [];
  /* private supportedTypes = [
    'text/plain', 'text/markdown', 'text/csv', 'text/html',
    'application/json', 'application/xml', 'image/png',
    'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'
  ]; */

  constructor() {
    this.initializeFileHandling();
  }

  private initializeFileHandling() {
    // Check if File Handling API is available
    if ('launchQueue' in window) {
      console.log('🗂️ File Handling API is supported!');

      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        await this.handleLaunchedFiles(launchParams.files);
      });
    } else {
      console.log('📁 File Handling API not supported, using fallback methods');
    }

    // Handle drag and drop
    this.setupDragAndDrop();
  }

  private setupDragAndDrop() {
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      document.body.classList.add('drag-over');
    });

    document.addEventListener('dragleave', (e) => {
      if (!document.body.contains(e.relatedTarget as Node)) {
        document.body.classList.remove('drag-over');
      }
    });

    document.addEventListener('drop', async (e) => {
      e.preventDefault();
      document.body.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        await this.handleFiles(files);
      }
    });
  }

  private async handleLaunchedFiles(fileHandles: any[]) {
    const files: File[] = [];

    for (const fileHandle of fileHandles) {
      try {
        const file = await fileHandle.getFile();
        file.handle = fileHandle; // Store handle for future operations
        files.push(file);
      } catch (error) {
        console.error('Error accessing launched file:', error);
      }
    }

    if (files.length > 0) {
      await this.handleFiles(files);
    }
  }

  async handleFiles(files: File[]): Promise<ProcessedFile[]> {
    const results: ProcessedFile[] = [];

    for (const file of files) {
      try {
        const processed = await this.processFile(file);
        results.push(processed);
        this.processedFiles.push(processed);

        // Dispatch custom event for UI updates
        this.dispatchFileEvent('file-processed', processed);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        this.dispatchFileEvent('file-error', { file, error });
      }
    }

    return results;
  }

  private async processFile(file: File): Promise<ProcessedFile> {
    const content = await this.extractContent(file);
    const analysis = await this.analyzeFile(file, content);

    return {
      file,
      content,
      analysis,
      timestamp: new Date()
    };
  }


  private async extractContent(file: File): Promise<string> {
    // PDF extraction
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return text.trim() || '[PDF file: no extractable text]';
      } catch (e) {
        return '[Could not extract PDF content]';
      }
    }

    // Images
    if (file.type.startsWith('image/')) {
      return '[Image file - visual content not extracted]';
    }

    // For text-based and other files
    try {
      return await file.text();
    } catch (error) {
      return '[Could not extract text content]';
    }
  }

  private async analyzeFile(file: File, content: string): Promise<FileAnalysis> {
    const basicAnalysis: FileAnalysis = {
      fileName: file.name,
      fileType: file.type || this.guessFileType(file.name),
      fileSize: file.size,
      contentSummary: this.generateSummary(content),
      aiInsights: [],
      keywords: this.extractKeywords(content),
      sentiment: this.analyzeSentiment(content)
    };

    // Enhanced AI analysis if content is substantial
    if (content.length > 100 && !file.type.startsWith('image/')) {
      try {
        const aiAnalysis = await this.getAIAnalysis(file, content);
        basicAnalysis.aiInsights = aiAnalysis;
      } catch (error) {
        console.error('AI analysis failed:', error);
        basicAnalysis.aiInsights = ['AI analysis unavailable'];
      }
    }

    // Detect programming language for code files
    if (this.isCodeFile(file.name)) {
      basicAnalysis.detectedLanguage = this.detectLanguage(file.name, content);
      basicAnalysis.structure = this.analyzeCodeStructure(content, basicAnalysis.detectedLanguage);
    }

    // JSON structure analysis
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      try {
        basicAnalysis.structure = this.analyzeJsonStructure(content);
      } catch (error) {
        basicAnalysis.aiInsights.push('Invalid JSON format detected');
      }
    }

    return basicAnalysis;
  }

  private generateSummary(content: string): string {
    if (!content || content.length < 50) return 'Short content';

    const words = content.split(/\s+/).length;
    const lines = content.split('\n').length;
    const chars = content.length;

    return `${words} words, ${lines} lines, ${chars} characters`;
  }

  private extractKeywords(content: string): string[] {
    if (!content) return [];

    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'failed'];

    const words = content.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private async getAIAnalysis(file: File, content: string): Promise<string[]> {
    if (!llamaService.isConfigured()) {
      return ['AI analysis requires API key configuration'];
    }

    const prompt = `Analyze this file and provide insights:

File: ${file.name}
Type: ${file.type}
Size: ${file.size} bytes

Content preview:
${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}

Please provide:
1. A brief description of what this file contains
2. Key insights or patterns you notice
3. Potential use cases or applications
4. Any issues or improvements you'd suggest

Format your response as a bulleted list.`;

    try {
      const response = await llamaService.chat([
        { role: 'user', content: prompt }
      ], 'Llama-3.3-70B-Instruct', { maxTokens: 300 });

      return response.content.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
        .filter(line => line.length > 0);
    } catch (error) {
      return ['AI analysis failed - please check your API configuration'];
    }
  }

  private isCodeFile(fileName: string): boolean {
    const codeExtensions = [
      '.js', '.ts', '.py', '.java', '.cpp', '.c', '.cs', '.php',
      '.rb', '.go', '.rs', '.swift', '.kotlin', '.dart', '.vue',
      '.jsx', '.tsx', '.html', '.css', '.scss', '.less', '.sql'
    ];
    return codeExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  private detectLanguage(_fileName: string, _content: string): string {
    const extension = _fileName.split('.').pop()?.toLowerCase();

    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript', 'ts': 'TypeScript', 'py': 'Python',
      'java': 'Java', 'cpp': 'C++', 'c': 'C', 'cs': 'C#',
      'php': 'PHP', 'rb': 'Ruby', 'go': 'Go', 'rs': 'Rust',
      'swift': 'Swift', 'kt': 'Kotlin', 'dart': 'Dart',
      'html': 'HTML', 'css': 'CSS', 'sql': 'SQL'
    };

    return languageMap[extension || ''] || 'Unknown';
  }

  private analyzeCodeStructure(_content: string, _language?: string): any {
    const structure: any = {
      functions: [],
      classes: [],
      imports: [],
      comments: 0
    };

    const lines = _content.split('\n');

    lines.forEach((line: string) => {
      const trimmed = line.trim();

      // Count comments
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
        structure.comments++;
      }

      // Detect functions (basic patterns)
      if (trimmed.includes('function ') || trimmed.includes('def ') ||
          trimmed.match(/^\s*\w+\s*\(/)) {
        const match = trimmed.match(/(?:function\s+|def\s+)(\w+)|(\w+)\s*\(/);
        if (match) {
          structure.functions.push(match[1] || match[2]);
        }
      }

      // Detect classes
      if (trimmed.includes('class ')) {
        const match = trimmed.match(/class\s+(\w+)/);
        if (match) {
          structure.classes.push(match[1]);
        }
      }

      // Detect imports
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ') ||
          trimmed.startsWith('#include')) {
        structure.imports.push(trimmed);
      }
    });

    return structure;
  }

  private analyzeJsonStructure(content: string): any {
    try {
      const parsed = JSON.parse(content);
      return this.getObjectStructure(parsed);
    } catch (error) {
      throw new Error('Invalid JSON');
    }
  }

  private getObjectStructure(obj: any, depth = 0): any {
    if (depth > 3) return '[Deep nesting...]';

    if (Array.isArray(obj)) {
      return {
        type: 'array',
        length: obj.length,
        sample: obj.length > 0 ? this.getObjectStructure(obj[0], depth + 1) : null
      };
    }

    if (typeof obj === 'object' && obj !== null) {
      const structure: any = { type: 'object', properties: {} };
      Object.keys(obj).slice(0, 10).forEach(key => {
        structure.properties[key] = this.getObjectStructure(obj[key], depth + 1);
      });
      return structure;
    }

    return typeof obj;
  }

  private guessFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const typeMap: { [key: string]: string } = {
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json',
      'csv': 'text/csv',
      'html': 'text/html',
      'xml': 'application/xml',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    return typeMap[extension || ''] || 'application/octet-stream';
  }

  private dispatchFileEvent(type: string, detail: any) {
    window.dispatchEvent(new CustomEvent(`file-handler-${type}`, { detail }));
  }

  // Public methods for UI integration
  getProcessedFiles(): ProcessedFile[] {
    return [...this.processedFiles];
  }

  clearProcessedFiles(): void {
    this.processedFiles = [];
  }

  async reanalyzeFile(processedFile: ProcessedFile): Promise<FileAnalysis> {
    return await this.analyzeFile(processedFile.file, processedFile.content);
  }

  exportAnalysis(processedFiles: ProcessedFile[] = this.processedFiles): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalFiles: processedFiles.length,
      files: processedFiles.map(pf => ({
        fileName: pf.analysis.fileName,
        analysis: pf.analysis,
        processedAt: pf.timestamp
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  async createFileInsightConversation(processedFile: ProcessedFile): Promise<string> {
    const insights = processedFile.analysis.aiInsights.join('\n• ');
    const keywords = processedFile.analysis.keywords.join(', ');

    return `📁 **File Analysis: ${processedFile.analysis.fileName}**

**File Details:**
• Type: ${processedFile.analysis.fileType}
• Size: ${(processedFile.analysis.fileSize / 1024).toFixed(1)} KB
• ${processedFile.analysis.contentSummary}

**AI Insights:**
• ${insights}

**Keywords:** ${keywords}

**Sentiment:** ${processedFile.analysis.sentiment || 'neutral'}

Would you like me to analyze this file further or help you with specific questions about its content?`;
  }
}

export const fileHandlingService = new FileHandlingService();
