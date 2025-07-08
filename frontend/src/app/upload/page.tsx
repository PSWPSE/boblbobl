'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Link, Trash2, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface SourceData {
  id: string;
  filename: string;
  fileType: string;
  fileUrl: string;
  extractedText: string;
  createdAt: string;
  metadata: {
    fileSize?: number;
    wordCount?: number;
    charCount?: number;
    [key: string]: any;
  };
  _count: {
    generatedContent: number;
  };
}

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlProcessing, setUrlProcessing] = useState(false);
  const [url, setUrl] = useState('');
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SourceData | null>(null);

  // 파일 드롭존 설정
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // 파일 업로드
  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/upload/file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '파일 업로드에 실패했습니다.');
      }

      const data = await response.json();
      toast.success('파일이 성공적으로 업로드되었습니다.');
      
      // 업로드 후 목록 새로고침
      fetchSourceData();
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // URL 처리
  const processUrl = async () => {
    if (!url.trim()) {
      toast.error('URL을 입력해주세요.');
      return;
    }

    setUrlProcessing(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/upload/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'URL 처리에 실패했습니다.');
      }

      const data = await response.json();
      toast.success('URL 콘텐츠가 성공적으로 처리되었습니다.');
      
      setUrl('');
      fetchSourceData();
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'URL 처리 중 오류가 발생했습니다.');
    } finally {
      setUrlProcessing(false);
    }
  };

  // 소스 데이터 목록 조회
  const fetchSourceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/upload`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('소스 데이터를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSourceData(data.data.items || []);
    } catch (error) {
      toast.error('소스 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 소스 데이터 삭제
  const deleteSourceData = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/upload/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('소스 데이터 삭제에 실패했습니다.');
      }

      toast.success('소스 데이터가 삭제되었습니다.');
      fetchSourceData();
    } catch (error) {
      toast.error('소스 데이터 삭제에 실패했습니다.');
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 파일 타입 아이콘
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📰';
      case 'url':
        return '🌐';
      default:
        return '📄';
    }
  };

  // 초기 데이터 로드
  React.useEffect(() => {
    fetchSourceData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">파일 업로드</h1>
        <p className="text-gray-600 mt-2">
          PDF, Word, 텍스트 파일을 업로드하거나 URL에서 콘텐츠를 추출하세요.
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">파일 업로드</TabsTrigger>
          <TabsTrigger value="files">업로드한 파일</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* 파일 업로드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                파일 업로드
              </CardTitle>
              <CardDescription>
                PDF, DOC, DOCX, TXT 파일을 업로드하세요. (최대 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600">파일을 여기에 드롭하세요...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      파일을 드래그하거나 클릭하여 선택하세요
                    </p>
                    <p className="text-sm text-gray-500">
                      지원 형식: PDF, DOC, DOCX, TXT (최대 10MB)
                    </p>
                  </div>
                )}
              </div>

              {uploading && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-gray-600 mt-2">업로드 중...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* URL 처리 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link className="mr-2 h-5 w-5" />
                URL 콘텐츠 추출
              </CardTitle>
              <CardDescription>
                뉴스 기사나 블로그 URL에서 텍스트를 추출합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="url">URL 입력</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/news-article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={processUrl}
                    disabled={urlProcessing || !url.trim()}
                    className="min-w-[100px]"
                  >
                    {urlProcessing ? '처리 중...' : '추출'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>업로드한 파일</CardTitle>
              <CardDescription>
                업로드한 파일들을 관리하고 텍스트를 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">로딩 중...</div>
                </div>
              ) : sourceData.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">아직 업로드한 파일이 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    파일을 업로드하거나 URL을 추출해보세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sourceData.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getFileTypeIcon(file.fileType)}
                        </div>
                        <div>
                          <h3 className="font-medium">{file.filename}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Badge variant="outline">{file.fileType.toUpperCase()}</Badge>
                            {file.metadata.fileSize && (
                              <span>{formatFileSize(file.metadata.fileSize)}</span>
                            )}
                            {file.metadata.wordCount && (
                              <span>{file.metadata.wordCount}단어</span>
                            )}
                            <span>{file._count.generatedContent}개 콘텐츠</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFile(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSourceData(file.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 파일 내용 미리보기 모달 */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedFile.filename}</h2>
                <p className="text-sm text-gray-600">
                  {selectedFile.metadata.charCount}자 | {selectedFile.metadata.wordCount}단어
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedFile(null)}
              >
                닫기
              </Button>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">
                {selectedFile.extractedText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 