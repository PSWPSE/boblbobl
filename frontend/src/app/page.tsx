'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Wand2, Target, Upload, FileText, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6" variant="secondary">
              <Sparkles className="w-3 h-3 mr-1" />
              AI 블로그 콘텐츠 생성의 혁신
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Blog<span className="text-blue-600">Craft</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              AI 기술로 네이버 블로그에 최적화된<br />
              <span className="font-semibold text-gray-800">고품질 콘텐츠</span>를 자동으로 생성하세요
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 py-3">
                  무료로 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link href="/generate">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  <Wand2 className="mr-2 h-5 w-5" />
                  콘텐츠 생성 체험
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                AI 필터링 회피 기능
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                5초 만에 콘텐츠 생성
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                SEO 최적화 자동 적용
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              왜 BlogCraft를 선택해야 할까요?
            </h2>
            <p className="text-xl text-gray-600">
              간단한 4단계로 전문적인 블로그 콘텐츠를 완성하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>1. 가이드라인 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  키워드 선택 또는 직접 메모로 원하는 콘텐츠 스타일을 설정하세요.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>2. 파일 업로드</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  PDF, Word, 텍스트 파일을 업로드하거나 URL에서 콘텐츠를 추출하세요.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Wand2 className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>3. AI 콘텐츠 생성</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  최신 GPT-4 기술로 자연스럽고 매력적인 블로그 콘텐츠를 자동 생성합니다.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle>4. 최종 완성</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  제목, 본문, 태그까지 완성된 콘텐츠를 바로 네이버 블로그에 활용하세요.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                블로그 운영이 이렇게 쉬워도 되나요?
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-lg mr-4">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">시간 절약</h4>
                    <p className="text-gray-600">
                      수동으로 몇 시간 걸리던 콘텐츠 작성을 5분 만에 완성하세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-green-100 p-2 rounded-lg mr-4">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">AI 탐지 회피</h4>
                    <p className="text-gray-600">
                      자연스러운 인간적 글쓰기로 AI 필터를 우회합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-lg mr-4">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">SEO 최적화</h4>
                    <p className="text-gray-600">
                      네이버 블로그 검색 알고리즘에 최적화된 콘텐츠를 생성합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">
                  지금 시작해보세요!
                </h4>
                <p className="text-gray-600">
                  회원가입 후 바로 AI 콘텐츠 생성을 체험할 수 있습니다.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">무료 체험</span>
                  <Badge variant="secondary">3개 콘텐츠</Badge>
                </div>
                
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">모든 기능 이용</span>
                  <Badge className="bg-green-100 text-green-800">포함</Badge>
                </div>
                
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">24/7 고객지원</span>
                  <Badge className="bg-blue-100 text-blue-800">제공</Badge>
                </div>
              </div>

              <Link href="/auth/register" className="block mt-6">
                <Button className="w-full" size="lg">
                  무료로 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
              AI와 함께 블로그 콘텐츠 혁신을 경험하세요
            </h3>
            
            <p className="text-xl text-blue-100 mb-8">
              BlogCraft로 더 스마트하고 효율적인 콘텐츠 제작을 시작하세요.
              지금 가입하면 바로 사용할 수 있습니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                  무료 회원가입
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                  이미 회원이신가요?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
