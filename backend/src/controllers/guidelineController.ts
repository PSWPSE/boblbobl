import { Request, Response } from 'express';
import { ApiResponse, PaginatedResponse, CreateGuidelineInput, GuidelineKeywords } from '../types';
import prisma from '../utils/database';

/**
 * 사전 정의된 키워드 목록 조회
 */
export async function getKeywordOptions(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    const keywordOptions = {
      tone: [
        '친절하게',
        '전문성있게',
        '유머러스하게',
        '짧고간결하게',
        '따뜻하게',
        '활기차게',
        '진지하게',
        '캐주얼하게'
      ],
      structure: [
        'Q&A구조',
        '단계별설명',
        '비교분석',
        '스토리텔링',
        '리스트형식',
        '문제해결형',
        '경험담중심',
        '데이터중심'
      ],
      readability: [
        '이해하기쉽게',
        '전문용어최소화',
        '예시많이',
        '시각적요소활용',
        '짧은문장사용',
        'bullet point활용',
        '제목구분명확',
        '요약정리포함'
      ],
      seo: [
        '키워드최적화',
        '제목다양화',
        '메타설명포함',
        '내부링크삽입',
        '롱테일키워드',
        '검색의도반영',
        '구조화데이터',
        '이미지alt텍스트'
      ],
      engagement: [
        '질문던지기',
        '경험담포함',
        '실용적팁',
        '독자참여유도',
        '감정적연결',
        '놀라운사실',
        '행동촉구',
        '커뮤니티형성'
      ],
      format: [
        '리스트활용',
        '소제목구분',
        '이미지설명',
        '표격활용',
        '강조표시',
        '인용구사용',
        '단락구분',
        '결론요약'
      ]
    };

    res.json({
      success: true,
      data: keywordOptions,
      message: '키워드 옵션을 성공적으로 조회했습니다.'
    });
  } catch (error) {
    console.error('Get keyword options error:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
}

/**
 * 사용자의 가이드라인 목록 조회
 */
export async function getGuidelines(req: Request, res: Response<PaginatedResponse<any>>): Promise<void> {
  try {
    if (!req.user || !req.user.userId) {
      (res as any).status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [guidelines, total] = await Promise.all([
      prisma.contentGuideline.findMany({
        where: { userId: req.user.userId! },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { generatedContent: true }
          }
        }
      }),
      prisma.contentGuideline.count({
        where: { userId: req.user.userId! }
      })
    ]);

    res.json({
      success: true,
      data: guidelines,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get guidelines error:', error);
    (res as any).status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
}

/**
 * 특정 가이드라인 조회
 */
export async function getGuidelineById(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { id } = req.params;

    const guideline = await prisma.contentGuideline.findFirst({
      where: {
        id,
        userId: req.user.userId
      },
      include: {
        _count: {
          select: { generatedContent: true }
        }
      }
    });

    if (!guideline) {
      res.status(404).json({
        success: false,
        error: '가이드라인을 찾을 수 없습니다.'
      });
      return;
    }

    res.json({
      success: true,
      data: guideline
    });
  } catch (error) {
    console.error('Get guideline by id error:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
}

/**
 * 새 가이드라인 생성
 */
export async function createGuideline(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { name, keywords, memo, type }: CreateGuidelineInput = req.body;

    // 기본 유효성 검사
    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: '이름은 필수입니다.'
      });
      return;
    }

    if (!type || (type !== 'keywords' && type !== 'memo')) {
      res.status(400).json({
        success: false,
        error: '타입은 keywords 또는 memo여야 합니다.'
      });
      return;
    }

    if (type === 'keywords' && !keywords) {
      res.status(400).json({
        success: false,
        error: '키워드 타입의 경우 키워드는 필수입니다.'
      });
      return;
    }

    if (type === 'memo' && !memo) {
      res.status(400).json({
        success: false,
        error: '메모 타입의 경우 메모는 필수입니다.'
      });
      return;
    }

    // 중복 이름 확인
    const existingGuideline = await prisma.contentGuideline.findFirst({
      where: {
        userId: req.user.userId!,
        name
      }
    });

    if (existingGuideline) {
      res.status(409).json({
        success: false,
        error: '이미 존재하는 가이드라인 이름입니다.'
      });
      return;
    }

    // 가이드라인 생성
    const guideline = await prisma.contentGuideline.create({
      data: {
        userId: req.user.userId!,
        name,
        keywords: type === 'keywords' ? keywords as any : undefined,
        memo: type === 'memo' ? memo : undefined,
        type
      }
    });

    res.status(201).json({
      success: true,
      data: guideline,
      message: '가이드라인이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('Create guideline error:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
}

/**
 * 가이드라인 수정
 */
export async function updateGuideline(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { id } = req.params;
    const { name, keywords, memo, type }: CreateGuidelineInput = req.body;

    // 가이드라인 존재 확인
    const existingGuideline = await prisma.contentGuideline.findFirst({
      where: {
        id,
        userId: req.user.userId!
      }
    });

    if (!existingGuideline) {
      res.status(404).json({
        success: false,
        error: '가이드라인을 찾을 수 없습니다.'
      });
      return;
    }

    // 이름 중복 확인 (자신 제외)
    if (name && name !== existingGuideline.name) {
      const duplicateGuideline = await prisma.contentGuideline.findFirst({
        where: {
          userId: req.user.userId!,
          name,
          NOT: { id }
        }
      });

      if (duplicateGuideline) {
        res.status(409).json({
          success: false,
          error: '이미 존재하는 가이드라인 이름입니다.'
        });
        return;
      }
    }

    // 가이드라인 수정
    const updatedGuideline = await prisma.contentGuideline.update({
      where: { id },
      data: {
        name: name || existingGuideline.name,
        keywords: type === 'keywords' ? keywords as any : undefined,
        memo: type === 'memo' ? memo : undefined,
        type: type || existingGuideline.type
      }
    });

    res.json({
      success: true,
      data: updatedGuideline,
      message: '가이드라인이 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('Update guideline error:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
}

/**
 * 가이드라인 삭제
 */
export async function deleteGuideline(req: Request, res: Response<ApiResponse<any>>): Promise<void> {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
      return;
    }

    const { id } = req.params;

    // 가이드라인 존재 확인
    const existingGuideline = await prisma.contentGuideline.findFirst({
      where: {
        id,
        userId: req.user.userId!
      }
    });

    if (!existingGuideline) {
      res.status(404).json({
        success: false,
        error: '가이드라인을 찾을 수 없습니다.'
      });
      return;
    }

    // 연관된 생성 콘텐츠 확인
    const relatedContent = await prisma.generatedContent.count({
      where: { guidelineId: id }
    });

    if (relatedContent > 0) {
      res.status(400).json({
        success: false,
        error: '이 가이드라인으로 생성된 콘텐츠가 있어 삭제할 수 없습니다.'
      });
      return;
    }

    // 가이드라인 삭제
    await prisma.contentGuideline.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '가이드라인이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete guideline error:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
} 