'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Brain, Check, CheckCircle, FileText, Image, Search, Shield, Sparkles, Star, Target, TrendingUp, Upload, Users, Wand2, Zap, BookOpen, MessageSquare, Link as LinkIcon, ThumbsUp, Clock, Award } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 gradient-hero opacity-90"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-green-50/50 to-blue-50/50"></div>
      
      {/* Floating elements */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="spacing-section pt-32 pb-20">
          <div className="spacing-container">
            <div className="max-w-6xl mx-auto text-center">
              <div className="animate-fade-in">
                <Badge className="mb-8 bg-green-500/20 border-green-400/30 text-green-100 backdrop-blur-sm hover:bg-green-500/30 transition-all duration-300">
                  <Sparkles className="w-4 h-4 mr-2" />
                  네이버 블로그 전용 AI 콘텐츠 생성
                </Badge>
                
                <h1 className="text-hero text-white mb-8 text-shadow animate-slide-up">
                  <span className="text-transparent bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text">네이버 블로그</span>를 위한<br />
                  AI 콘텐츠 생성 서비스
                </h1>
                
                <p className="text-subtitle text-white/90 mb-12 max-w-4xl mx-auto animate-slide-up leading-relaxed" style={{animationDelay: '0.2s'}}>
                  3가지 방법으로 누구나 쉽게 고품질 블로그 콘텐츠를 생성하세요<br />
                  <span className="font-semibold text-green-300">주제만 입력</span>하거나 <span className="font-semibold text-blue-300">뉴스를 활용</span>해서 바로 시작!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start Section */}
        <section className="spacing-section bg-white/10 backdrop-blur-sm">
          <div className="spacing-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4 animate-slide-up">
                  3가지 방법으로 바로 시작
                </h2>
                <p className="text-white/80 text-lg animate-slide-up" style={{animationDelay: '0.1s'}}>
                  회원가입 없이도 지금 바로 체험해보세요
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {[
                  {
                    icon: MessageSquare,
                    title: '주제 입력으로 생성',
                    description: '관심 주제만 입력하면\nAI가 자동으로 블로그 글 작성',
                    example: '"맛집 추천" → 완성된 맛집 리뷰 글',
                    color: 'from-green-500 to-emerald-600',
                    href: '/generate?type=topic',
                    badge: '가장 인기'
                  },
                  {
                    icon: FileText,
                    title: '뉴스 기사로 변환',
                    description: '뉴스 텍스트를 복사해서\n자연스러운 블로그 글로 재구성',
                    example: '뉴스 기사 → 개인적인 시각의 블로그 글',
                    color: 'from-blue-500 to-cyan-600',
                    href: '/generate?type=news',
                    badge: '추천'
                  },
                  {
                    icon: LinkIcon,
                    title: '뉴스 링크로 자동 생성',
                    description: '뉴스 링크만 붙여넣으면\n자동으로 콘텐츠 추출 후 생성',
                    example: 'URL 링크 → 완성된 블로그 콘텐츠',
                    color: 'from-purple-500 to-pink-600',
                    href: '/generate?type=url',
                    badge: '자동화'
                  }
                ].map((method, index) => (
                  <Card key={index} className="modern-card group hover:scale-105 transition-all duration-300 bg-white/95 backdrop-blur-sm animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                    <CardHeader className="text-center relative">
                      {method.badge && (
                        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white">
                          {method.badge}
                        </Badge>
                      )}
                      <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${method.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <method.icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2">{method.title}</CardTitle>
                      <CardDescription className="text-gray-600 whitespace-pre-line leading-relaxed">
                        {method.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-600 font-medium">{method.example}</p>
                      </div>
                      <Link href={method.href}>
                        <Button className={`w-full bg-gradient-to-r ${method.color} hover:shadow-lg transition-all duration-300`}>
                          <Wand2 className="mr-2 h-4 w-4" />
                          바로 체험하기
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center animate-slide-up" style={{animationDelay: '0.4s'}}>
                <Link href="/auth/register">
                  <Button size="lg" className="bg-gradient-to-r from-green-500 to-blue-600 text-lg px-12 py-4 shadow-2xl hover:shadow-3xl transition-all duration-300">
                    <Star className="mr-2 h-5 w-5" />
                    회원가입하고 무제한 이용하기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-white/70 text-sm mt-3">무료 체험 → 회원가입 시 무제한 이용</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="spacing-section bg-white/90 backdrop-blur-sm">
          <div className="spacing-container">
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-green-50 text-green-600 border-green-200">
                <Award className="w-4 h-4 mr-2" />
                네이버 블로그 특화 기능
              </Badge>
              <h3 className="text-4xl font-bold text-gray-900 mb-6 animate-slide-up">
                왜 BlogCraft를 선택해야 할까요?
              </h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.1s'}}>
                일반적인 AI 도구가 아닌, 네이버 블로그에 특화된 전문 서비스입니다
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {[
                {
                  icon: Target,
                  title: "네이버 블로그 최적화",
                  description: "네이버 검색 알고리즘과 블로그 특성에 맞춘 콘텐츠 생성",
                  color: "from-green-500 to-emerald-600"
                },
                {
                  icon: Shield,
                  title: "자연스러운 문체",
                  description: "AI가 쓴 것 같지 않은 자연스럽고 개성 있는 글쓰기",
                  color: "from-blue-500 to-cyan-600"
                },
                {
                  icon: Clock,
                  title: "빠른 생성 속도",
                  description: "평균 30초 내 고품질 블로그 콘텐츠 완성",
                  color: "from-purple-500 to-pink-600"
                },
                {
                  icon: ThumbsUp,
                  title: "높은 완성도",
                  description: "제목, 본문, 태그까지 바로 사용 가능한 완성된 콘텐츠",
                  color: "from-orange-500 to-red-600"
                },
                {
                  icon: BookOpen,
                  title: "다양한 주제 지원",
                  description: "일상, 여행, 음식, 리뷰 등 모든 블로그 주제 대응",
                  color: "from-indigo-500 to-blue-600"
                },
                {
                  icon: Wand2,
                  title: "스마트 편집 기능",
                  description: "생성 후 원하는 부분만 수정하거나 재생성 가능",
                  color: "from-pink-500 to-rose-600"
                }
              ].map((feature, index) => (
                <Card key={index} className="modern-card group hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <CardHeader>
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="spacing-section bg-gradient-to-r from-green-500 to-blue-600">
          <div className="spacing-container">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4 animate-slide-up">
                이미 많은 블로거들이 사용하고 있어요
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { number: "1,000+", label: "생성된 블로그 글", icon: FileText },
                { number: "300+", label: "활성 사용자", icon: Users },
                { number: "95%", label: "사용자 만족도", icon: ThumbsUp },
                { number: "30초", label: "평균 생성 시간", icon: Clock }
              ].map((stat, index) => (
                <div key={index} className="text-center animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-white/80 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="spacing-section bg-white">
          <div className="spacing-container">
            <div className="max-w-4xl mx-auto text-center">
              <div className="animate-fade-in">
                <h3 className="text-4xl font-bold text-gray-900 mb-6">
                  지금 바로 시작해보세요
                </h3>
                <p className="text-xl text-gray-600 mb-8">
                  무료 체험으로 AI 콘텐츠 생성의 놀라운 결과를 경험해보세요
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Link href="/generate">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2 border-gray-300 hover:border-gray-400 transition-all duration-300">
                      <Wand2 className="mr-2 h-5 w-5" />
                      먼저 체험해보기
                    </Button>
                  </Link>
                  
                  <Link href="/auth/register">
                    <Button size="lg" className="bg-gradient-to-r from-green-500 to-blue-600 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Star className="mr-2 h-5 w-5" />
                      무료 회원가입
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
                
                <p className="text-gray-500 text-sm mt-6">
                  신용카드 등록 불필요 • 언제든 무료 체험 가능
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
