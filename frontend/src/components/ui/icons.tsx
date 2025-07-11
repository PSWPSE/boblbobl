// 성능 최적화를 위한 아이콘 동적 로딩
import { lazy, Suspense } from 'react';
import { LucideIcon } from 'lucide-react';

// 자주 사용되는 아이콘만 즉시 로드
export {
  // 필수 아이콘
  Brain,
  Sparkles,
  Zap,
  FileText,
  Upload,
  Eye,
  Copy,
  Trash2,
  Settings,
  User,
  // 네비게이션 아이콘
  Home,
  Search,
  Bell,
  Menu,
  X,
  // 기본 UI 아이콘
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  // 로딩 아이콘
  Loader2,
} from 'lucide-react';

// 아이콘 로딩 컴포넌트
const IconLoader = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <div 
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    style={{ width: size, height: size }}
  />
);

// 동적 아이콘 로더
const createDynamicIcon = (iconName: string) => {
  const DynamicIcon = lazy(() => 
    import('lucide-react').then((module) => ({
      default: module[iconName as keyof typeof module] as LucideIcon
    }))
  );

  return ({ size = 16, className = '', ...props }: { size?: number; className?: string; [key: string]: any }) => (
    <Suspense fallback={<IconLoader size={size} className={className} />}>
      <DynamicIcon size={size} className={className} {...props} />
    </Suspense>
  );
};

// 자주 사용되는 동적 아이콘들
export const ArrowRight = createDynamicIcon('ArrowRight');
export const BookOpen = createDynamicIcon('BookOpen');
export const Clock = createDynamicIcon('Clock');
export const RefreshCw = createDynamicIcon('RefreshCw');
export const Target = createDynamicIcon('Target');
export const TrendingUp = createDynamicIcon('TrendingUp');
export const Wand2 = createDynamicIcon('Wand2');
export const Stars = createDynamicIcon('Stars');
export const EyeOff = createDynamicIcon('EyeOff');
export const BarChart3 = createDynamicIcon('BarChart3');
export const Shield = createDynamicIcon('Shield');
export const Globe = createDynamicIcon('Globe');
export const Lightbulb = createDynamicIcon('Lightbulb');
export const AlertTriangle = createDynamicIcon('AlertTriangle');
export const Calendar = createDynamicIcon('Calendar');
export const Edit2 = createDynamicIcon('Edit2');
export const Filter = createDynamicIcon('Filter');
export const History = createDynamicIcon('History');
export const Image = createDynamicIcon('Image');
export const Link = createDynamicIcon('Link');
export const Lock = createDynamicIcon('Lock');
export const LogOut = createDynamicIcon('LogOut');
export const Mail = createDynamicIcon('Mail');
export const MessageSquare = createDynamicIcon('MessageSquare');
export const Bot = createDynamicIcon('Bot');
export const Users = createDynamicIcon('Users');
export const Star = createDynamicIcon('Star');
export const Download = createDynamicIcon('Download');
export const Progress = createDynamicIcon('Progress');

// 아이콘 프리로드 함수 (필요시 사용)
export const preloadIcons = async (iconNames: string[]) => {
  const promises = iconNames.map(iconName => 
    import('lucide-react').then(module => module[iconName as keyof typeof module])
  );
  await Promise.allSettled(promises);
  console.log('🎨 아이콘 프리로드 완료:', iconNames);
};

// 자주 사용되는 아이콘 프리로드
export const preloadCommonIcons = () => {
  preloadIcons([
    'ArrowRight', 'BookOpen', 'Clock', 'RefreshCw', 'Target', 
    'TrendingUp', 'Wand2', 'Stars', 'EyeOff', 'BarChart3'
  ]);
}; 