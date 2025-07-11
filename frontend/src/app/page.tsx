'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Brain, Check, CheckCircle, FileText, Image, Search, Shield, Sparkles, Star, Target, TrendingUp, Upload, Users, Wand2, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 gradient-hero opacity-90"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50"></div>
      
      {/* Floating elements */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="spacing-section pt-32 pb-20">
          <div className="spacing-container">
            <div className="max-w-5xl mx-auto text-center">
              <div className="animate-fade-in">
                <Badge className="mb-8 bg-white/20 border-white/30 text-white backdrop-blur-sm hover:bg-white/30 transition-all duration-300">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 블로그 콘텐츠 생성의 혁신
                </Badge>
                
                <h1 className="text-hero text-white mb-8 text-shadow animate-slide-up">
                  Blog<span className="text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">Craft</span>
                </h1>
                
                <p className="text-subtitle text-white/90 mb-12 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
                  AI 기술로 네이버 블로그에 최적화된<br />
                  <span className="font-semibold text-yellow-300">고품질 콘텐츠</span>를 자동으로 생성하세요
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-slide-up" style={{animationDelay: '0.4s'}}>
                  <Link href="/auth/register">
                    <Button size="lg" className="btn-gradient text-lg px-8 py-4 shadow-2xl hover:shadow-3xl">
                      <Star className="mr-2 h-5 w-5" />
                      무료로 시작하기
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  
                  <Link href="/generate">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="text-lg px-8 py-4 bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm transition-all duration-300"
                    >
                      <Wand2 className="mr-2 h-5 w-5" />
                      콘텐츠 생성 체험
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '0.6s'}}>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">10K+</div>
                    <div className="text-white/80 text-sm">생성된 콘텐츠</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">500+</div>
                    <div className="text-white/80 text-sm">활성 사용자</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">98%</div>
                    <div className="text-white/80 text-sm">만족도</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="spacing-section bg-gradient-to-b from-transparent to-white/50">
          <div className="spacing-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-slide-up">
                간단한 4단계로 완성
              </h2>
              <p className="text-subtitle animate-slide-up" style={{animationDelay: '0.1s'}}>
                복잡한 설정 없이 몇 분만에 고품질 블로그 콘텐츠를 만들어보세요
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: '01',
                  title: '가이드라인 설정',
                  description: '키워드 선택 또는 직접 메모로 원하는 콘텐츠 스타일을 설정하세요.',
                  icon: Target,
                  color: 'from-blue-500 to-cyan-500'
                },
                {
                  step: '02',
                  title: '파일 업로드',
                  description: 'PDF, Word, 텍스트 파일을 업로드하거나 URL에서 콘텐츠를 추출하세요.',
                  icon: Upload,
                  color: 'from-green-500 to-emerald-500'
                },
                {
                  step: '03',
                  title: 'AI 콘텐츠 생성',
                  description: '최신 GPT-4 기술로 자연스럽고 매력적인 블로그 콘텐츠를 자동 생성합니다.',
                  icon: Wand2,
                  color: 'from-purple-500 to-pink-500'
                },
                {
                  step: '04',
                  title: '최종 완성',
                  description: '제목, 본문, 태그까지 완성된 콘텐츠를 바로 네이버 블로그에 활용하세요.',
                  icon: FileText,
                  color: 'from-orange-500 to-red-500'
                }
              ].map((item, index) => (
                <Card key={index} className="modern-card group animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <CardHeader className="text-center">
                    <div className="relative mx-auto mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <item.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-gray-800 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {item.step}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="spacing-section bg-white/70 backdrop-blur-sm">
          <div className="spacing-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="animate-slide-up">
                <Badge className="mb-6 bg-blue-50 text-blue-600 border-blue-200">
                  <Zap className="w-4 h-4 mr-2" />
                  핵심 기능
                </Badge>
                <h3 className="text-4xl font-bold text-gray-900 mb-6">
                  AI 기술로 더 스마트하게
                </h3>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  최신 AI 기술과 네이버 블로그 최적화 노하우를 결합하여 
                  누구나 쉽게 고품질 콘텐츠를 만들 수 있습니다.
                </p>

                <div className="space-y-6">
                  {[
                    {
                      icon: Shield,
                      title: "AI 탐지 우회",
                      description: "자연스러운 문체로 AI 탐지를 우회하는 콘텐츠를 생성합니다."
                    },
                    {
                      icon: Target,
                      title: "SEO 최적화",
                      description: "네이버 블로그 검색 알고리즘에 최적화된 콘텐츠를 생성합니다."
                    },
                    {
                      icon: TrendingUp,
                      title: "품질 보장",
                      description: "전문가 수준의 콘텐츠 품질과 가독성을 보장합니다."
                    }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
                <Card className="modern-card p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      지금 시작해보세요!
                    </h4>
                    <p className="text-gray-600">
                      회원가입 후 바로 AI 콘텐츠 생성을 체험할 수 있습니다.
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {[
                      { label: "무료 체험", value: "3개 콘텐츠", color: "bg-blue-50 text-blue-600" },
                      { label: "모든 기능 이용", value: "포함", color: "bg-green-50 text-green-600" },
                      { label: "24/7 고객지원", value: "제공", color: "bg-purple-50 text-purple-600" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-gray-700">{item.label}</span>
                        </div>
                        <Badge className={item.color}>{item.value}</Badge>
                      </div>
                    ))}
                  </div>

                  <Link href="/auth/register">
                    <Button className="w-full btn-gradient text-lg py-3">
                      <Star className="mr-2 h-5 w-5" />
                      무료로 시작하기
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="spacing-section bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="spacing-container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="animate-slide-up">
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 text-shadow">
                  AI와 함께 블로그 콘텐츠 혁신을 경험하세요
                </h3>
                
                <p className="text-xl text-white/90 mb-12 leading-relaxed">
                  BlogCraft로 더 스마트하고 효율적인 콘텐츠 제작을 시작하세요.
                  <br />지금 가입하면 바로 사용할 수 있습니다.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Link href="/auth/register">
                    <Button size="lg" className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 shadow-2xl">
                      <Star className="mr-2 h-5 w-5" />
                      무료 회원가입
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                      이미 회원이신가요?
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
